import type { ScenePointOfInterest } from '../../../types';
import './POIDetailSheet.css';

type Props = {
  poi: ScenePointOfInterest;
  onClose: () => void;
  onMove: () => void;
  onInvestigate: () => void;
};

// Bottom sheet de detalhes do POI (spec 00153-mesa-jogo/scene.md seção 3.1).
// Aberta ao clicar num pin de POI no mapa fora do modo dev. Reaproveita os
// mesmos handlers de "Mover"/"Investigar" já usados pelo ActionDock — não
// duplica a lógica de investigação/movimento aqui.
//
// Nota de implementação: MCP Stitch retornou "entity not found" (repetido
// mesmo após retry) para o screen
// projects/15326270198202696484/screens/d5fb075937a14c2b825a9472a995107c
// ("Detalhes do Ponto de Interesse: Estátua de Aldric"). Fallback: layout
// construído com os design tokens já existentes em src/styles/tokens.css,
// seguindo o padrão visual de InvestigateModal.css/NPCDialogueModal.css
// (mesma família de bottom sheet). Precisa ser revalidado contra o Stitch
// quando o MCP voltar a responder para este screen.
export function POIDetailSheet({ poi, onClose, onMove, onInvestigate }: Props) {
  return (
    <div className="poidetailsheet-overlay" role="dialog" aria-modal="true">
      <div className="poidetailsheet-modal">
        <header className="poidetailsheet-header">
          <span className="material-symbols-outlined">place</span>
          <h2 className="poidetailsheet-title">{poi.display_name}</h2>
          <button type="button" className="poidetailsheet-close" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="poidetailsheet-body">
          {/* A narrativa contextual (`description`) não vem mais no payload
              deste endpoint (be-rpg PR #70, SessionScenePOIView) — a modal
              mostra apenas o nome e as ações de Mover/Investigar. */}
          <div className="poidetailsheet-actions">
            <button type="button" className="poidetailsheet-action" onClick={onMove}>
              <span className="material-symbols-outlined">directions_walk</span>
              <span>Mover</span>
            </button>
            <button type="button" className="poidetailsheet-action" onClick={onInvestigate}>
              <span className="material-symbols-outlined">search</span>
              <span>Investigar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
