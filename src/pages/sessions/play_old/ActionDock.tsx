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

// Grade de ações rápidas do herói (Falar/Mover/Investigar) — reorganização de
// layout confirmada via Stitch (project 15326270198202696484, screen
// a0e6aede33c94152a028fb8294ea4ae8 "Sessão Ativa: Layout Reorganizado (Ação
// no Topo)"): sai do dock fixo no rodapé (agora ocupado só pela navegação
// principal — ver SessionBottomNav) e passa a ser uma grade de 3 colunas
// posicionada entre o card do mapa e o card de narração/áudio, dentro do
// fluxo normal da página (ActiveTable.tsx).
export function ActionDock({ scene, hasActiveCombat, onSpeak, onMove, onInvestigate, onCombat }: Props) {
  return (
    <section className="actiondock-root">
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
        <span className="material-symbols-outlined">directions_run</span>
        <span>Mover</span>
      </button>
      <button type="button" className="actiondock-button" onClick={onInvestigate}>
        <span className="material-symbols-outlined">search_check</span>
        <span>Investigar</span>
      </button>
      {hasActiveCombat && (
        <button
          type="button"
          className="actiondock-button actiondock-button-combat actiondock-button-full"
          onClick={onCombat}
        >
          <span className="material-symbols-outlined">swords</span>
          <span>Combater</span>
        </button>
      )}
    </section>
  );
}
