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
  onEventLogged: () => void;
  onDiscovered: (poiId: string) => void;
};

// Bottom sheet de "Investigar" com dois fluxos (spec 00153-mesa-jogo/
// investigacao.md seção 2.1, Stitch project 15326270198202696484, screen
// ab8e6e68879a4b5f992013368f26911c "Investigação: Escolha de Ação"):
// 'choice'        — "Vasculhar o local" vs "Investigar algo específico".
// 'poi-pick'      — lista de POIs elegíveis (fluxo "específico").
// 'skill-pick'    — escolha de perícia do herói (fluxo "vasculhar", já que o
//                    roll é conferido contra POIs de skill_check variado).
// 'rolling'       — animação de d20 + resultado (ambos os fluxos).
type Step = 'choice' | 'poi-pick' | 'skill-pick' | 'rolling';

export function InvestigateModal({ sessionId, scene, presetPoi, onClose, onEventLogged, onDiscovered }: Props) {
  const {
    eligiblePois,
    heroSkills,
    rolling,
    roll,
    generalRoll,
    error,
    investigate,
    investigateGeneral,
  } = useInvestigate(sessionId, scene, (poiId) => {
    onDiscovered(poiId);
    onEventLogged();
  });

  const [step, setStep] = useState<Step>(presetPoi ? 'rolling' : 'choice');

  useEffect(() => {
    if (presetPoi) investigate(presetPoi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Investigar algo específico": com exatamente 1 POI elegível, investiga
  // direto nele em vez de pedir para escolher em uma lista de um item só —
  // decidido no próprio clique do botão (goToPoiPick), não via efeito
  // reagindo à mudança de `step`.
  function goToPoiPick() {
    if (eligiblePois.length === 1) {
      setStep('rolling');
      investigate(eligiblePois[0]);
      return;
    }
    setStep('poi-pick');
  }

  const directedResolved = roll?.result !== undefined;
  const generalResolved = generalRoll?.result !== undefined;
  const activeRoll = roll ?? (generalRoll ? { roll: generalRoll.roll } : null);
  const resolved = directedResolved || generalResolved;

  const title =
    step === 'choice'
      ? 'Investigar'
      : step === 'poi-pick'
        ? 'O que investigar?'
        : step === 'skill-pick'
          ? 'Escolha a perícia'
          : 'Investigar';

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
                onClick={() => setStep(heroSkills.length > 0 ? 'skill-pick' : 'rolling')}
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
                    Focar a atenção em um ponto de interesse visível no mapa
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
                    <button
                      type="button"
                      className="investigatemodal-option"
                      onClick={() => {
                        setStep('rolling');
                        investigate(poi);
                      }}
                    >
                      Investigar: {poi.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {step === 'skill-pick' &&
            (heroSkills.length === 0 ? (
              <p className="investigatemodal-empty">Nenhuma perícia disponível para este herói.</p>
            ) : (
              <ul className="investigatemodal-list">
                {heroSkills.map((skill) => (
                  <li key={skill.slug}>
                    <button
                      type="button"
                      className="investigatemodal-option"
                      onClick={() => {
                        setStep('rolling');
                        investigateGeneral(skill.slug);
                      }}
                    >
                      {skill.name}
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {step === 'rolling' && activeRoll && (
            <div className="investigatemodal-roll">
              <span className="investigatemodal-roll-badge">d20</span>
              {roll && <p className="investigatemodal-roll-target">Vasculhando: {roll.poi.display_name}</p>}
              {generalRoll && <p className="investigatemodal-roll-target">Vasculhando o local...</p>}
              <p className="investigatemodal-roll-value">{activeRoll.roll}</p>
              {rolling && <p className="investigatemodal-roll-status">Rolando...</p>}

              {directedResolved && roll?.result && (
                <p
                  className={`investigatemodal-roll-result ${
                    roll.result.success
                      ? 'investigatemodal-roll-result-success'
                      : 'investigatemodal-roll-result-failure'
                  }`}
                >
                  Total {roll.result.total} — {roll.result.success ? 'Sucesso' : 'Falha'}
                </p>
              )}

              {generalResolved && generalRoll?.result && (
                <p
                  className={`investigatemodal-roll-result ${
                    generalRoll.result.discovered_pois.length > 0
                      ? 'investigatemodal-roll-result-success'
                      : 'investigatemodal-roll-result-failure'
                  }`}
                >
                  Total {generalRoll.result.total_result} —{' '}
                  {generalRoll.result.discovered_pois.length > 0
                    ? `${generalRoll.result.discovered_pois.length} descoberta(s)`
                    : 'Nada encontrado'}
                </p>
              )}

              {resolved && (
                <button type="button" className="investigatemodal-done" onClick={onClose}>
                  Fechar
                </button>
              )}
            </div>
          )}

          {error && <p className="investigatemodal-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
