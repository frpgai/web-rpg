import type { SceneDetail } from '../../../types';
import './ActionDock.css';

type Props = {
  scene: SceneDetail;
  // Combate ativo: hoje não existe nenhum sinal no schema de sessão/cena
  // (sem campo de "iniciativa ativa" em SessionDetail/SceneDetail) — por
  // isso este componente sempre recebe `false` do chamador e a ação fica
  // oculta por padrão, conforme a spec A00153 seção 4.3 manda fazer na
  // ausência desse sinal. Documentado como limitação conhecida.
  hasActiveCombat: boolean;
  onSpeak: () => void;
  onMove: () => void;
  onInvestigate: () => void;
  onCombat: () => void;
};

export function ActionDock({ scene, hasActiveCombat, onSpeak, onMove, onInvestigate, onCombat }: Props) {
  return (
    <footer className="actiondock-root">
      <button
        type="button"
        className="actiondock-button"
        onClick={onSpeak}
        disabled={scene.npcs.length === 0}
      >
        <span className="material-symbols-outlined">forum</span>
        <span>Falar</span>
      </button>
      <button
        type="button"
        className="actiondock-button"
        onClick={onMove}
        disabled={scene.points_of_interest.length === 0}
      >
        <span className="material-symbols-outlined">directions_walk</span>
        <span>Mover</span>
      </button>
      <button type="button" className="actiondock-button" onClick={onInvestigate}>
        <span className="material-symbols-outlined">search</span>
        <span>Investigar</span>
      </button>
      {hasActiveCombat && (
        <button type="button" className="actiondock-button actiondock-button-combat" onClick={onCombat}>
          <span className="material-symbols-outlined">swords</span>
          <span>Combater</span>
        </button>
      )}
    </footer>
  );
}
