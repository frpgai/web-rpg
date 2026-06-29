import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useHero } from './useHero';
import { getAssetUrl } from '../../../utils/url';
import type { HeroAbility, InventoryItem } from '../../../types';
import './HeroDetailPage.css';

// ── Constants ──────────────────────────────────────────────────────────────

const ATTR_ICON: Record<string, string> = {
  str: 'fitness_center',
  dex: 'bolt',
  con: 'favorite',
  int: 'psychology',
  wis: 'auto_awesome',
  cha: 'theater_comedy',
};


function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

type TabKey = 'abilities' | 'backstory' | 'notes';

// ── Sub-components ─────────────────────────────────────────────────────────

function HeroDetailSkeleton() {
  return (
    <div className="hd-root">
      <div className="hd-scroll">
        <div className="hd-skeleton-header">
          <div className="hd-skeleton-avatar" />
          <div className="hd-skeleton-identity">
            <div className="hd-skeleton-line hd-skeleton-line--lg" />
            <div className="hd-skeleton-line hd-skeleton-line--md" />
            <div className="hd-skeleton-line hd-skeleton-line--sm" />
          </div>
        </div>
        <div className="hd-skeleton-bars">
          <div className="hd-skeleton-bar" />
          <div className="hd-skeleton-bar" />
          <div className="hd-skeleton-bar" />
        </div>
        <div className="hd-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hd-skeleton-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroDetailError({
  message,
  buttonLabel,
  onAction,
}: {
  message: string;
  buttonLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="hd-root hd-error-page">
      <span className="material-symbols-outlined hd-error-icon">sentiment_dissatisfied</span>
      <p className="hd-error-title">{message}</p>
      <button className="hd-error-btn" onClick={onAction}>{buttonLabel}</button>
    </div>
  );
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const { t } = useTranslation('common');
  const rarity = item.rarity;
  return (
    <div className={`hd-inv-item hd-inv-item--${rarity}`}>
      <div className={`hd-inv-icon-box hd-inv-icon-box--${rarity}`}>
        <span className="material-symbols-outlined">inventory_2</span>
      </div>
      <div className="hd-inv-info">
        <p className="hd-inv-name">{item.name}</p>
        <p className="hd-inv-rarity">{t(`rarity.${rarity}`) || rarity}</p>
      </div>
      <span className="hd-inv-weight">{item.weight_kg} kg</span>
    </div>
  );
}

