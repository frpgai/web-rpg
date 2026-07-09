import { useNextPhase } from '../../../../../hooks/useNextPhase';
import { Spinner } from '../../../../../components/ui/Spinner';
import './WaitingForHostPhase.css';

type Props = {
  sessionId: string;
  onAdvance: () => void;
};

/**
 * Estado de espera exibido quando `POST /sessions/:id/next-phase` responde
 * 422 `NO_NEXT_PHASE` (be-rpg PR #73): o jogador já revelou tudo que o Host
 * destrancou globalmente até agora e precisa aguardar o Host avançar a
 * sessão. Não é um erro — segue o padrão visual de "Aguardando início pelo
 * Host..." já usado em `LobbyPage`.
 */
export function WaitingForHostPhase({ sessionId, onAdvance }: Props) {
  const { advancing, advance } = useNextPhase(sessionId, {
    onAdvance,
    // Já estamos no estado de espera — um novo 422 apenas mantém o estado.
    onWaitingForHost: () => {},
  });

  return (
    <div className="play-root waitingforhostphase-root">
      <div className="waitingforhostphase-card">
        <span className="material-symbols-outlined waitingforhostphase-icon">hourglass_top</span>
        <p className="waitingforhostphase-title">Aguardando o Mestre avançar a sessão...</p>
        <p className="waitingforhostphase-subtext">
          Você já revelou tudo que está disponível até agora. Assim que o Mestre destrancar a
          próxima fase, você poderá continuar.
        </p>
        <button
          type="button"
          className="waitingforhostphase-retry-button"
          onClick={advance}
          disabled={advancing}
        >
          {advancing ? <Spinner color="var(--color-on-primary)" size="small" /> : 'Verificar novamente'}
        </button>
      </div>
    </div>
  );
}
