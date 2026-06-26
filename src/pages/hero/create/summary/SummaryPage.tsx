import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { heroApi } from '../../../../api/services/hero';
import { getAssetUrl } from '../../../../utils/url';
import type { HeroDetail, HeroAttributes } from '../../../../types';
import './SummaryPage.css';

// Mock values for kits and abilities by class slug (as seed fallback if empty from API)
interface KitItem {
  name: string;
  description: string;
  items: string[];
}

const CLASS_KITS: Record<string, KitItem[]> = {
  fighter: [
    {
      name: 'Baluarte Argênteo',
      description: 'Defesa impenetrável e controle de área.',
      items: ['Espada Longa', 'Escudo de Torre', 'Armadura de Cota de Malha'],
    },
    {
      name: 'Destruidora de Sóis',
      description: 'Poder de ataque brutal de duas mãos.',
      items: ['Espada de Duas Mãos (Montante)', 'Armadura de Couro Batido'],
    },
  ],
  wizard: [
    {
      name: 'Tomo Arcano',
      description: 'Estudo acadêmico de magia e conjurações complexas.',
      items: ['Cajado Rúnico', 'Livro de Magias', 'Componentes Arcanos'],
    },
  ],
  rogue: [
    {
      name: 'Sombra Silenciosa',
      description: 'Furtividade máxima e infiltração de precisão.',
      items: ['Espada Curta', 'Adaga (x2)', 'Ferramentas de Ladrão'],
    },
  ],
  paladin: [
    {
      name: 'Cruzado da Luz',
      description: 'Equipamento pesado consagrado para o combate divino.',
      items: ['Espada Longa', 'Escudo Sagrado', 'Cota de Malha'],
    },
  ],
};

interface AbilityItem {
  slug: string;
  name: string;
  type: 'action' | 'passive';
  description: string;
  manaCost: number;
}

