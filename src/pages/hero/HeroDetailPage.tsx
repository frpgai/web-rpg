import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { heroApi } from '../../api/services/hero';
import { getAssetUrl } from '../../utils/url';
import type { HeroDetail, HeroAbility } from '../../types';
import './HeroDetailPage.css';

// ── Constants ──────────────────────────────────────────────────────────────

const ATTR_ABBR: Record<string, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

const ATTR_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

const ALL_SKILLS: Array<{ slug: string; name: string; attr: string }> = [
  { slug: 'acrobatics',      name: 'Acrobacia',          attr: 'dex' },
  { slug: 'animal_handling', name: 'Trato c/ Animais',   attr: 'wis' },
  { slug: 'arcana',          name: 'Arcanismo',           attr: 'int' },
  { slug: 'athletics',       name: 'Atletismo',           attr: 'str' },
  { slug: 'deception',       name: 'Enganação',           attr: 'cha' },
  { slug: 'history',         name: 'História',            attr: 'int' },
  { slug: 'insight',         name: 'Intuição',            attr: 'wis' },
  { slug: 'intimidation',    name: 'Intimidação',         attr: 'cha' },
  { slug: 'investigation',   name: 'Investigação',        attr: 'int' },
  { slug: 'medicine',        name: 'Medicina',            attr: 'wis' },
  { slug: 'nature',          name: 'Natureza',            attr: 'int' },
  { slug: 'perception',      name: 'Percepção',           attr: 'wis' },
  { slug: 'performance',     name: 'Atuação',             attr: 'cha' },
  { slug: 'persuasion',      name: 'Persuasão',           attr: 'cha' },
  { slug: 'religion',        name: 'Religião',            attr: 'int' },
  { slug: 'sleight_of_hand', name: 'Prestidigitação',     attr: 'dex' },
  { slug: 'stealth',         name: 'Furtividade',         attr: 'dex' },
  { slug: 'survival',        name: 'Sobrevivência',       attr: 'wis' },
];

const ABILITY_TYPE_LABEL: Record<string, string> = {
  action:       'Ação',
  bonus_action: 'Ação Bônus',
  reaction:     'Reação',
  passive:      'Passiva',
};

const RARITY_LABEL: Record<string, string> = {
  common:    'Comum',
  uncommon:  'Incomum',
  rare:      'Raro',
  very_rare: 'Muito Raro',
  legendary: 'Lendário',
};

const PROFICIENCY_BONUS = 2; // level 1

// ── Component ─────────────────────────────────────────────────────────────

type TabKey = 'abilities' | 'backstory' | 'notes';

