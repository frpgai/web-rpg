import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { heroApi } from '../../../../api/services/hero';
import { getAssetUrl } from '../../../../utils/url';
import type { HeroDetail, HeroAttributes } from '../../../../types';
import './SummaryPage.css';

interface KitItem {
  name: string;
  description: string;
  items: string[];
  icon: string;
}

// Aligned with class-specific choices shown in Stitch design
const CLASS_KITS: Record<string, KitItem[]> = {
  paladin: [
    {
      name: 'Baluarte Argênteo',
      description: 'Espada Curta & Escudo Torre. Foco em defesa impenetrável.',
      items: ['Espada Curta', 'Escudo Torre', 'Baluarte'],
      icon: 'shield',
    },
    {
      name: 'Destruidora de Sóis',
      description: 'Montante de Obsidiana. Foco em dano devastador em área.',
      items: ['Montante de Obsidiana', 'Armadura Pesada'],
      icon: 'swords',
    },
  ],
  fighter: [
    {
      name: 'Baluarte Argênteo',
      description: 'Espada Curta & Escudo Torre. Foco em defesa impenetrável.',
      items: ['Espada Curta', 'Escudo Torre', 'Baluarte'],
      icon: 'shield',
    },
    {
      name: 'Destruidora de Sóis',
      description: 'Montante de Obsidiana. Foco em dano devastador em área.',
      items: ['Montante de Obsidiana', 'Armadura Pesada'],
      icon: 'swords',
    },
  ],
  wizard: [
    {
      name: 'Tomo Arcano',
      description: 'Estudo acadêmico de magia e conjurações complexas.',
      items: ['Cajado Rúnico', 'Livro de Magias', 'Componentes Arcanos'],
      icon: 'menu_book',
    },
  ],
  rogue: [
    {
      name: 'Sombra Silenciosa',
      description: 'Furtividade máxima e infiltração de precisão.',
      items: ['Espada Curta', 'Adaga (x2)', 'Ferramentas de Ladrão'],
      icon: 'visibility_off',
    },
  ],
};

interface AbilityItem {
  slug: string;
  name: string;
  type: 'action' | 'passive';
  description: string;
  manaCost: number;
  icon: string;
}

const CLASS_ABILITIES: Record<string, AbilityItem[]> = {
  paladin: [
    {
      slug: 'aura-de-julgamento',
      name: 'Aura de Julgamento',
      type: 'action',
      description: 'Queima inimigos próximos com dano sagrado constante.',
      manaCost: 0,
      icon: 'flare',
    },
    {
      slug: 'estalo-penumbral',
      name: 'Estalo Penumbral',
      type: 'action',
      description: 'Teleporte curto que deixa uma explosão de sombra.',
      manaCost: 0,
      icon: 'bolt',
    },
    {
      slug: 'dadiva-de-aethel',
      name: 'Dádiva de Aethel',
      type: 'action',
      description: 'Cura aliados e remove efeitos de debilitação.',
      manaCost: 0,
      icon: 'healing',
    },
  ],
  fighter: [
    {
      slug: 'second-wind',
      name: 'Retomar o Fôlego',
      type: 'action',
      description: 'Uma vez por combate, recupere vigor rapidamente.',
      manaCost: 0,
      icon: 'air',
    },
    {
      slug: 'fighting-style',
      name: 'Estilo de Combate',
      type: 'passive',
      description: 'Sua maestria concede bônus permanentes de ataque.',
      manaCost: 0,
      icon: 'shield',
    },
    {
      slug: 'action-surge',
      name: 'Surto de Ação',
      type: 'action',
      description: 'Force seus limites físicos para agir mais uma vez no seu turno.',
      manaCost: 0,
      icon: 'bolt',
    },
  ],
  wizard: [
    {
      slug: 'arcane-recovery',
      name: 'Recuperação Arcana',
      type: 'action',
      description: 'Medite para recuperar parte dos seus slots de magia gastos.',
      manaCost: 0,
      icon: 'auto_fix_high',
    },
    {
      slug: 'ritual-casting',
      name: 'Conjuração de Ritual',
      type: 'passive',
      description: 'Conjure magias de ritual sem gastar slots.',
      manaCost: 0,
      icon: 'menu_book',
    },
  ],
  rogue: [
    {
      slug: 'sneak-attack',
      name: 'Ataque Furtivo',
      type: 'passive',
      description: 'Cause dano extra ao atingir alvos desprevenidos.',
      manaCost: 0,
      icon: 'visibility_off',
    },
    {
      slug: 'expertise',
      name: 'Especialização',
      type: 'passive',
      description: 'Dobre sua proficiência em perícias cruciais.',
      manaCost: 0,
      icon: 'military_tech',
    },
  ],
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  str: 'var(--color-secondary)',
  dex: 'var(--color-primary)',
  con: 'var(--color-tertiary)',
  int: 'var(--color-secondary)',
  wis: 'var(--color-text-muted)',
  cha: 'var(--color-primary)',
};

