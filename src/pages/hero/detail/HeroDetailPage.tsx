import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useHero } from './useHero';
import { getAssetUrl } from '../../../utils/url';
import { Tooltip } from '../../../components/ui/Tooltip';
import type { HeroAbility, InventoryItem } from '../../../types';
import './HeroDetailPage.css';

// ── Constants ──────────────────────────────────────────────────────────────

const ATTR_META: Array<{ key: string; abbr: string; icon: string; tooltip: string }> = [
  { key: 'str', abbr: 'FOR', icon: 'fitness_center', tooltip: 'Força — poder físico bruto' },
  { key: 'dex', abbr: 'DES', icon: 'bolt',           tooltip: 'Destreza — agilidade e reflexos' },
  { key: 'con', abbr: 'CON', icon: 'favorite',       tooltip: 'Constituição — resistência e vitalidade' },
  { key: 'int', abbr: 'INT', icon: 'psychology',     tooltip: 'Inteligência — raciocínio e memória' },
  { key: 'wis', abbr: 'SAB', icon: 'auto_awesome',   tooltip: 'Sabedoria — percepção e intuição' },
  { key: 'cha', abbr: 'CAR', icon: 'theater_comedy', tooltip: 'Carisma — força de personalidade' },
];

const ABILITY_TYPE_TOOLTIP: Record<string, string> = {
  action:       'Ação padrão no turno',
  bonus_action: 'Ação bônus — limitada a 1 por turno',
  reaction:     'Reação — 1 por rodada, fora do seu turno',
  passive:      'Habilidade passiva — sempre ativa',
};

const RARITY_TOOLTIP: Record<string, string> = {
  common:    'Item comum — sem propriedades especiais',
  uncommon:  'Item incomum — levemente aprimorado',
  rare:      'Item raro — poderes notáveis',
  very_rare: 'Item muito raro — extremamente poderoso',
  legendary: 'Item lendário — artefato único',
};

const ATTR_ABBR: Record<string, string> = Object.fromEntries(
  ATTR_META.map(({ key, abbr }) => [key, abbr]),
);

