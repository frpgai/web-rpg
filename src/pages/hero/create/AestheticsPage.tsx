import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { Tooltip } from '../../../components/ui/Tooltip';
import { CreationStepHeader } from '../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../components/hero-creation/CreationFooter';
import { useHeroCreationStore } from '../../../stores/heroCreationStore';
import { catalogApi } from '../../../api/services/catalog';
import type { AvatarPreset } from '../../../types';
import './AestheticsPage.css';

export default function AestheticsPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  const {
    ancestry,
    characterClass,
    background,
    name,
    backstory,
    avatarId,
    setName,
    setBackstory,
    setAvatar,
  } = useHeroCreationStore();

  const [avatarList, setAvatarList] = useState<AvatarPreset[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [backstoryLen, setBackstoryLen] = useState(backstory.length);

  // ─── Guard: must have completed steps 1 and 2 ─────────────────────────────
  useEffect(() => {
    const { ancestry: a, characterClass: v, background: b } =
      useHeroCreationStore.getState();

    if (!a || !v || !b) {
      setLocation('/hero/create/origins');
    }
  }, [setLocation]);

  // ─── Load avatars ──────────────────────────────────────────────────────────
  const loadAvatars = useCallback(async () => {
    if (!ancestry || !characterClass) return;
    setLoadingAvatars(true);
    setAvatarError(false);
    try {
      const presets = await catalogApi.fetchAvatars(ancestry.id, characterClass.id, background?.id);
      setAvatarList(presets);
      const rec = presets.find((p) => p.recommended);
      if (rec && !avatarId) {
        setAvatar(rec.id, rec.url);
      }
    } catch (err) {
      console.error('Failed to load avatars preset:', err);
      setAvatarError(true);
    } finally {
      setLoadingAvatars(false);
    }
  }, [ancestry, characterClass, background, avatarId, setAvatar]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  // ─── Shuffle thumbnails (Fisher-Yates, local) ─────────────────────────────
  const handleShuffle = () => {
    setAvatarList((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    });
  };

  // ─── Active avatar preset ──────────────────────────────────────────────────
  const activePreset = avatarList.find((p) => p.id === avatarId) ?? avatarList[0] ?? null;

  // ─── Name validation ──────────────────────────────────────────────────────
  const nameIsValid = name.trim().length >= 2 && name.trim().length <= 40;
  const showNameError = nameBlurred && !nameIsValid;

  const handleNameChange = (val: string) => {
    setName(val);
  };

  const handleNameBlur = () => {
    setNameBlurred(true);
  };

  // ─── Backstory handler ─────────────────────────────────────────────────────
  const handleBackstoryChange = (val: string) => {
    const trimmed = val.slice(0, 500);
    setBackstory(trimmed);
    setBackstoryLen(trimmed.length);
  };

  // ─── Derived key attribute ────────────────────────────────────────────────
  const keyAttrLabel = characterClass?.key_attribute?.toUpperCase() ?? '—';
  // keyAttrValue not available here — attributes state lives in AttributesPage (step 2)
  const keyAttrValue: number | null = null;

  const canNext = nameIsValid && !!avatarId;

  const handleBack = () => {
    if (heroId) {
      setLocation(`/heroes/create/attributes/${heroId}`);
    } else {
      setLocation('/hero/create/attributes');
    }
  };

  const handleNext = () => {
    if (heroId) {
      setLocation(`/hero/create/summary/${heroId}`);
    } else {
      setLocation('/hero/create/summary');
    }
  };

  if (!ancestry || !characterClass) return null;

  return (
    <div className="aesthetics-page-root">
      <div className="aesthetics-page-scroll">
        {/* Step Header */}
        <CreationStepHeader
          stepLabel="PASSO 03: ESTÉTICA"
          headline="ESTÉTICA E NOME"
          progressPct={75}
        />

        {/* 1. AVATAR SECTION */}
        <div className="aesthetics-glass-panel">
          <div className="aesthetics-avatar-header-row">
            <span className="aesthetics-avatar-section-title">Selecione seu Avatar</span>
            <button className="aesthetics-shuffle-btn" onClick={handleShuffle} type="button">
              <span className="aesthetics-shuffle-btn-icon">↻</span>
              <span className="aesthetics-shuffle-btn-text">GERAR NOVOS</span>
            </button>
          </div>

          {avatarError && (
            <div className="aesthetics-error-banner">
              <span className="aesthetics-error-banner-text">Erro ao carregar avatares.</span>
              <button className="aesthetics-retry-button" onClick={loadAvatars} type="button">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Main Avatar Display */}
          {loadingAvatars ? (
            <div className="aesthetics-main-avatar-skeleton" />
          ) : activePreset ? (
            <div className="aesthetics-main-avatar-container">
              <img
                src={activePreset.url}
                alt={activePreset.label}
                className="aesthetics-main-avatar-img"
              />
              <div className="aesthetics-main-avatar-gradient" />
              <div className="aesthetics-main-avatar-overlay">
                <div className="aesthetics-main-avatar-overlay-left">
                  {activePreset.recommended && (
                    <div className="aesthetics-recommended-badge">
                      <span className="aesthetics-recommended-text">RECOMENDADO</span>
                    </div>
                  )}
                  <span className="aesthetics-portrait-name">{activePreset.label}</span>
                </div>
                {activePreset.recommended && (
                  <span className="aesthetics-verified-icon">✓</span>
                )}
              </div>
            </div>
          ) : null}

          {/* Thumbnail Carousel */}
          <div className="aesthetics-thumbnail-carousel-container">
            <div className="aesthetics-thumbnail-carousel">
              {loadingAvatars
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aesthetics-thumbnail-thumb aesthetics-thumbnail-skeleton" />
                  ))
                : avatarList.map((preset) => {
                    const isSelected = avatarId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        className={`aesthetics-thumbnail-thumb ${
                          isSelected ? 'aesthetics-thumbnail-selected' : 'aesthetics-thumbnail-unselected'
                        }`}
                        onClick={() => setAvatar(preset.id, preset.url)}
                        type="button"
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className={`aesthetics-thumbnail-img ${
                            !isSelected ? 'aesthetics-thumbnail-img-unselected' : ''
                          }`}
                        />
                      </button>
                    );
                  })}
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
            onChange={(e) => handleNameChange(e.target.value)}
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
            <span className="aesthetics-char-count">{backstoryLen} / 500</span>
          </div>
        </div>

        {/* 4. CONTEXT GRID */}
        <div className="aesthetics-context-grid">
          <div className="aesthetics-context-box">
            <span className="aesthetics-context-box-label">CLASSE</span>
            <span className="aesthetics-context-box-value">{characterClass.name}</span>
          </div>
          <div className="aesthetics-context-box">
            <span className="aesthetics-context-box-label">RAÇA</span>
            <span className="aesthetics-context-box-value">{ancestry.name}</span>
          </div>
          <div className="aesthetics-context-box">
            <Tooltip text="O atributo mais importante para sua vocação.">
              <span className="aesthetics-context-box-label">{keyAttrLabel}</span>
            </Tooltip>
            <Tooltip text="Número somado ao dado nos testes. Quanto maior o atributo, maior o bônus.">
              <span className="aesthetics-context-box-value aesthetics-context-box-value-accent">
                {keyAttrValue ?? '—'}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      <CreationFooter
        onBack={handleBack}
        onNext={handleNext}
        canNext={canNext}
      />
    </div>
  );
}
