import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { useHeroCreationStore } from '../../../../stores/heroCreationStore';
import { catalogApi } from '../../../../api/services/catalog';
import { heroApi } from '../../../../api/services/hero';
import type { AvatarPreset, HeroDetail } from '../../../../types';
import { getAssetUrl } from '../../../../utils/url';
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

  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [heroInitialized, setHeroInitialized] = useState(false);
  const [avatarList, setAvatarList] = useState<AvatarPreset[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [backstoryLen, setBackstoryLen] = useState(backstory.length);

  // ─── Load hero from backend when heroId is present ────────────────────────
  useEffect(() => {
    if (!heroId) {
      setHeroInitialized(true);
      return;
    }

    let cancelled = false;
    async function init() {
      try {
        const data = await heroApi.get(heroId!);
        if (cancelled) return;
        setHero(data);
        // Hydrate store from backend data
        if (data.name) setName(data.name);
        if (data.backstory) {
          setBackstory(data.backstory);
          setBackstoryLen(data.backstory.length);
        }
      } catch {
        setLocation('/hero/create/origins');
      } finally {
        if (!cancelled) setHeroInitialized(true);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [heroId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Guard: must have completed steps 1 and 2 ─────────────────────────────
  useEffect(() => {
    if (!heroInitialized) return;

    if (heroId) {
      if (!hero?.ancestry || !hero?.class || !hero?.background) {
        setLocation('/hero/create/origins');
        return;
      }
      const attrs = hero.sheet?.base_attributes ?? hero.sheet?.attributes;
      if (!attrs) {
        setLocation(`/heroes/create/attributes/${heroId}`);
      }
    } else {
      const { ancestry: a, characterClass: v, background: b } =
        useHeroCreationStore.getState();
      if (!a || !v || !b) {
        setLocation('/hero/create/origins');
      }
    }
  }, [heroInitialized, hero, heroId, setLocation]);

  // ─── Load avatars ──────────────────────────────────────────────────────────
  const loadAvatars = useCallback(async () => {
    const resolvedAncestry = ancestry ?? (hero?.ancestry ? { id: hero.ancestry.id } : null);
    const resolvedClass = characterClass ?? (hero?.class ? { id: hero.class.id } : null);
    const resolvedBackground = background ?? (hero?.background ? { id: hero.background.id } : null);
    if (!resolvedAncestry || !resolvedClass) return;
    setLoadingAvatars(true);
    setAvatarError(false);
    try {
      const presets = await catalogApi.fetchAvatars(
        resolvedAncestry.id,
        resolvedClass.id,
        resolvedBackground?.id,
      );
      setAvatarList(presets);
      // Hydrate avatar from hero backend data if present
      const heroAvatarUrl = hero?.avatar_url;
      if (heroAvatarUrl) {
        const matching = presets.find((p) => p.url === heroAvatarUrl);
        if (matching && !avatarId) {
          setAvatar(matching.id, matching.url);
        }
      } else {
        const rec = presets.find((p) => p.recommended);
        if (rec && !avatarId) {
          setAvatar(rec.id, rec.url);
        }
      }
    } catch (err) {
      console.error('Failed to load avatars preset:', err);
      setAvatarError(true);
    } finally {
      setLoadingAvatars(false);
    }
  }, [ancestry, characterClass, background, hero, avatarId, setAvatar]);

  useEffect(() => {
    if (!heroInitialized) return;
    loadAvatars();
  }, [loadAvatars, heroInitialized]);

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
  // When heroId is present, read from sheet; otherwise not available (step 2 not in this store)
  const keyAttr = characterClass?.key_attribute?.toLowerCase();
  const sheetAttrs = hero?.sheet?.attributes as Record<string, number> | undefined;
  const keyAttrValue: number | null =
    heroId && keyAttr && sheetAttrs ? (sheetAttrs[keyAttr] ?? null) : null;

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

  if (!heroInitialized) return null;
  if (!heroId && (!ancestry || !characterClass)) return null;

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
                  <span className="aesthetics-portrait-name">{activePreset?.label ?? ''}</span>
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
              {loadingAvatars
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
                        onClick={() => setAvatar(preset.id, preset.url)}
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
            <span className="aesthetics-context-box-value">
              {characterClass?.name ?? hero?.class?.name ?? '—'}
            </span>
          </div>
          <div className="aesthetics-context-box">
            <span className="aesthetics-context-box-label">RAÇA</span>
            <span className="aesthetics-context-box-value">
              {ancestry?.name ?? hero?.ancestry?.name ?? '—'}
            </span>
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
