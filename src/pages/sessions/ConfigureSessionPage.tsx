import { useLocation, useParams } from 'wouter';
import { Spinner } from '../../components/ui/Spinner';
import { useConfigureSession } from '../../hooks/useConfigureSession';
import type { Hero } from '../../types';
import './ConfigureSessionPage.css';

function heroClassLabel(hero: Hero): string {
  return `${hero.class} Nvl ${hero.level}`;
}

export default function ConfigureSessionPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId ?? '';

  const {
    campaignLoading,
    campaignError,
    heroes,
    heroesLoading,
    heroesError,
    selectedHeroId,
    setSelectedHeroId,
    name,
    handleNameChange,
    nameError,
    isPrivate,
    setIsPrivate,
    participantLimit,
    minPlayers,
    maxPlayers,
    incrementLimit,
    decrementLimit,
    canSubmit,
    submitting,
    submitError,
    submit,
  } = useConfigureSession(campaignId);

  const handleBack = () => setLocation('/app/sessions/create/select-campaign');

  return (
    <div className="configurar-sessao-root">
      <header className="configurar-sessao-header">
        <button className="configurar-sessao-back" onClick={handleBack} aria-label="Voltar">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="configurar-sessao-title">Configurar Mesa</h1>
        <div className="configurar-sessao-header-spacer" />
      </header>

      <main className="configurar-sessao-main">
        <div className="configurar-sessao-panel">
          {/* Nome da Mesa */}
          <div className="configurar-sessao-field">
            <label className="configurar-sessao-label" htmlFor="configurar-sessao-name">
              Nome da Mesa/Sessão
            </label>
            <input
              id="configurar-sessao-name"
              className="configurar-sessao-input"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={100}
            />
            {nameError && <p className="configurar-sessao-field-error">{nameError}</p>}
          </div>

          {/* Visibilidade */}
          <div className="configurar-sessao-field">
            <label className="configurar-sessao-label">Visibilidade</label>
            <div className="configurar-sessao-segmented">
              <button
                type="button"
                className={`configurar-sessao-segment ${!isPrivate ? 'configurar-sessao-segment-active' : ''}`}
                onClick={() => setIsPrivate(false)}
              >
                Pública
              </button>
              <button
                type="button"
                className={`configurar-sessao-segment ${isPrivate ? 'configurar-sessao-segment-active' : ''}`}
                onClick={() => setIsPrivate(true)}
              >
                Privada
              </button>
            </div>
            <p className="configurar-sessao-help">
              <span className="material-symbols-outlined configurar-sessao-help-icon">info</span>
              Mesas privadas exigem código de convite para entrar.
            </p>
          </div>

          {/* Limite de Participantes */}
          <div className="configurar-sessao-field">
            <label className="configurar-sessao-label">Máximo de Jogadores</label>
            <div className="configurar-sessao-stepper">
              <button
                type="button"
                className="configurar-sessao-stepper-button"
                onClick={decrementLimit}
                disabled={participantLimit <= minPlayers}
                aria-label="Diminuir limite de participantes"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="configurar-sessao-stepper-value">{participantLimit}</span>
              <button
                type="button"
                className="configurar-sessao-stepper-button"
                onClick={incrementLimit}
                disabled={participantLimit >= maxPlayers}
                aria-label="Aumentar limite de participantes"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            {campaignError ? (
              <p className="configurar-sessao-field-error">{campaignError}</p>
            ) : (
              <p className="configurar-sessao-help">
                Esta campanha recomenda de {minPlayers} (mín) a {maxPlayers} (máx) jogadores.
              </p>
            )}
          </div>

          {/* Seleção de Herói */}
          <div className="configurar-sessao-field">
            <label className="configurar-sessao-label">Seu Herói</label>
            {heroesLoading ? (
              <div className="configurar-sessao-heroes-loading">
                <Spinner color="var(--color-primary)" size="medium" />
              </div>
            ) : heroesError ? (
              <p className="configurar-sessao-field-error">{heroesError}</p>
            ) : heroes.length === 0 ? (
              <p className="configurar-sessao-help">Você ainda não possui heróis cadastrados.</p>
            ) : (
              <div className="configurar-sessao-hero-carousel">
                {heroes.map((hero) => {
                  const selected = hero.id === selectedHeroId;
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      className={`configurar-sessao-hero-card ${selected ? 'configurar-sessao-hero-card-selected' : ''}`}
                      onClick={() => setSelectedHeroId(hero.id)}
                    >
                      <div className="configurar-sessao-hero-avatar-wrap">
                        <div className="configurar-sessao-hero-avatar">
                          {hero.avatar_url ? (
                            <img src={hero.avatar_url} alt={hero.name} />
                          ) : (
                            <div className="configurar-sessao-hero-avatar-fallback" />
                          )}
                        </div>
                        {selected && (
                          <div className="configurar-sessao-hero-check">
                            <span className="material-symbols-outlined">check</span>
                          </div>
                        )}
                      </div>
                      <div className="configurar-sessao-hero-info">
                        <p className="configurar-sessao-hero-name">{hero.name}</p>
                        <p className="configurar-sessao-hero-class">{heroClassLabel(hero)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {campaignLoading && (
          <div className="configurar-sessao-centered">
            <Spinner color="var(--color-primary)" size="large" />
          </div>
        )}

        {submitError && <p className="configurar-sessao-submit-error">{submitError}</p>}
      </main>

      <footer className="configurar-sessao-footer">
        <button
          type="button"
          className="configurar-sessao-submit"
          onClick={submit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <Spinner color="var(--color-on-primary)" size="small" />
          ) : (
            <>
              Criar Sessão e Iniciar Lobby
              <span className="material-symbols-outlined">bolt</span>
            </>
          )}
        </button>
        <button type="button" className="configurar-sessao-cancel" onClick={handleBack}>
          Cancelar e Voltar
        </button>
      </footer>
    </div>
  );
}
