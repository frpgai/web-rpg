import { useState } from 'react';
import { HTTPError } from 'ky';
import { NEXT_PHASE_NO_NEXT_PHASE_CODE, sessionApi } from '../api/services/session';

type Options = {
  /** Chamado quando o Host já destrancou a próxima fase e ela foi revelada com sucesso. */
  onAdvance: () => void;
  /**
   * Chamado quando o backend responde 422 `NO_NEXT_PHASE` — o jogador já
   * revelou tudo que está disponível e precisa aguardar o Host destrancar a
   * próxima fase globalmente. Não é um erro genérico.
   */
  onWaitingForHost: () => void;
};

async function isNoNextPhaseError(err: unknown): Promise<boolean> {
  if (!(err instanceof HTTPError) || err.response.status !== 422) return false;
  try {
    const body = (await err.response.clone().json()) as { code?: string };
    return body?.code === NEXT_PHASE_NO_NEXT_PHASE_CODE;
  } catch {
    // Corpo 422 sem JSON válido — trata como espera mesmo assim, já que o
    // status já indica "aguardando o Host avançar a sessão" nesta rota.
    return true;
  }
}

/**
 * Avança a fase individual do jogador via `POST /sessions/:id/next-phase`
 * (be-rpg PR #73 — fluxo híbrido de fases). Usado pelos CTAs de cada fase
 * (`CampaignPhase`, `AdventurePhase`) para revelar a próxima fase já
 * destrancada globalmente pelo Host, ou entrar em estado de espera quando
 * ainda não há nenhuma.
 */
export function useNextPhase(sessionId: string, { onAdvance, onWaitingForHost }: Options) {
  const [advancing, setAdvancing] = useState(false);

  function advance() {
    setAdvancing(true);
    sessionApi
      .nextPhase(sessionId)
      .then(() => onAdvance())
      .catch(async (err) => {
        if (await isNoNextPhaseError(err)) {
          onWaitingForHost();
          return;
        }
        console.error('Failed to advance session phase:', err);
      })
      .finally(() => setAdvancing(false));
  }

  return { advancing, advance };
}