export default function HeroDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const heroId = params?.id ?? '';

  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('abilities');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!heroId) return;
    setLoading(true);
    setNetworkError(false);
    setErrorStatus(null);

    heroApi.get(heroId)
      .then((data) => setHero(data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) {
          setErrorStatus(status);
        } else {
          setNetworkError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [heroId, retryCount]);

  // ── Loading skeleton ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="hero-detail-root">
        <div className="hero-detail-scroll">
          <div className="hero-detail-skeleton-header" />
          <div className="hero-detail-skeleton-bars">
            <div className="hero-detail-skeleton-bar" />
            <div className="hero-detail-skeleton-bar" />
            <div className="hero-detail-skeleton-bar" />
          </div>
          <div className="hero-detail-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="hero-detail-skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error states ──────────────────────────────────────────────────────

  if (errorStatus === 404) {
    return (
      <div className="hero-detail-root hero-detail-error-page">
        <span className="material-symbols-outlined hero-detail-error-icon">person_off</span>
        <p className="hero-detail-error-title">Herói não encontrado</p>
        <button className="hero-detail-error-btn" onClick={() => setLocation('/dashboard')}>
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="hero-detail-root hero-detail-error-page">
        <span className="material-symbols-outlined hero-detail-error-icon">block</span>
        <p className="hero-detail-error-title">Você não tem acesso a este herói</p>
        <button className="hero-detail-error-btn" onClick={() => setLocation(-1 as unknown as string)}>
          Voltar
        </button>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="hero-detail-root hero-detail-error-page">
        <span className="material-symbols-outlined hero-detail-error-icon">wifi_off</span>
        <p className="hero-detail-error-title">Erro de conexão. Verifique sua internet.</p>
        <button className="hero-detail-error-btn" onClick={() => setRetryCount((c) => c + 1)}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!hero) return null;

  // ── Derived values ────────────────────────────────────────────────────

  const getAttrFinal = (key: string) => hero.attributes?.[key]?.final ?? 10;
  const getAttrMod   = (key: string) => hero.attributes?.[key]?.modifier ?? Math.floor((getAttrFinal(key) - 10) / 2);

  const hpPct  = hero.hp_max  > 0 ? Math.min(100, (hero.hp_current  / hero.hp_max)  * 100) : 0;
  const mpPct  = hero.mp_max  > 0 ? Math.min(100, (hero.mp_current  / hero.mp_max)  * 100) : 0;
  const xpPct  = hero.xp_next_level > 0 ? Math.min(100, (hero.xp / hero.xp_next_level) * 100) : 0;

  const proficientSlugs = new Set(hero.skills ?? []);

  const skillTestMod = (skill: { slug: string; attr: string }) => {
    const attrMod = getAttrMod(skill.attr);
    const isProficient = proficientSlugs.has(skill.slug);
    return attrMod + (isProficient ? PROFICIENCY_BONUS : 0);
  };

  const fmtMod = (n: number) => (n >= 0 ? `+${n}` : String(n));

  return (
    <div className="hero-detail-root">
      <div className="hero-detail-scroll">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="hero-detail-header">
          <div className="hero-detail-avatar-wrap">
            {hero.avatar_url ? (
              <img
                src={getAssetUrl(hero.avatar_url)}
                alt={hero.name}
                className="hero-detail-avatar"
              />
            ) : (
              <div className="hero-detail-avatar-placeholder">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
            <div className="hero-detail-level-badge">NÍV {hero.level}</div>
          </div>

          <div className="hero-detail-identity">
            <h1 className="hero-detail-name">{hero.name}</h1>
            <p className="hero-detail-class">{hero.class?.name ?? '—'}</p>
            {hero.ancestry && (
              <p className="hero-detail-ancestry">{hero.ancestry.name}</p>
            )}
            {hero.active_session && (
              <span className="hero-detail-session-chip">
                <span className="material-symbols-outlined">swords</span>
                {hero.active_session.name}
              </span>
            )}
          </div>
        </div>

        {/* ── Status bars ──────────────────────────────────────────── */}
        <div className="hero-detail-status-bars">
          <div className="hero-detail-bar-row">
            <span className="hero-detail-bar-label">
              <span className="material-symbols-outlined hero-detail-bar-icon hero-detail-bar-icon--hp">favorite</span>
              VIDA
            </span>
            <div className="hero-detail-bar-track">
              <div className="hero-detail-bar-fill hero-detail-bar-fill--hp" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hero-detail-bar-value">{hero.hp_current}/{hero.hp_max}</span>
          </div>

          {hero.mp_max > 0 && (
            <div className="hero-detail-bar-row">
              <span className="hero-detail-bar-label">
                <span className="material-symbols-outlined hero-detail-bar-icon hero-detail-bar-icon--mp">water_drop</span>
                MANA
              </span>
              <div className="hero-detail-bar-track">
                <div className="hero-detail-bar-fill hero-detail-bar-fill--mp" style={{ width: `${mpPct}%` }} />
              </div>
              <span className="hero-detail-bar-value">{hero.mp_current}/{hero.mp_max}</span>
            </div>
          )}

          <div className="hero-detail-bar-row">
            <span className="hero-detail-bar-label">
              <span className="material-symbols-outlined hero-detail-bar-icon hero-detail-bar-icon--xp">star</span>
              EXP
            </span>
            <div className="hero-detail-bar-track">
              <div className="hero-detail-bar-fill hero-detail-bar-fill--xp" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="hero-detail-bar-value">{hero.xp}/{hero.xp_next_level}</span>
          </div>
        </div>

        {/* ── Attribute grid ───────────────────────────────────────── */}
        <div className="hero-detail-attr-grid">
          {ATTR_KEYS.map((key) => {
            const val = getAttrFinal(key);
            const mod = getAttrMod(key);
            return (
              <div key={key} className="hero-detail-attr-card">
                <span className="hero-detail-attr-abbr">{ATTR_ABBR[key]}</span>
                <span className="hero-detail-attr-val">{val}</span>
                <span className="hero-detail-attr-mod">{fmtMod(mod)}</span>
              </div>
            );
          })}
        </div>

        {/* ── Skills ───────────────────────────────────────────────── */}
        <section className="hero-detail-section">
          <h2 className="hero-detail-section-title">
            <span className="material-symbols-outlined">history_edu</span>
            Perícias
          </h2>
          <div className="hero-detail-skills-list">
            {ALL_SKILLS.map((skill) => {
              const isProficient = proficientSlugs.has(skill.slug);
              const mod = skillTestMod(skill);
              return (
                <div
                  key={skill.slug}
                  className={`hero-detail-skill-row${isProficient ? ' hero-detail-skill-row--proficient' : ''}`}
                >
                  <span className={`hero-detail-skill-dot${isProficient ? ' hero-detail-skill-dot--proficient' : ''}`} />
                  <span className="hero-detail-skill-name">{skill.name}</span>
                  <span className="hero-detail-skill-attr">{ATTR_ABBR[skill.attr]}</span>
                  <span className="hero-detail-skill-mod">{fmtMod(mod)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Inventory ────────────────────────────────────────────── */}
        {hero.inventory && hero.inventory.length > 0 && (
          <section className="hero-detail-section">
            <h2 className="hero-detail-section-title">
              <span className="material-symbols-outlined">backpack</span>
              Inventário
            </h2>
            <div className="hero-detail-inventory-list">
              {hero.inventory.map((item) => (
                <div key={item.id} className="hero-detail-inventory-item">
                  <span className="hero-detail-inventory-name">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="hero-detail-inventory-qty">×{item.quantity}</span>
                  )}
                  <span className={`hero-detail-inventory-rarity hero-detail-inventory-rarity--${item.rarity}`}>
                    {RARITY_LABEL[item.rarity] ?? item.rarity}
                  </span>
                  <span className="hero-detail-inventory-weight">{item.weight_kg} kg</span>
                  {item.equipped && (
                    <span className="material-symbols-outlined hero-detail-inventory-equipped">check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="hero-detail-tabs">
          {(['abilities', 'backstory', 'notes'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              className={`hero-detail-tab-btn${activeTab === tab ? ' hero-detail-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'abilities' && 'Habilidades'}
              {tab === 'backstory' && 'História'}
              {tab === 'notes'     && 'Notas'}
            </button>
          ))}
        </div>

        {/* ── Tab: Habilidades ─────────────────────────────────────── */}
        {activeTab === 'abilities' && (
          <div className="hero-detail-abilities-grid">
            {hero.abilities && hero.abilities.length > 0 ? (
              hero.abilities.map((ability: HeroAbility) => (
                <div key={ability.id} className="hero-detail-ability-card">
                  <div className="hero-detail-ability-img-box">
                    {ability.image_url ? (
                      <img src={getAssetUrl(ability.image_url)} alt={ability.name} className="hero-detail-ability-img" />
                    ) : (
                      <span className="material-symbols-outlined hero-detail-ability-icon">bolt</span>
                    )}
                  </div>
                  <div className="hero-detail-ability-body">
                    <div className="hero-detail-ability-meta">
                      <span className={`hero-detail-ability-type hero-detail-ability-type--${ability.type}`}>
                        {ABILITY_TYPE_LABEL[ability.type] ?? ability.type}
                      </span>
                      {ability.mana_cost > 0 && (
                        <span className="hero-detail-ability-mana">
                          <span className="material-symbols-outlined">water_drop</span>
                          {ability.mana_cost}
                        </span>
                      )}
                    </div>
                    <h4 className="hero-detail-ability-name">{ability.name}</h4>
                    <p className="hero-detail-ability-desc">{ability.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="hero-detail-empty-text">Nenhuma habilidade registrada.</p>
            )}
          </div>
        )}

        {/* ── Tab: História ────────────────────────────────────────── */}
        {activeTab === 'backstory' && (
          <div className="hero-detail-backstory">
            <p>{hero.backstory || 'Este herói ainda não tem uma história escrita.'}</p>
          </div>
        )}

        {/* ── Tab: Notas ───────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="hero-detail-backstory">
            <p>Nenhuma nota registrada.</p>
          </div>
        )}

      </div>
    </div>
  );
}
