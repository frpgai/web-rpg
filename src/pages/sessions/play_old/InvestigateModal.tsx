import { useEffect, useState } from 'react';
import { useInvestigate } from './useInvestigate';
import type { ScenePointOfInterest, SceneDetail } from '../../../types';
import './InvestigateModal.css';

type Props = {
  sessionId: string;
  scene: SceneDetail;
  // POI pré-selecionado ao abrir a modal via clique direto num pin do mapa
  // (spec 00153-mesa-jogo/investigacao.md seção 2.1: "ou clique direto em
  // pin no mapa") — pula a etapa de escolha e a lista de POIs, indo direto
  // para a rolagem daquele POI específico.
  presetPoi?: ScenePointOfInterest | null;
  onClose: () => void;
};

// Bottom sheet de "Investigar" com dois fluxos (spec 00153-mesa-jogo/
// investigacao.md seção 2.1, Stitch project 15326270198202696484, screen
// ab8e6e68879a4b5f992013368f26911c "Investigação: Escolha de Ação"):
// 'choice'   — "Vasculhar o local" vs "Investigar algo específico".
// 'poi-pick' — lista de POIs elegíveis (fluxo "específico").
// 'skill-pick' — escolha de perícia do herói (fluxo "vasculhar", já que o
//                roll é conferido contra POIs de skill_check variado).
//
// A rolagem em si não é mais renderizada aqui: assim que o jogador escolhe o
// alvo (POI ou perícia), a modal dispara `triggerRollRequest` (via
// `useInvestigate`) e se fecha — o dado 3D global (`DiceRollOverlay`, já
// montado em `ActiveTable.tsx`) assume a animação e o resultado real vindo
// do WebSocket `roll_resolved`/`session.poi_discovered`, igualtype Step = 'choice' | 'poi-pick';

export function InvestigateModal({ sessionId, scene, presetPoi, onClose }: Props) {
  const { eligiblePois, error, investigate, investigateGeneral } = useInvestigate(sessionId, scene);
  const [step, setStep] = useState<Step>('choice');

  useEffect(() => {
    if (presetPoi) {
      investigate(presetPoi);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (presetPoi) return null;

  function pickPoi(poi: ScenePointOfInterest) {
    investigate(poi);
    onClose();
  }

  // "Investigar algo específico": com exatamente 1 POI elegível, investiga
  // direto nele em vez de pedir para escolher em uma lista de um item só.
  function goToPoiPick() {
    if (eligiblePois.length === 1) {
      pickPoi(eligiblePois[0]);
      return;
    }
    setStep('poi-pick');
  }

  const title =
    step === 'choice' ? 'Investigar' : 'O que investigar?';

  return (
    <div className="investigatemodal-overlay" role="dialog" aria-modal="true">
      <div className="investigatemodal-modal">
        <div className="investigatemodal-handle" />
        <header className="investigatemodal-header">
          <h2 className="investigatemodal-title">{title}</h2>
          <button type="button" className="investigatemodal-close" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="investigatemodal-body">
          {step === 'choice' && (
            <div className="investigatemodal-choices">
              <button
                type="button"
                className="investigatemodal-choice"
                onClick={() => {
                  investigateGeneral();
                  onClose();
                }}
              >
                <span className="investigatemodal-choice-icon investigatemodal-choice-icon-primary">
                  <span className="material-symbols-outlined">search</span>
                </span>
                <span className="investigatemodal-choice-text">
                  <span className="investigatemodal-choice-title investigatemodal-choice-title-primary">
                    Vasculhar o Local
                  </span>
                  <span className="investigatemodal-choice-desc">
                    Procurar por passagens secretas, armadilhas ou segredos na cena
                  </span>
                </span>
                <span className="material-symbols-outlined investigatemodal-choice-chevron">chevron_right</span>
              </button>

              <button
                type="button"
                className="investigatemodal-choice"
                onClick={goToPoiPick}
                disabled={eligiblePois.length === 0}
              >
                <span className="investigatemodal-choice-icon investigatemodal-choice-icon-secondary">
                  <span className="material-symbols-outlined">target</span>
                </span>
                <span className="investigatemodal-choice-text">
                  <span className="investigatemodal-choice-title investigatemodal-choice-title-secondary">
                    Investigar Algo Específico
                  </span>
                  <span className="investigatemodal-choice-desc">
                    Focalizar a atenção em um ponto de interesse visível no mapa
                  </span>
                </span>
                <span className="material-symbols-outlined investigatemodal-choice-chevron">chevron_right</span>
              </button>
            </div>
          )}

          {step === 'poi-pick' &&
            (eligiblePois.length === 0 ? (
              <p className="investigatemodal-empty">Nada para investigar aqui.</p>
            ) : (
              <ul className="investigatemodal-list">
                {eligiblePois.map((poi) => (
                  <li key={poi.id}>
                    <button type="button" className="investigatemodal-option" onClick={() => pickPoi(poi)}>
                      Investigar: {poi.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {error && <p className="investigatemodal-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

