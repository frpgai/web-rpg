import type { ScenePointOfInterest } from '../../../../../types';
import './POIDetailSheet.css';

type Props = {
  poi: ScenePointOfInterest;
  onClose: () => void;
  onMove: () => void;
  onInvestigate: () => void;
};

// Modal de detalhes do POI (spec 00153-mesa-jogo/investigacao.md seção 2.2,
// Stitch project 15326270198202696484, screen 4acadfbe26d74bb5bc765ec1a927876b
// "Detalhes do Ponto de Interesse: Estátua de Aldric" —
// .stitch/designs/poi-detail.html).
//
// Dois estados por `poi.investigable` (SessionScenePOIView.Investigable,
// be-rpg PR #70):
// - true  (ainda não descoberto): mostra o nome genérico
//   (`display_name` sem spoiler), botão proeminente "Investigar
//   [Nome Genérico]", sem descrição (o backend não envia `description` para
//   POIs não descobertos — narrativa fica reservada até a investigação).
// - false (já descoberto OU público sem skill_check): mostra `display_name`
//   detalhado + `description` completa; botão de investigar oculto.
//
// Nota de contrato: a spec pede indicação da perícia/dificuldade recomendada
// no estado "não descoberto", mas SessionScenePOIView não expõe
// skill_check/dc (documentado no model.go como "internal domain state" —
// deliberadamente fora do payload, para não vazar essa informação de
// mestre). Sem esse dado na API, a seção de dificuldade foi omitida em vez
// de inventado — ver limitação no relatório final.
export function POIDetailSheet({ poi, onClose, onMove, onInvestigate }: Props) {
  const discovered = !poi.investigable;

  return (
    <div className="poidetailsheet-overlay" role="dialog" aria-modal="true">
      <div className="poidetailsheet-modal">
        <div className="poidetailsheet-header-row">
          <span className="poidetailsheet-eyebrow">Ponto de Interesse</span>
          <button type="button" className="poidetailsheet-close" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <h2 className="poidetailsheet-title">{poi.display_name}</h2>
        <div className="poidetailsheet-divider" />

        {/* SessionScenePOIView (be-rpg PR #70) não expõe mais `description` —
            ver nota de contrato acima. Sem esse dado, a seção de descrição
            completa foi omitida em vez de inventada. */}

        <div className="poidetailsheet-actions">
          {poi.investigable && (
            <button type="button" className="poidetailsheet-action-primary" onClick={onInvestigate}>
              <span className="poidetailsheet-action-icon">
                <span className="material-symbols-outlined">search</span>
              </span>
              <span className="poidetailsheet-action-text">
                <span className="poidetailsheet-action-eyebrow">[A] Comandar</span>
                <span>Investigar {poi.display_name}</span>
              </span>
            </button>
          )}

          <button type="button" className="poidetailsheet-action-secondary" onClick={onMove}>
            <span className="poidetailsheet-action-icon poidetailsheet-action-icon-outline">
              <span className="material-symbols-outlined">navigation</span>
            </span>
            <span className="poidetailsheet-action-text">
              <span className="poidetailsheet-action-eyebrow">[B] Movimento</span>
              <span>Mover Personagem para Cá</span>
            </span>
          </button>
        </div>

        <div className="poidetailsheet-footer">
          {discovered ? (
            <span className="poidetailsheet-status poidetailsheet-status-discovered">
              <span className="poidetailsheet-status-dot" />
              Descoberto
            </span>
          ) : (
            <span className="poidetailsheet-status poidetailsheet-status-hidden">Ainda não descoberto</span>
          )}
        </div>
      </div>
    </div>
  );
}