const ALL_SKILLS: Array<{ slug: string; name: string; attr: string }> = [
  { slug: 'acrobatics',      name: 'Acrobacia',         attr: 'dex' },
  { slug: 'animal_handling', name: 'Trato c/ Animais',  attr: 'wis' },
  { slug: 'arcana',          name: 'Arcanismo',          attr: 'int' },
  { slug: 'athletics',       name: 'Atletismo',          attr: 'str' },
  { slug: 'deception',       name: 'Enganação',          attr: 'cha' },
  { slug: 'history',         name: 'História',           attr: 'int' },
  { slug: 'insight',         name: 'Intuição',           attr: 'wis' },
  { slug: 'intimidation',    name: 'Intimidação',        attr: 'cha' },
  { slug: 'investigation',   name: 'Investigação',       attr: 'int' },
  { slug: 'medicine',        name: 'Medicina',           attr: 'wis' },
  { slug: 'nature',          name: 'Natureza',           attr: 'int' },
  { slug: 'perception',      name: 'Percepção',          attr: 'wis' },
  { slug: 'performance',     name: 'Atuação',            attr: 'cha' },
  { slug: 'persuasion',      name: 'Persuasão',          attr: 'cha' },
  { slug: 'religion',        name: 'Religião',           attr: 'int' },
  { slug: 'sleight_of_hand', name: 'Prestidigitação',    attr: 'dex' },
  { slug: 'stealth',         name: 'Furtividade',        attr: 'dex' },
  { slug: 'survival',        name: 'Sobrevivência',      attr: 'wis' },
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

function getProficiencyBonus(level: number): number {
  if (level <= 4)  return 2;
  if (level <= 8)  return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

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
  const rarity = item.rarity;
  return (
    <div className={`hd-inv-item hd-inv-item--${rarity}`}>
      <div className={`hd-inv-icon-box hd-inv-icon-box--${rarity}`}>
        <span className="material-symbols-outlined">inventory_2</span>
      </div>
      <div className="hd-inv-info">
        <p className="hd-inv-name">{item.name}</p>
        <p className="hd-inv-rarity">
          <Tooltip text={RARITY_TOOLTIP[rarity] ?? rarity}>
            {RARITY_LABEL[rarity] ?? rarity}
          </Tooltip>
        </p>
      </div>
      <span className="hd-inv-weight">{item.weight_kg} kg</span>
    </div>
  );
}

function AbilityCard({ ability }: { ability: HeroAbility }) {
  const type = ability.type;
  const isPassive = type === 'passive';
  return (
    <div className={`hd-ability-card hd-ability-card--${type}`}>
      <div className="hd-ability-header">
        <h4 className={`hd-ability-name hd-ability-name--${type}`}>{ability.name}</h4>
        <Tooltip text={ABILITY_TYPE_TOOLTIP[type] ?? type}>
          <span className={`hd-ability-badge hd-ability-badge--${type}`}>
            {ABILITY_TYPE_LABEL[type] ?? type}
          </span>
        </Tooltip>
      </div>
      <p className="hd-ability-desc">{ability.description}</p>
      <div className="hd-ability-footer">
        {ability.mana_cost > 0 && (
          <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
            Custo: {ability.mana_cost} MP
          </span>
        )}
        <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
          <Tooltip text="Distância máxima de alcance da habilidade">
            Alcance
          </Tooltip>: {ability.range || '—'}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function HeroDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const heroId = params?.id ?? '';

  const { hero, loading, error, errorStatus, refresh } = useHero(heroId);
  const [activeTab, setActiveTab] = useState<TabKey>('abilities');

  // Network error (non-404, non-403): show toast, keep skeleton behind
  const isNetworkError = !!error && errorStatus === null;

  if (loading) return <HeroDetailSkeleton />;

  if (errorStatus === 404 || errorStatus === 403) {
    return (
      <HeroDetailError
        message={errorStatus === 404 ? 'Herói não encontrado' : 'Você não tem acesso a este herói'}
        buttonLabel={errorStatus === 403 ? 'Voltar' : 'Voltar ao Dashboard'}
        onAction={() => {
          if (errorStatus === 403) setLocation(-1 as unknown as string);
          else setLocation('/dashboard');
        }}
      />
    );
  }

  if (isNetworkError && !hero) return (
    <div className="hd-root">
      <HeroDetailSkeleton />
      <div className="hd-toast-overlay">
        <div className="hd-toast-bar">
          <span className="hd-toast-msg">Erro de conexão. Tente novamente.</span>
          <button className="hd-toast-retry" onClick={refresh}>Tentar novamente</button>
        </div>
      </div>
    </div>
  );

  if (!hero) return null;

  // ── Derived values ────────────────────────────────────────────────────
  const getAttrFinal = (key: string) => hero.attributes?.[key]?.final ?? 10;
  const getAttrMod   = (key: string) => hero.attributes?.[key]?.modifier ?? Math.floor((getAttrFinal(key) - 10) / 2);

  const hpPct  = hero.hp_max  > 0 ? Math.min(100, (hero.hp_current  / hero.hp_max)  * 100) : 0;
  const mpPct  = hero.mp_max  > 0 ? Math.min(100, (hero.mp_current  / hero.mp_max)  * 100) : 0;
  const xpPct  = hero.xp_next_level > 0 ? Math.min(100, (hero.xp / hero.xp_next_level) * 100) : 0;

  const pb = getProficiencyBonus(hero.level);
  const proficientSlugs = new Set(hero.skills ?? []);

  const skillTestMod = (skill: { slug: string; attr: string }) => {
    const attrMod = getAttrMod(skill.attr);
    return attrMod + (proficientSlugs.has(skill.slug) ? pb : 0);
  };

  return (
    <div className="hd-root">
      {isNetworkError && (
        <div className="hd-toast-overlay">
          <div className="hd-toast-bar">
            <span className="hd-toast-msg">Erro de conexão. Tente novamente.</span>
            <button className="hd-toast-retry" onClick={refresh}>Tentar novamente</button>
          </div>
        </div>
      )}
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
            <Tooltip text="Nível do herói">
              <div className="hd-level-badge">NÍVEL {hero.level}</div>
            </Tooltip>
          </div>

          <div className="hd-identity">
            <h1 className="hd-hero-name">{hero.name}</h1>
            <div className="hd-chips">
              {hero.ancestry && (
                <span className="hd-chip hd-chip--ancestry">{hero.ancestry.name}</span>
              )}
              {hero.background && (
                <span className="hd-chip hd-chip--background">{hero.background.name}</span>
              )}
              {hero.class && (
                <span className="hd-chip hd-chip--class">{hero.class.name}</span>
              )}
            </div>
            {hero.active_session && (
              <div className="hd-session-chip">
                <span className="material-symbols-outlined">swords</span>
                {hero.active_session.name}
              </div>
            )}

            {/* ── Status Bars ──────────────────────────────────── */}
            <div className="hd-bars">
              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <Tooltip text="Pontos de Vida — chega a 0 e você cai">
                    <span className="hd-bar-label hd-bar-label--hp">VIDA</span>
                  </Tooltip>
                  <span className="hd-bar-value">{hero.hp_current} / {hero.hp_max}</span>
                </div>
                <div className="hd-bar-track">
                  <div className="hd-bar-fill hd-bar-fill--hp" style={{ width: `${hpPct}%` }} />
                </div>
              </div>

              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <Tooltip text="Pontos de Mana — custo de habilidades mágicas">
                    <span className="hd-bar-label hd-bar-label--mp">MANA</span>
                  </Tooltip>
                  <span className="hd-bar-value">{hero.mp_current} / {hero.mp_max}</span>
                </div>
                <div className="hd-bar-track">
                  <div className="hd-bar-fill hd-bar-fill--mp" style={{ width: `${mpPct}%` }} />
                </div>
              </div>

              <div className="hd-bar-row">
                <div className="hd-bar-label-row">
                  <Tooltip text="Experiência — acumulada para subir de nível">
                    <span className="hd-bar-label hd-bar-label--xp">EXP</span>
                  </Tooltip>
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
          {ATTR_META.map(({ key, abbr, icon, tooltip }) => {
            const val = getAttrFinal(key);
            const mod = getAttrMod(key);
            return (
              <div key={key} className="hd-attr-card">
                <span className="material-symbols-outlined hd-attr-icon">{icon}</span>
                <Tooltip text={tooltip}>
                  <span className="hd-attr-abbr">{abbr}</span>
                </Tooltip>
                <span className="hd-attr-val">{val}</span>
                <Tooltip text="Modificador de atributo">
                  <span className="hd-attr-mod">{fmtMod(mod)}</span>
                </Tooltip>
              </div>
            );
          })}
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
            <h2 className="hd-section-title">
              <span className="material-symbols-outlined">history_edu</span>
              Perícias
            </h2>
            <div className="hd-skills-list">
              {ALL_SKILLS.map((skill) => {
                const isProficient = proficientSlugs.has(skill.slug);
                const mod = skillTestMod(skill);
                return (
                  <div
                    key={skill.slug}
                    className={`hd-skill-row${isProficient ? ' hd-skill-row--proficient' : ''}`}
                  >
                    <span className={`hd-skill-dot${isProficient ? ' hd-skill-dot--proficient' : ''}`} />
                    <span className="hd-skill-name">{skill.name}</span>
                    <span className="hd-skill-attr">{ATTR_ABBR[skill.attr]}</span>
                    <span className="hd-skill-mod">{fmtMod(mod)}</span>
                  </div>
                );
              })}
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