const CLASS_ABILITIES: Record<string, AbilityItem[]> = {
  fighter: [
    {
      slug: 'second-wind',
      name: 'Retomar o Fôlego',
      type: 'action',
      description: 'Uma vez por combate, recupere vigor rapidamente.',
      manaCost: 0,
    },
    {
      slug: 'fighting-style',
      name: 'Estilo de Combate',
      type: 'passive',
      description: 'Sua maestria concede bônus permanentes de ataque.',
      manaCost: 0,
    },
    {
      slug: 'action-surge',
      name: 'Surto de Ação',
      type: 'action',
      description: 'Force seus limites físicos para agir mais uma vez no seu turno.',
      manaCost: 0,
    },
  ],
  wizard: [
    {
      slug: 'arcane-recovery',
      name: 'Recuperação Arcana',
      type: 'action',
      description: 'Medite para recuperar parte dos seus slots de magia gastos.',
      manaCost: 0,
    },
    {
      slug: 'ritual-casting',
      name: 'Conjuração de Ritual',
      type: 'passive',
      description: 'Conjure magias de ritual sem gastar slots.',
      manaCost: 0,
    },
  ],
  rogue: [
    {
      slug: 'sneak-attack',
      name: 'Ataque Furtivo',
      type: 'passive',
      description: 'Cause dano extra ao atingir alvos desprevenidos.',
      manaCost: 0,
    },
    {
      slug: 'expertise',
      name: 'Especialização',
      type: 'passive',
      description: 'Dobre sua proficiência em perícias cruciais.',
      manaCost: 0,
    },
  ],
  paladin: [
    {
      slug: 'divine-sense',
      name: 'Sentido Divino',
      type: 'action',
      description: 'Detecte a presença de seres celestiais, abissais ou mortos-vivos.',
      manaCost: 0,
    },
    {
      slug: 'lay-on-hands',
      name: 'Imposição de Mãos',
      type: 'action',
      description: 'Canalize energia sagrada para curar feridas com o toque.',
      manaCost: 0,
    },
  ],
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
        // Pre-select default kit if available
        const classSlug = data.class?.slug || 'fighter';
        const kits = CLASS_KITS[classSlug] || [];
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
  const kits = CLASS_KITS[classSlug] || [];
  const abilities = CLASS_ABILITIES[classSlug] || [];

  const handleAbilityToggle = (slug: string) => {
    if (selectedAbilities.includes(slug)) {
      setSelectedAbilities(selectedAbilities.filter((s) => s !== slug));
    } else {
      if (selectedAbilities.length < 2) {
        setSelectedAbilities([...selectedAbilities, slug]);
      }
    }
  };

  const canSubmit = !!selectedKit && selectedAbilities.length === 2 && !submitting;

  const handleBack = () => {
    setLocation(`/heroes/create/aesthetics/${heroId}`);
  };

  const getModifier = (val: number) => {
    return Math.floor((val - 10) / 2);
  };

  const attributeKeys: Array<keyof HeroAttributes> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const handleNext = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const baseAttributes: Record<string, number> = {};
      
      const sheetAttrs = hero.sheet?.base_attributes || hero.sheet?.attributes;
      if (sheetAttrs) {
        attributeKeys.forEach((key) => {
          baseAttributes[key] = sheetAttrs[key] || 10;
        });
      }

      // Finalize creation
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

      // Clear draft
      await heroApi.deleteDraft();
      
      // Go to dashboard
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
      <div className="summary-page-scroll">
        <CreationStepHeader
          stepLabel="PASSO 04: ARSENAL & REVISÃO"
          headline="DESTINO SELADO"
          progressPct={100}
        />

        {/* 1. HERO PREVIEW CARD */}
        <div className="summary-card aesthetics-glass-panel">
          <div className="summary-hero-row">
            {hero.avatar_url && (
              <img
                src={getAssetUrl(hero.avatar_url)}
                alt={hero.name}
                className="summary-hero-avatar"
              />
            )}
            <div className="summary-hero-meta">
              <h2 className="summary-hero-name">{hero.name}</h2>
              <p className="summary-hero-subtitle">
                {hero.ancestry?.name} • {hero.class?.name} • {hero.background?.name}
              </p>
            </div>
          </div>

          <div className="summary-attributes-grid">
            {attributeKeys.map((key) => {
              const val = (hero.sheet?.attributes?.[key] as number) || 10;
              const mod = getModifier(val);
              return (
                <div key={key} className="summary-attribute-box">
                  <span className="summary-attr-label">{key.toUpperCase()}</span>
                  <span className="summary-attr-val">{val}</span>
                  <span className="summary-attr-mod">
                    {mod >= 0 ? `+${mod}` : mod}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. KITS SECTION */}
        <div className="summary-section-title">Arsenal Inicial</div>
        <div className="summary-kits-container">
          {kits.map((kit) => {
            const isSelected = selectedKit === kit.name;
            return (
              <div
                key={kit.name}
                className={`summary-kit-card aesthetics-glass-panel ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedKit(kit.name)}
              >
                <div className="summary-kit-header">
                  <span className="summary-kit-name">{kit.name}</span>
                  <span className="summary-kit-radio">{isSelected ? '✓' : ''}</span>
                </div>
                <p className="summary-kit-desc">{kit.description}</p>
                <div className="summary-kit-items">
                  {kit.items.map((i) => (
                    <span key={i} className="summary-kit-item-tag">{i}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. ABILITIES SECTION */}
        <div className="summary-section-title">
          Habilidades de Classe ({selectedAbilities.length} / 2)
        </div>
        <div className="summary-abilities-container">
          {abilities.map((ability) => {
            const isSelected = selectedAbilities.includes(ability.slug);
            return (
              <div
                key={ability.slug}
                className={`summary-ability-card aesthetics-glass-panel ${isSelected ? 'selected' : ''}`}
                onClick={() => handleAbilityToggle(ability.slug)}
              >
                <div className="summary-ability-header">
                  <span className="summary-ability-name">{ability.name}</span>
                  <span className="summary-ability-badge">{ability.type.toUpperCase()}</span>
                </div>
                <p className="summary-ability-desc">{ability.description}</p>
              </div>
            );
          })}
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