export default function SummaryPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedKit, setSelectedKit] = useState<string>('');
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  useEffect(() => {
    if (!heroId) {
      setLocation('/heroes/create/origins');
      return;
    }

    async function fetchHero() {
      try {
        const data = await heroApi.get(heroId!);
        setHero(data);
        const classSlug = data.class?.slug || 'fighter';
        const kits = CLASS_KITS[classSlug] || CLASS_KITS.fighter;
        if (kits.length > 0) {
          setSelectedKit(kits[0].name);
        }
      } catch (err) {
        console.error('Failed to load hero for summary:', err);
        setLocation('/heroes/create/origins');
      } finally {
        setLoading(false);
      }
    }

    fetchHero();
  }, [heroId, setLocation]);

  if (loading) {
    return <div className="summary-loading">Carregando resumo do destino...</div>;
  }

  if (!hero) return null;

  const classSlug = hero.class?.slug || 'fighter';
  const kits = CLASS_KITS[classSlug] || CLASS_KITS.fighter;
  const abilities = CLASS_ABILITIES[classSlug] || CLASS_ABILITIES.fighter;

  const handleAbilityToggle = (slug: string) => {
    if (selectedAbilities.includes(slug)) {
      setSelectedAbilities(selectedAbilities.filter((s) => s !== slug));
    } else {
      if (selectedAbilities.length < 2) {
        setSelectedAbilities([...selectedAbilities, slug]);
      } else {
        // Rotates the selection (removes the oldest one)
        setSelectedAbilities([selectedAbilities[1], slug]);
      }
    }
  };

  const canSubmit = !!selectedKit && selectedAbilities.length === 2 && !submitting;

  const handleBack = () => {
    setLocation(`/heroes/create/aesthetics/${heroId}`);
  };

  const attributeKeys: Array<keyof HeroAttributes> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const handleNext = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const baseAttributes: Record<string, number> = {};
      
      const rootAttrs = (hero as any).attributes;
      if (rootAttrs) {
        attributeKeys.forEach((key) => {
          const attrData = rootAttrs[key];
          baseAttributes[key] = typeof attrData === 'object' ? (attrData.value ?? attrData.final ?? 10) : (attrData || 10);
        });
      }

      await heroApi.create({
        name: hero.name,
        ancestry_id: hero.ancestry?.id || '',
        characterClass_id: hero.class?.id || '',
        vocation_id: hero.class?.id || '',
        attributes: baseAttributes as any,
        avatar_url: hero.avatar_url || '',
        backstory: hero.backstory || '',
        kit_slug: selectedKit,
        ability_slugs: selectedAbilities as [string, string],
      } as any);

      await heroApi.deleteDraft();
      setLocation('/dashboard');
    } catch (err) {
      console.error('Failed to finalize hero creation:', err);
      alert('Erro ao concluir criação do herói. Verifique seus atributos ou tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="summary-page-root">
      <div className="summary-bg-cinematic" />
      
      <div className="summary-page-scroll">
        <CreationStepHeader
          stepLabel="ETAPA 4: REVISÃO FINAL"
          headline="DESTINO SELADO"
          progressPct={100}
        />

        <div className="summary-layout-grid">
          {/* Left Column: Character Profile */}
          <div className="summary-left-col">
            <div className="summary-profile-card rim-light">
              <div className="summary-profile-header">
                <div className="summary-profile-title">
                  <h2>{hero.name || 'Sem Nome'}</h2>
                  <p className="summary-profile-class-slug">
                    CLASSE: {hero.class?.name || 'Classe desconhecida'}
                  </p>
                </div>
                <div className="summary-class-badge">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {classSlug === 'paladin' ? 'shield' : classSlug === 'wizard' ? 'auto_fix_high' : classSlug === 'rogue' ? 'visibility_off' : 'swords'}
                  </span>
                </div>
              </div>

              <div className="summary-portrait-container">
                {hero.avatar_url && (
                  <img
                    alt={`${hero.name} Portrait`}
                    className="summary-portrait-img"
                    src={getAssetUrl(hero.avatar_url)}
                  />
                )}
              </div>

              <div className="summary-attributes-progress">
                {attributeKeys.map((key) => {
                  const attrData = (hero as any).attributes?.[key];
                  const val = typeof attrData === 'object' ? (attrData.final ?? attrData.value ?? 10) : (attrData || 10);
                  const modifier = typeof attrData === 'object' ? (attrData.modifier ?? 0) : Math.floor((val - 10) / 2);
                  const label = ATTRIBUTE_LABELS[key] || key.toUpperCase();
                  const color = ATTRIBUTE_COLORS[key] || 'var(--color-primary)';
                  const percentage = Math.min(100, Math.max(0, (val / 20) * 100));

                  const modSign = modifier >= 0 ? `+${modifier}` : modifier;

                  return (
                    <div key={key} className="summary-attr-progress-row">
                      <p className="summary-attr-progress-label">
                        {label} <span className="summary-attr-mod-pill">({modSign})</span>
                      </p>
                      <div className="summary-attr-progress-bar-container">
                        <div className="summary-attr-progress-bar-bg">
                          <div
                            className="summary-attr-progress-bar-fill"
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="summary-attr-progress-value" style={{ color }}>
                          {val}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Choices */}
          <div className="summary-right-col">
            {/* Equipment Selection */}
            <div className="summary-section">
              <div className="summary-section-header">
                <div className="summary-section-title-wrapper">
                  <span className="material-symbols-outlined">crossword</span>
                  <h3 className="summary-section-title-text">Arsenal Inicial</h3>
                </div>
              </div>

              <div className="summary-kits-grid">
                {kits.map((kit) => {
                  const isSelected = selectedKit === kit.name;
                  return (
                    <div
                      key={kit.name}
                      className={`summary-kit-card-premium ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedKit(kit.name)}
                    >
                      <div className="summary-kit-check-icon">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      
                      <div className="summary-kit-card-premium-content">
                        <div className="summary-kit-icon-box">
                          <span className="material-symbols-outlined">
                            {kit.icon || 'swords'}
                          </span>
                        </div>
                        <div className="summary-kit-text-box">
                          <h4>{kit.name}</h4>
                          <p>{kit.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills Selection */}
            <div className="summary-section">
              <div className="summary-section-header">
                <div className="summary-section-title-wrapper">
                  <span className="material-symbols-outlined">magic_button</span>
                  <h3 className="summary-section-title-text">Habilidades Arcanas</h3>
                </div>
                <span className="summary-section-subtitle-badge">SELECIONE 2</span>
              </div>

              <div className="summary-abilities-grid-premium">
                {abilities.map((ability) => {
                  const isSelected = selectedAbilities.includes(ability.slug);
                  return (
                    <div
                      key={ability.slug}
                      className={`summary-ability-card-premium ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAbilityToggle(ability.slug)}
                    >
                      <div className="summary-ability-image-box">
                        <div className="summary-ability-image-box-overlay" />
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {ability.icon || 'bolt'}
                        </span>
                      </div>
                      <h5>{ability.name}</h5>
                      <p>{ability.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreationFooter
        onBack={handleBack}
        onNext={handleNext}
        canNext={canSubmit}
        nextLabel={submitting ? 'Salvando...' : 'Concluir Criação'}
      />
    </div>
  );
}