function AbilityCard({ ability }: { ability: HeroAbility }) {
  const { t } = useTranslation('common');
  const type = ability.type;
  const isPassive = type === 'passive';
  const typeLabel = t(`ability_type.${type}`) || type;
  const rangeValue = ability.range;
  return (
    <div className={`hd-ability-card hd-ability-card--${type}`}>
      <div className="hd-ability-header">
        <div className="hd-ability-title-row">
          {ability.image_url ? (
            <img src={ability.image_url} alt={ability.name} className="hd-ability-icon" />
          ) : (
            <span className="material-symbols-outlined hd-ability-icon-fallback">auto_fix_high</span>
          )}
          <h4 className={`hd-ability-name hd-ability-name--${type}`}>{ability.name}</h4>
        </div>
        <span className={`hd-ability-badge hd-ability-badge--${type}`}>
          {typeLabel}
        </span>
      </div>
      <p className="hd-ability-desc">{ability.description}</p>
      <div className="hd-ability-footer">
        {ability.mana_cost > 0 && (
          <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
            Custo: {ability.mana_cost} MP
          </span>
        )}
        <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
          Alcance: {t(`ability_range.${rangeValue}`, { ns: 'common', defaultValue: rangeValue })}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function HeroDetailPage() {
  const { t } = useTranslation(['attributes', 'common']);

  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const heroId = params?.id ?? '';

  const { hero, loading, error, errorStatus, refresh } = useHero(heroId);
  const [activeTab, setActiveTab] = useState<TabKey>('abilities');

  const [showOnlyProficient, setShowOnlyProficient] = useState(false);

  if (loading) return <HeroDetailSkeleton />;

  if (errorStatus === 404 || (!hero && error)) {
    return (
      <HeroDetailError
        message={errorStatus === 404 ? 'Herói não encontrado' : errorStatus === 403 ? 'Você não tem acesso a este herói' : (error ?? 'Erro desconhecido')}
        buttonLabel={errorStatus === 403 ? 'Voltar' : errorStatus === 404 ? 'Voltar ao Dashboard' : 'Tentar novamente'}
        onAction={() => {
          if (errorStatus === 403) setLocation(-1 as unknown as string);
          else if (errorStatus === 404) setLocation('/dashboard');
          else refresh();
        }}
      />
    );
  }

  if (!hero) return null;

  // ── Derived values ────────────────────────────────────────────────────
  const getAttrFinal = (key: string) => hero.attributes?.[key]?.final ?? 10;
  const getAttrMod   = (key: string) => hero.attributes?.[key]?.modifier ?? Math.floor((getAttrFinal(key) - 10) / 2);

  const hpPct  = hero.hp_max  > 0 ? Math.min(100, (hero.hp_current  / hero.hp_max)  * 100) : 0;
  const mpPct  = hero.mp_max  > 0 ? Math.min(100, (hero.mp_current  / hero.mp_max)  * 100) : 0;
  const xpPct  = hero.xp_next_level > 0 ? Math.min(100, (hero.xp / hero.xp_next_level) * 100) : 0;

  const skillMod = (skill: { base_ability: string; proficient: boolean }) => {
    const attrMod = getAttrMod(skill.base_ability);
    return attrMod + (skill.proficient ? hero.proficiency_bonus : 0);
  };

  return (
    <div className="hd-root">
      <div className="hd-scroll">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="hd-header">
          <div className="hd-avatar-wrap">
            {hero.avatar_url ? (
              <img
                src={getAssetUrl(hero.avatar_url)}
                alt={hero.name}
                className="hd-avatar"
              />
            ) : (
              <div className="hd-avatar-placeholder">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
            <div className="hd-level-badge">NÍVEL {hero.level}</div>
            <div className="hd-def-badge">
              <span className="material-symbols-outlined">shield</span>
              {hero.def}
            </div>
          </div>

          <div className="hd-identity">
            <h1 className="hd-hero-name">{hero.name}</h1>
            <div className="hd-identity-rows">
              {hero.class && (
                <div className="hd-identity-row">
                  <span className="hd-identity-label">Vocação / Classe</span>
                  <span className="hd-chip hd-chip--class">{hero.class.name}</span>
                </div>
              )}
              {hero.ancestry && (
                <div className="hd-identity-row">
                  <span className="hd-identity-label">Ancestralidade</span>
                  <span className="hd-chip hd-chip--ancestry">{hero.ancestry.name}</span>
                </div>
              )}
              {hero.background && (
                <div className="hd-identity-row">
                  <span className="hd-identity-label">Antecedente</span>
                  <span className="hd-chip hd-chip--background">{hero.background.name}</span>
                </div>
              )}
            </div>
            {/* ── Status Bars ──────────────────────────────────── */}
            <div className="hd-bars">
              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <span className="hd-bar-label hd-bar-label--hp">VIDA</span>
                  <span className="hd-bar-value">{hero.hp_current} / {hero.hp_max}</span>
                </div>
                <div className="hd-bar-track">
                  <div className="hd-bar-fill hd-bar-fill--hp" style={{ width: `${hpPct}%` }} />
                </div>
              </div>

              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <span className="hd-bar-label hd-bar-label--mp">MANA</span>
                  <span className="hd-bar-value">{hero.mp_current} / {hero.mp_max}</span>
                </div>
                <div className="hd-bar-track">
                  <div className="hd-bar-fill hd-bar-fill--mp" style={{ width: `${mpPct}%` }} />
                </div>
              </div>

              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <span className="hd-bar-label hd-bar-label--xp">EXP</span>
                  <span className="hd-bar-value">{hero.xp} / {hero.xp_next_level}</span>
                </div>
                <div className="hd-bar-track">
                  <div className="hd-bar-fill hd-bar-fill--xp hd-bar-fill--xp-thin" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Attribute Grid ──────────────────────────────────────────── */}
        <div className="hd-attr-grid">
          {hero.attributes && Object.entries(hero.attributes).map(([key, attr]) => (
            <div key={key} className="hd-attr-card">
              <span className="material-symbols-outlined hd-attr-icon">{ATTR_ICON[key] ?? 'star'}</span>
              <span className="hd-attr-abbr">{t(`${key}.abbreviation`, { ns: 'attributes' }) || key.toUpperCase()}</span>
              <span className="hd-attr-val">{attr.final}</span>
              <span className="hd-attr-mod">{fmtMod(attr.modifier)}</span>
            </div>
          ))}
        </div>

        {/* ── Inventory + Tabs layout ─────────────────────────────────── */}
        <div className="hd-main-layout">

          {/* ── Inventory ───────────────────────────────────────── */}
          {hero.inventory && hero.inventory.length > 0 && (
            <section className="hd-section">
              <h2 className="hd-section-title">
                <span className="material-symbols-outlined">backpack</span>
                Inventário
              </h2>
              <div className="hd-inv-list">
                {hero.inventory.map((item) => (
                  <InventoryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* ── Skills ──────────────────────────────────────────── */}
          <section className="hd-section">
            <div className="hd-section-header-with-toggle">
              <h2 className="hd-section-title" style={{ margin: 0 }}>
                <span className="material-symbols-outlined">history_edu</span>
                Perícias
              </h2>
              <button
                className="hd-skills-toggle-btn"
                onClick={() => setShowOnlyProficient(!showOnlyProficient)}
              >
                {showOnlyProficient ? 'Mostrar Todas' : 'Apenas Treinadas'}
              </button>
            </div>
            <div className="hd-skills-list">
              {(hero.skills ?? [])
                .filter((skill) => !showOnlyProficient || skill.proficient)
                .map((skill) => {
                  const mod = skillMod(skill);
                  return (
                    <div
                      key={skill.slug}
                      className={`hd-skill-row${skill.proficient ? ' hd-skill-row--proficient' : ''}`}
                    >
                      <span className={`hd-skill-dot${skill.proficient ? ' hd-skill-dot--proficient' : ''}`} />
                      <span className="hd-skill-name">{skill.name}</span>
                      <span className="hd-skill-attr">{skill.base_ability.toUpperCase()}</span>
                      <span className="hd-skill-mod">{fmtMod(mod)}</span>
                    </div>
                  );
                })}
              {showOnlyProficient && (hero.skills ?? []).filter((s) => s.proficient).length === 0 && (
                <div className="hd-empty-text" style={{ padding: 'var(--space-md)' }}>
                  Nenhuma perícia treinada.
                </div>
              )}
            </div>
          </section>

          {/* ── Tabs ────────────────────────────────────────────── */}
          <section className="hd-tabs-section">
            <div className="hd-tabs-bar">
              {(['abilities', 'backstory', 'notes'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  className={`hd-tab-btn${activeTab === tab ? ' hd-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'abilities' && 'Habilidades'}
                  {tab === 'backstory' && 'História'}
                  {tab === 'notes'     && 'Notas'}
                </button>
              ))}
            </div>

            {/* Habilidades */}
            {activeTab === 'abilities' && (
              <div className="hd-abilities-grid">
                {hero.abilities && hero.abilities.length > 0 ? (
                  hero.abilities.map((ab) => <AbilityCard key={ab.id} ability={ab} />)
                ) : (
                  <p className="hd-empty-text">Nenhuma habilidade registrada.</p>
                )}
              </div>
            )}

            {/* História */}
            {activeTab === 'backstory' && (
              <div className="hd-glass-panel">
                <p className="hd-backstory-text">
                  {hero.backstory || 'Este herói ainda não tem uma história escrita.'}
                </p>
              </div>
            )}

            {/* Notas */}
            {activeTab === 'notes' && (
              <div className="hd-glass-panel hd-notes-empty">
                <span className="material-symbols-outlined hd-notes-icon">edit_note</span>
                <p className="hd-notes-label">Nenhuma nota registrada.</p>
              </div>
            )}
          </section>
        </div>

      </div>

      {/* ── Bottom Nav ─────────────────────────────────────────────────── */}
      <nav className="hd-bottom-nav">
        <a
          className="hd-nav-item"
          href="#/dashboard"
          onClick={(e) => { e.preventDefault(); setLocation('/dashboard'); }}
        >
          <span className="material-symbols-outlined">fort</span>
          <span className="hd-nav-label">Home</span>
        </a>
        <a className="hd-nav-item hd-nav-item--active" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="hd-nav-label">Herói</span>
        </a>
        <a className="hd-nav-item" href="#">
          <span className="material-symbols-outlined">group</span>
          <span className="hd-nav-label">Social</span>
        </a>
        <a className="hd-nav-item" href="#">
          <span className="material-symbols-outlined">settings</span>
          <span className="hd-nav-label">Opções</span>
        </a>
      </nav>
    </div>
  );
}
