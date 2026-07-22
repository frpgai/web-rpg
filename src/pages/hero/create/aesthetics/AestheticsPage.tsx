import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { toast } from 'react-toastify';
import { BottomSheet } from '../../../../components/ui/BottomSheet';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { useAestheticsData } from './hooks/useAestheticsData';
import { useAvatarSelection } from './hooks/useAvatarSelection';
import { heroApi } from '../../../../api/services/hero';
import { getAssetUrl } from '../../../../utils/url';
import './AestheticsPage.css';

export default function AestheticsPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  const {
    hero,
    heroLoaded,
    heroError,
    vocationDetails,
  } = useAestheticsData(heroId);

  const {
    avatarList,
    avatarsLoading,
    avatarError,
    reloadAvatars,
    avatarId,
    setAvatarId,
    activePreset,
  } = useAvatarSelection(hero);

  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');
  const [nameBlurred, setNameBlurred] = useState(false);

  // BottomSheet State
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const [infoSheetTitle, setInfoSheetTitle] = useState('');
  const [infoSheetContent, setInfoSheetContent] = useState('');

  // ─── Hydrate local fields from the loaded hero draft ──────────────────────
  useEffect(() => {
    if (!hero) return;
    if (hero.name) setName(hero.name);
    if (hero.backstory) setBackstory(hero.backstory);
  }, [hero]);

  // ─── Guard: without a heroId there's no draft to hydrate from ─────────────
  useEffect(() => {
    if (!heroId) {
      setLocation('/app/hero/create/origins');
    }
  }, [heroId, setLocation]);

  // ─── Guard: must have completed steps 1 and 2 ─────────────────────────────
  useEffect(() => {
    if (!heroLoaded || !hero) return;
    if (!hero.ancestry || !hero.class || !hero.background) {
      console.warn('AestheticsPage: hero draft missing origins, redirecting back');
      // setLocation('/app/hero/create/origins');
      return;
    }
    if (!hero.attributes) {
      // setLocation(`/app/hero/create/attributes/${heroId}`);
      console.warn('AestheticsPage: hero draft missing attributes, redirecting back');
    }
  }, [heroLoaded, hero, heroId, setLocation]);

  // ─── Name validation ──────────────────────────────────────────────────────
  const nameIsValid = name.trim().length >= 2 && name.trim().length <= 40;
  const showNameError = nameBlurred && !nameIsValid;

  const handleNameBlur = () => {
    setNameBlurred(true);
  };

  const handleBackstoryChange = (val: string) => {
    setBackstory(val.slice(0, 500));
  };

  // ─── Derived key attribute ────────────────────────────────────────────────
  const keyAttrLabel = vocationDetails?.key_attribute?.toUpperCase() ?? '—';
  const keyAttr = vocationDetails?.key_attribute?.toLowerCase();
  const sheetAttrs = hero?.attributes as Record<string, { final: number }> | null | undefined;
  const keyAttrValue: number | null = keyAttr && sheetAttrs ? (sheetAttrs[keyAttr]?.final ?? null) : null;

  const canNext = nameIsValid && !!avatarId;

  const handleBack = () => {
    setLocation(`/app/hero/create/attributes/${heroId}`);
  };

  const handleNext = async () => {
    if (!heroId) return;
    try {
      await heroApi.saveDraftAesthetics(heroId, {
        name: name.trim(),
        avatar_url: activePreset?.url || '',
        backstory: backstory.trim(),
      });
      setLocation(`/app/hero/create/summary/${heroId}`);
    } catch (err: unknown) {
      console.error('AestheticsPage: failed to save draft aesthetics', err);
      toast.error('Não foi possível salvar. Tente novamente.');
    }
  };

  // ─── Info Trigger Helpers ──────────────────────────────────────────────────
  const openInfo = (title: string, content: string) => {
    setInfoSheetTitle(title);
    setInfoSheetContent(content);
    setInfoSheetOpen(true);
  };

  if (!heroLoaded) return null;
  if (heroError) {
    return (
      <div className="aesthetics-page-root">
        <div className="aesthetics-error-banner">
          <span className="aesthetics-error-banner-text">{heroError}</span>
        </div>
      </div>
    );
  }
  if (!hero) return null;

  return (
    <div className="aesthetics-page-root">
      <div className="aesthetics-page-scroll">
        {/* Step Header */}
        <CreationStepHeader
          stepLabel="PASSO 03: ESTÉTICA"
          headline="IDENTIDADE DO HERÓI"
          progressPct={75}
        />

        {/* 1. AVATAR SECTION */}
        <div className="aesthetics-glass-panel">
          <div className="aesthetics-avatar-header-row">
            <span className="aesthetics-avatar-section-title">Selecione seu Avatar</span>
          </div>

          {avatarError && (
            <div className="aesthetics-error-banner">
              <span className="aesthetics-error-banner-text">{avatarError}</span>
              <button className="aesthetics-retry-button" onClick={reloadAvatars} type="button">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Main Avatar Display */}
          {avatarsLoading ? (
            <div className="aesthetics-main-avatar-skeleton" />
          ) : (
            <div className="aesthetics-main-avatar-container">
              {activePreset?.url ? (
                <img
                  src={getAssetUrl(activePreset.url)}
                  alt={activePreset.label}
                  className="aesthetics-main-avatar-img"
                />
              ) : (
                <div className="aesthetics-main-avatar-img aesthetics-main-avatar-placeholder">
                  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: '40%', opacity: 0.3 }}>
                    <circle cx="48" cy="32" r="18" fill="currentColor" />
                    <path d="M10 88c0-21 17-38 38-38s38 17 38 38" fill="currentColor" />
                  </svg>
                </div>
              )}
              <div className="aesthetics-main-avatar-gradient" />
              <div className="aesthetics-main-avatar-overlay">
                <div className="aesthetics-main-avatar-overlay-left">
                  {activePreset?.recommended && (
                    <div className="aesthetics-recommended-badge">
                      <span className="aesthetics-recommended-text">RECOMENDADO</span>
                    </div>
                  )}
                </div>
                {activePreset?.recommended && (
                  <span className="aesthetics-verified-icon">✓</span>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail Carousel */}
          <div className="aesthetics-thumbnail-carousel-container">
            <div className="aesthetics-thumbnail-carousel">
              {avatarsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aesthetics-thumbnail-thumb aesthetics-thumbnail-skeleton" />
                  ))
                : avatarList.length > 0
                ? avatarList.map((preset) => {
                    const isSelected = avatarId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        className={`aesthetics-thumbnail-thumb ${
                          isSelected ? 'aesthetics-thumbnail-selected' : 'aesthetics-thumbnail-unselected'
                        }`}
                        onClick={() => setAvatarId(preset.id)}
                        type="button"
                      >
                        <img
                          src={getAssetUrl(preset.url)}
                          alt={preset.label}
                          className={`aesthetics-thumbnail-img ${
                            !isSelected ? 'aesthetics-thumbnail-img-unselected' : ''
                          }`}
                        />
                      </button>
                    );
                  })
                : (
                    <button
                      className="aesthetics-thumbnail-thumb aesthetics-thumbnail-selected"
                      type="button"
                      disabled
                    >
                      <div className="aesthetics-thumbnail-img aesthetics-main-avatar-placeholder">
                        <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: '50%', opacity: 0.3 }}>
                          <circle cx="48" cy="32" r="18" fill="currentColor" />
                          <path d="M10 88c0-21 17-38 38-38s38 17 38 38" fill="currentColor" />
                        </svg>
                      </div>
                    </button>
                  )}
            </div>
          </div>
        </div>

        {/* 2. NAME FIELD */}
        <div className="aesthetics-glass-panel">
          <span className="aesthetics-field-label">Nome do Herói</span>
          <input
            type="text"
            className={`aesthetics-input ${showNameError ? 'aesthetics-input-error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Ex: Aethelred o Audaz"
            maxLength={40}
          />
          {showNameError ? (
            <span className="aesthetics-field-error">
              Nome deve ter entre 2 e 40 caracteres
            </span>
          ) : (
            <span className="aesthetics-field-hint">
              Sua lenda começa com um nome. Escolha com sabedoria.
            </span>
          )}
        </div>

        {/* 3. BACKSTORY TEXTAREA */}
        <div className="aesthetics-glass-panel">
          <span className="aesthetics-field-label">Origem/Histórico</span>
          <textarea
            className="aesthetics-input aesthetics-textarea"
            value={backstory}
            onChange={(e) => handleBackstoryChange(e.target.value)}
            placeholder="Nascido sob a aurora púrpura de Valoria..."
            rows={5}
            maxLength={500}
          />
          <div className="aesthetics-textarea-footer">
            <span className="aesthetics-textarea-hint">Breve introdução narrativa</span>
            <span className="aesthetics-char-count">{backstory.length} / 500</span>
          </div>
        </div>

        {/* 4. CONTEXT GRID */}
        <div className="aesthetics-context-grid">
          <button
            type="button"
            className="aesthetics-context-box aesthetics-context-btn"
            onClick={() => openInfo(hero.class?.name ?? 'Classe', 'Sua vocação e profissão de combate.')}
          >
            <span className="aesthetics-context-box-label">CLASSE ⓘ</span>
            <span className="aesthetics-context-box-value">{hero.class?.name ?? '—'}</span>
          </button>
          <button
            type="button"
            className="aesthetics-context-box aesthetics-context-btn"
            onClick={() => openInfo(hero.ancestry?.name ?? 'Raça', 'Sua origem biológica e traços físicos.')}
          >
            <span className="aesthetics-context-box-label">RAÇA ⓘ</span>
            <span className="aesthetics-context-box-value">{hero.ancestry?.name ?? '—'}</span>
          </button>
          <button
            type="button"
            className="aesthetics-context-box aesthetics-context-btn"
            onClick={() => openInfo(hero.background?.name ?? 'Antecedente', 'O que seu herói fazia antes de virar aventureiro.')}
          >
            <span className="aesthetics-context-box-label">ANTECEDENTE ⓘ</span>
            <span className="aesthetics-context-box-value">{hero.background?.name ?? '—'}</span>
          </button>
          <button
            type="button"
            className="aesthetics-context-box aesthetics-context-btn"
            onClick={() =>
              openInfo(
                `Atributo de Destaque (${keyAttrLabel})`,
                'O atributo mais importante para as habilidades da sua classe. O valor total exibido já inclui os bônus comprados e os adicionais fornecidos pela raça e pelo antecedente.'
              )
            }
          >
            <span className="aesthetics-context-box-label">{keyAttrLabel} ⓘ</span>
            <span className="aesthetics-context-box-value aesthetics-context-box-value-accent">
              {keyAttrValue ?? '—'}
            </span>
          </button>
        </div>
      </div>

      <CreationFooter
        onBack={handleBack}
        onNext={handleNext}
        canNext={canNext}
      />

      {/* Info Details BottomSheet */}
      <BottomSheet
        open={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={infoSheetTitle}
      >
        <div className="aesthetics-bottom-sheet-content">
          <p className="aesthetics-bottom-sheet-text">{infoSheetContent}</p>
        </div>
      </BottomSheet>
    </div>
  );
}
