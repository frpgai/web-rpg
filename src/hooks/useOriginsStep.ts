import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api/services/catalog';
import { useSystemStore } from '../stores/systemStore';
import type { Ancestry, Background, PreviewResult, Vocation } from '../types';

interface OriginsStepState {
  ancestries: Ancestry[];
  vocations: Vocation[];
  backgrounds: Background[];
  preview: PreviewResult | null;
  catalogLoading: boolean;
  previewLoading: boolean;
  catalogError: string | null;
  previewError: string | null;
}

export function useOriginsStep() {
  const { currentSystem } = useSystemStore();
  const [state, setState] = useState<OriginsStepState>({
    ancestries: [],
    vocations: [],
    backgrounds: [],
    preview: null,
    catalogLoading: true,
    previewLoading: false,
    catalogError: null,
    previewError: null,
  });

  const loadCatalog = useCallback(async () => {
    if (!currentSystem?.id) return;
    setState((prev) => ({ ...prev, catalogLoading: true, catalogError: null }));
    try {
      const systemId = currentSystem.id;
      const [ancestries, vocations, backgrounds] = await Promise.all([
        catalogApi.ancestries(systemId),
        catalogApi.vocations(systemId),
        catalogApi.backgrounds(systemId),
      ]);
      setState((prev) => ({
        ...prev,
        ancestries,
        vocations,
        backgrounds,
        catalogLoading: false,
        catalogError: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        catalogLoading: false,
        catalogError: 'Não foi possível carregar o catálogo.',
      }));
    }
  }, [currentSystem?.id]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const fetchPreview = useCallback(
    async (
      ancestryId: string | null,
      vocationId: string | null,
      backgroundId: string | null,
    ) => {
      setState((prev) => ({ ...prev, previewLoading: true, previewError: null }));
      try {
        const result = await catalogApi.previewHeroV2({
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
      } catch {
        setState((prev) => ({
          ...prev,
          previewLoading: false,
          previewError: 'Não foi possível calcular o espectro.',
        }));
      }
    },
    [],
  );

  return {
    ...state,
    // Keep backward-compatible alias
    classes: state.vocations,
    reloadCatalog: loadCatalog,
    fetchPreview,
  };
}
