import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api/services/catalog';
import type { Ancestry, Background, PreviewResult, CharacterClass } from '../types';

interface OriginsStepState {
  ancestries: Ancestry[];
  classes: CharacterClass[];
  backgrounds: Background[];
  preview: PreviewResult | null;
  catalogLoading: boolean;
  previewLoading: boolean;
  catalogError: string | null;
  previewError: string | null;
}

export function useOriginsStep() {
  const [state, setState] = useState<OriginsStepState>({
    ancestries: [],
    classes: [],
    backgrounds: [],
    preview: null,
    catalogLoading: true,
    previewLoading: false,
    catalogError: null,
    previewError: null,
  });

  const loadCatalog = useCallback(async () => {
    setState((prev) => ({ ...prev, catalogLoading: true, catalogError: null }));
    try {
      const [ancestries, classes, backgrounds] = await Promise.all([
        catalogApi.ancestries(),
        catalogApi.classes(),
        catalogApi.backgrounds(),
      ]);
      setState((prev) => ({
        ...prev,
        ancestries,
        classes,
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
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const fetchPreview = useCallback(
    async (
      ancestryId: string | null,
      classId: string | null,
      backgroundId: string | null,
    ) => {
      setState((prev) => ({ ...prev, previewLoading: true, previewError: null }));
      try {
        const result = await catalogApi.previewHero({
          ancestry_id: ancestryId,
          characterClass_id: classId,
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
          // Keep previous preview on error
          previewLoading: false,
          previewError: 'Não foi possível calcular o espectro.',
        }));
      }
    },
    [],
  );

  return {
    ...state,
    reloadCatalog: loadCatalog,
    fetchPreview,
  };
}
