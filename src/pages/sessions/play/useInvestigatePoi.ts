import { useCallback, useState } from 'react';
import { HTTPError } from 'ky';
import { sceneApi } from '../../../api/services/scene';
import { rollD20 } from '../../../utils/dice';
import type { InvestigatePoiResponse } from '../../../types';

type Result = {
  investigate: (
    sceneId: string,
    poiId: string,
    sessionId: string,
    heroId: string
  ) => Promise<InvestigatePoiResponse | null>;
  investigating: boolean;
  errorMessage: string | null;
  clearError: () => void;
};

async function messageForError(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    switch (err.response.status) {
      case 404:
        return 'Ponto de interesse ou cena não encontrados.';
      case 409:
        return 'Este ponto de interesse já foi descoberto.';
      case 400:
        return 'Este ponto de interesse não tem um teste de perícia configurado.';
      case 401:
        return 'Sua sessão expirou. Faça login novamente.';
      default:
        return 'Não foi possível investigar agora. Tente novamente.';
    }
  }
  return 'Não foi possível investigar agora. Tente novamente.';
}

/**
 * Fluxo de "Investigar" um POI oculto — spec A00153.
 *
 * O cliente envia apenas o d20 puro (`roll`, 1-20) e o `hero_id` ativo do
 * jogador; o backend (be-rpg branch feature/poi-investigation, PR #68,
 * commit 4c7baa0) resolve modificador de atributo + bônus de proficiência
 * da perícia configurada no POI e soma ao roll, retornando `total` já
 * calculado. Nenhum cálculo de stats (modificador/proficiência/resultado
 * final) acontece aqui, conforme a Regra de Ouro de web-rpg/CLAUDE.md.
 */
export function useInvestigatePoi(): Result {
  const [investigating, setInvestigating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const investigate = useCallback(async (sceneId: string, poiId: string, sessionId: string, heroId: string) => {
    setInvestigating(true);
    setErrorMessage(null);
    try {
      const roll = rollD20();
      const response = await sceneApi.investigatePoi(sceneId, poiId, {
        session_id: sessionId,
        hero_id: heroId,
        roll,
      });
      return response;
    } catch (err) {
      setErrorMessage(await messageForError(err));
      return null;
    } finally {
      setInvestigating(false);
    }
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return { investigate, investigating, errorMessage, clearError };
}
