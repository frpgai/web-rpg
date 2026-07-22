import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../../../../../api/services/catalog';
import { heroApi } from '../../../../../api/services/hero';
import { getSystemAttributes } from '../../../../../api/services/attributes';
import type { SystemAttribute } from '../../../../../api/services/attributes';
import type { Ancestry, Background, DraftHero, PreviewResult, Vocation } from '../../../../../types';

interface OriginsDataState {
  ancestries: Ancestry[];
  vocations: Vocation[];
  backgrounds: Background[];
  systemAttributes: SystemAttribute[];

  preview: PreviewResult | null;
  previewLoading: boolean;
  previewError: string | null;

  draft: DraftHero | null;
  draftError: string | null;
}

// All API calls for the origins step (catalog, preview, draft), isolated
// from OriginsPage's UI/selection logic. No silent catches: every failure
// sets a visible error string, nothing is swallowed.
export function useOriginsData() {
  const [state, setState] = useState<OriginsDataState>({
    ancestries: [],
    vocations: [],
    backgrounds: [],
    systemAttributes: [],

    preview: null,
    previewLoading: false,
    previewError: null,

    draft: null,
    draftError: null,
  });

  useEffect(() => {
    catalogApi.ancestries()
      .then((ancestries) => setState((prev) => ({ ...prev, ancestries })))
      .catch((err: unknown) => {
        console.error('useOriginsData: loadAncestries failed', err);
      });
    catalogApi.vocations()
      .then((vocations) => setState((prev) => ({ ...prev, vocations })))
      .catch((err: unknown) => {
        console.error('useOriginsData: loadVocations failed', err);
      });
    catalogApi.backgrounds()
      .then((backgrounds) => setState((prev) => ({ ...prev, backgrounds })))
      .catch((err: unknown) => {
        console.error('useOriginsData: loadBackgrounds failed', err);
      });
    getSystemAttributes()
      .then((systemAttributes) => setState((prev) => ({ ...prev, systemAttributes })))
      .catch((err: unknown) => {
        console.error('useOriginsData: loadSystemAttributes failed', err);
      });
  }, []);

  const fetchPreview = useCallback(
    async (
      ancestryId: string | null,
      vocationId: string | null,
      backgroundId: string | null,
    ) => {
      setState((prev) => ({ ...prev, previewLoading: true, previewError: null }));
      try {
        const result = await heroApi.preview({
          ancestry_id: ancestryId,
          vocation_id: vocationId,
          background_id: backgroundId,
        });
        setState((prev) => ({
          ...prev,
          preview: result,
          previewLoading: false,
          previewError: null,
        }));
      } catch (err: unknown) {
        console.error('useOriginsData: fetchPreview failed', err);
        setState((prev) => ({
          ...prev,
          previewLoading: false,
          previewError: 'Não foi possível calcular o espectro.',
        }));
      }
    },
    [],
  );

  const loadDraft = useCallback(async () => {
    setState((prev) => ({ ...prev, draftError: null }));
    try {
      const draft = await heroApi.getDraft();
      setState((prev) => ({ ...prev, draft }));
    } catch (err: unknown) {
      console.error('useOriginsData: loadDraft failed', err);
      setState((prev) => ({ ...prev, draftError: 'Não foi possível carregar a criação em andamento.' }));
    }
  }, []);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const discardDraft = useCallback(async () => {
    try {
      await heroApi.deleteDraft();
      setState((prev) => ({ ...prev, draft: null, draftError: null }));
    } catch (err: unknown) {
      console.error('useOriginsData: discardDraft failed', err);
      setState((prev) => ({
        ...prev,
        draftError: 'Não foi possível descartar a criação em andamento.',
      }));
      throw err;
    }
  }, []);

  const saveDraft = useCallback(
    async (data: { ancestry_id: string; vocation_id: string; background_id: string }) => {
      try {
        return await heroApi.saveDraft({ draft_step: 'origins', ...data });
      } catch (err: unknown) {
        console.error('useOriginsData: saveDraft failed', err);
        setState((prev) => ({
          ...prev,
          draftError: 'Não foi possível salvar o progresso.',
        }));
        throw err;
      }
    },
    [],
  );

  return {
    ...state,
    fetchPreview,
    reloadDraft: loadDraft,
    discardDraft,
    saveDraft,
  };
}
