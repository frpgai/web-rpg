import { useCallback, useState } from 'react';
import { HTTPError } from 'ky';
import { sceneApi } from '../../../api/services/scene';
import { rollD20 } from '../../../utils/dice';
import type { InvestigatePoiResponse } from '../../../types';

type Result = {
  investigate: (sceneId: string, poiId: string, sessionId: string) => Promise<InvestigatePoiResponse | null>;
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
 * NOTA (limitação conhecida / decisão pendente): o backend
 * (be-rpg branch feature/poi-investigation, PR #68 — ainda não mergeada em
 * main) espera `result` já somado (d20 + bônus de perícia do herói) e só
 * compara `result >= dc`, sem somar bônus nenhum ele mesmo. Somar o bônus de
 * perícia aqui violaria a Regra de Ouro de web-rpg/CLAUDE.md ("nenhum
 * cálculo de stats no frontend"). Por isso, por enquanto, `result` é apenas
 * o d20 puro — o líder/usuário precisa decidir se o contrato do backend
 * deve mudar para receber só o d20 e somar o bônus do herói já conhecido no
 * banco, ou se essa soma no cliente é uma exceção aprovada. Ver mensagem
 * enviada para a sessão principal reportando esse conflito.
 */
export function useInvestigatePoi(): Result {
  const [investigating, setInvestigating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const investigate = useCallback(async (sceneId: string, poiId: string, sessionId: string) => {
    setInvestigating(true);
    setErrorMessage(null);
    try {
      const roll = rollD20();
      // TODO: somar bônus de perícia do herói ao `roll` antes de enviar,
      // assim que a decisão acima for tomada. Hoje envia o d20 puro.
      const response = await sceneApi.investigatePoi(sceneId, poiId, {
        session_id: sessionId,
        result: roll,
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
