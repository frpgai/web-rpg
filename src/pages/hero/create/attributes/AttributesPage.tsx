import { useLocation, useParams } from 'wouter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../../components/hero-creation/OracleButton';
import { usePointBuyRules } from '../../../../hooks/usePointBuyRules';
import { getSystemAttributes, previewAttributes, saveDraftAttributes } from '../../../../api/services/attributes';
import type { SystemAttribute } from '../../../../api/services/attributes';
import { heroApi } from '../../../../api/services/hero';
import { AttributeGrid } from './_AttributeGrid';
import { PointPoolCard } from './_PointPoolCard';
import { CharacterPreviewSummary } from './_CharacterPreviewSummary';
import type { HeroAttributes, HeroDetail } from '../../../../types';
import type { PointBuyRules } from '../../../../hooks/usePointBuyRules';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import './AttributesPage.css';

function rollRandomAttributes(rules: PointBuyRules, keys: string[]): HeroAttributes {
  const MAX_RETRIES = 100;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const attrs = Object.fromEntries(keys.map((k) => [k, rules.min])) as HeroAttributes;
    let remaining = rules.budget;
    const shuffled = [...keys].sort(() => Math.random() - 0.5);

    let valid = true;
    for (let i = 0; i < shuffled.length; i++) {
      const key = shuffled[i];
      const isLast = i === shuffled.length - 1;

      if (isLast) {
        const target = Object.entries(rules.costTable).find(([, cost]) => cost === remaining);
        if (!target) { valid = false; break; }
        attrs[key as keyof HeroAttributes] = Number(target[0]);
        remaining = 0;
      } else {
        const affordable = Object.entries(rules.costTable)
          .filter(([v, cost]) => Number(v) >= rules.min && cost <= remaining)
          .map(([v]) => Number(v));
        if (affordable.length === 0) { valid = false; break; }
        const pick = affordable[Math.floor(Math.random() * affordable.length)];
        attrs[key as keyof HeroAttributes] = pick;
        remaining -= rules.costTable[pick];
      }
    }

    if (valid && remaining === 0) return attrs;
  }

  // Fallback: all attributes at min
  return Object.fromEntries(keys.map((k) => [k, rules.min])) as HeroAttributes;
}

export default function AttributesPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  const [helpOpen, setHelpOpen] = useState(false);
  const [systemAttributes, setSystemAttributes] = useState<SystemAttribute[]>([]);
  const [modifiers, setModifiers] = useState<Record<string, number>>({});
  const [previewEligibleAttributes, setPreviewEligibleAttributes] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [heroInitialized, setHeroInitialized] = useState(false);
  const [heroLoading, setHeroLoading] = useState(true);
  const [attrsLoading, setAttrsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 local state — 8 matches FALLBACK.min in usePointBuyRules
  const [attrs, setAttrs] = useState<HeroAttributes>({
    str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8,
  });
  const [allocatedBonuses, setAllocatedBonuses] = useState<Record<string, number>>({});
  const [asiAllPlus1, setAsiAllPlus1] = useState(false);

  const asiPlus2 = useMemo(() => {
    return Object.entries(allocatedBonuses).find(([, v]) => v === 2)?.[0] ?? null;
  }, [allocatedBonuses]);

  const asiPlus1 = useMemo(() => {
    return Object.entries(allocatedBonuses).find(([, v]) => v === 1)?.[0] ?? null;
  }, [allocatedBonuses]);

  // Hero data from API (replaces store for origins context)
  const [hero, setHero] = useState<HeroDetail | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate attributes and bonuses from loaded draft hero
  useEffect(() => {
    if (hydratedRef.current || !hero || systemAttributes.length === 0) return;

    // Check if we have top-level attributes (from backend Go model)
    const backendAttrs = (hero as any).attributes;
    // Check if we have sheet-level attributes (fallback, legacy)
    const baseAttrs = (hero as any).sheet?.base_attributes;
    const bonuses = (hero as any).sheet?.bonuses;

    if (backendAttrs) {
      setAttrs({
        str: backendAttrs.str?.base ?? 8,
        dex: backendAttrs.dex?.base ?? 8,
        con: backendAttrs.con?.base ?? 8,
        int: backendAttrs.int?.base ?? 8,
        wis: backendAttrs.wis?.base ?? 8,
        cha: backendAttrs.cha?.base ?? 8,
      });

      const nonZeroBonuses: Record<string, number> = {};
      for (const [k, v] of Object.entries(backendAttrs)) {
        const bonusVal = (v as any).bonus ?? 0;
        if (bonusVal > 0) {
          nonZeroBonuses[k] = bonusVal;
        }
      }
      setAllocatedBonuses(nonZeroBonuses);
      hydratedRef.current = true;
    } else if (baseAttrs) {
      setAttrs({
        str: baseAttrs.str ?? 8,
        dex: baseAttrs.dex ?? 8,
        con: baseAttrs.con ?? 8,
        int: baseAttrs.int ?? 8,
        wis: baseAttrs.wis ?? 8,
        cha: baseAttrs.cha ?? 8,
      });

      if (bonuses) {
        const nonZeroBonuses: Record<string, number> = {};
        for (const [k, v] of Object.entries(bonuses)) {
          if (v > 0) {
            nonZeroBonuses[k] = v;
          }
        }
        setAllocatedBonuses(nonZeroBonuses);
      }
      hydratedRef.current = true;
    }
  }, [hero, systemAttributes]);

  const { rules, loading: pointBuyLoading } = usePointBuyRules();

  // On refresh with heroId: restore hero from API
  useEffect(() => {
    if (!heroId) {
      setHeroInitialized(true);
      return;
    }

    const id = heroId;
    let cancelled = false;

    async function init() {
      try {
        const data = await heroApi.get(id);
        if (cancelled) return;
        setHero(data);
      } catch {
        // failure → guard will redirect to origins
      } finally {
        if (!cancelled) setHeroInitialized(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [heroId]);

  // Guard: ensure previous steps are completed — only after init
  useEffect(() => {
    if (!heroInitialized) return;
    if (!hero?.ancestry || !hero?.class || !hero?.background) {
      setLocation('/heroes/create/origins');
    }
  }, [heroInitialized, hero, setLocation]);

  // Load system attributes dynamically — controls attrsLoading
  useEffect(() => {
    getSystemAttributes()
      .then((a) => setSystemAttributes(a))
      .catch(() => {
        // fallback: attributes will be empty, grid falls back to static order
      })
      .finally(() => setAttrsLoading(false));
  }, []);

  // Build ancestry/background/class from hero for downstream effects
  const ancestry = hero?.ancestry ?? null;
  const characterClass = hero?.class ?? null;
  const background = useMemo(() => {
    if (!hero?.background) return null;
    return {
      id: hero.background.id,
      slug: hero.background.slug,
      name: hero.background.name,
      description: '',
      bonuses: hero.background.attribute_bonuses,
      eligible_attributes: hero.background.eligible_attributes,
      traits: [],
    };
  }, [hero]);

  // Fetch hero preview to get eligible attributes — controls heroLoading
  useEffect(() => {
    if (!ancestry || !characterClass || !background) return;
    heroApi
      .preview({
        ancestry_id: ancestry.id,
        vocation_id: characterClass.id,
        background_id: background.id,
      })
      .then((result) => {
        const eligible = result.attribute_bonuses?.eligible_attributes ?? [];
        console.log('Preview eligible attributes:', eligible);
        setPreviewEligibleAttributes(eligible);
      })
      .catch(() => {
        setPreviewEligibleAttributes([]);
      })
      .finally(() => setHeroLoading(false));
  }, [ancestry, characterClass, background]);

  // Debounced preview call — 300ms after any attribute change
  useEffect(() => {
    if (!background) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      previewAttributes({ backgroundId: background.id, ...attrs })
        .then((result) => {
          const mods: Record<string, number> = {};
          for (const [slug, data] of Object.entries(result.attributes)) {
            mods[slug] = data.modifier;
          }
          setModifiers(mods);
        })
        .catch(() => {
          // non-critical — modifiers remain from last successful call
        });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [attrs, background]);

  function totalCost(a: Record<string, number>): number {
    return Object.values(a).reduce((sum, v) => sum + (rules.costTable[v] ?? 0), 0);
  }

  const spent = useMemo(() => totalCost(attrs as unknown as Record<string, number>), [attrs, rules.costTable]);
  const remaining = rules.budget - spent;
  const canNext = spent === rules.budget;

  const eligibleAttributes =
    previewEligibleAttributes.length > 0
      ? previewEligibleAttributes
      : (background?.eligible_attributes ?? []);

  const asiPoolTotal = useMemo(() => {
    if (!background) return 0;
    if (asiAllPlus1) return eligibleAttributes.length;
    return (background.bonuses ?? []).reduce((sum, v) => sum + v, 0);
  }, [background, asiAllPlus1, eligibleAttributes.length]);

  const asiMaxPerAttr = asiAllPlus1 ? 1 : 2;

  const attributeBonuses = useMemo<Partial<Record<keyof HeroAttributes, number>>>(() => {
    const bonuses: Partial<Record<keyof HeroAttributes, number>> = {};
    if (asiAllPlus1 && background) {
      for (const attrId of (background.eligible_attributes ?? [])) {
        const slug = systemAttributes.find((a) => a.id === attrId)?.slug;
        if (slug) {
          bonuses[slug as keyof HeroAttributes] = 1;
        }
      }
    } else {
      for (const [k, v] of Object.entries(allocatedBonuses)) {
        bonuses[k as keyof HeroAttributes] = v;
      }
    }
    return bonuses;
  }, [allocatedBonuses, asiAllPlus1, background, systemAttributes]);

  const asiAllocated = useMemo(() => {
    return eligibleAttributes.reduce((sum, attrId) => {
      const slug = systemAttributes.find((a) => a.id === attrId)?.slug;
      if (!slug) return sum;
      return sum + (attributeBonuses[slug as keyof typeof attributeBonuses] ?? 0);
    }, 0);
  }, [eligibleAttributes, attributeBonuses, systemAttributes]);
  const asiPoolRemaining = asiPoolTotal - asiAllocated;

  const bonusDescription = useMemo(() => {
    if (!background) return undefined;
    if (asiAllPlus1) return '+1 / +1 / +1';
    const formatted = (background.bonuses ?? [])
      .map((b) => `+${b}`)
      .join(' / ');
    return formatted || undefined;
  }, [background, asiAllPlus1]);

  function handleSetAttr(key: keyof HeroAttributes, val: number) {
    if (!background) return;
    const currentVal = attrs[key];
    const isIncrement = val > currentVal;

    const attrId = systemAttributes.find((a) => a.slug === key)?.id;
    const isEligible = attrId ? eligibleAttributes.includes(attrId) : false;

    if (isIncrement) {
      if (val > rules.max) return;

      if (isEligible) {
        const currentBonus = allocatedBonuses[key] ?? 0;
        const numAllocatedAttrs = Object.keys(allocatedBonuses).length;
        const maxAllocatedBonus = Object.values(allocatedBonuses).reduce((m, v) => Math.max(m, v), 0);

        let canAllocate = false;
        if (currentBonus < 2 && asiAllocated < 3) {
          if (currentBonus > 0) {
            if (asiAllocated + 1 <= 3) {
              canAllocate = true;
            }
          } else {
            if (numAllocatedAttrs < 2) {
              canAllocate = true;
            } else if (numAllocatedAttrs === 2 && maxAllocatedBonus <= 1) {
              canAllocate = true;
            }
          }
        }

        if (canAllocate) {
          setAllocatedBonuses((prev) => ({
            ...prev,
            [key]: currentBonus + 1,
          }));
          return;
        }
      }

      const diff = (rules.costTable[val] ?? 0) - (rules.costTable[currentVal] ?? 0);
      if (spent + diff > rules.budget) return;
      setAttrs((prev) => ({ ...prev, [key]: val }));
    } else {
      const currentBonus = allocatedBonuses[key] ?? 0;
      if (currentVal === rules.min && currentBonus === 0) return;

      if (currentVal > rules.min) {
        setAttrs((prev) => ({ ...prev, [key]: val }));
      } else {
        if (currentBonus > 0) {
          setAllocatedBonuses((prev) => {
            const next = { ...prev };
            if (currentBonus > 1) {
              next[key] = currentBonus - 1;
            } else {
              delete next[key];
            }
            return next;
          });
        }
      }
    }
  }

  function handleRollAttributes() {
    setAttrs(rollRandomAttributes(rules, systemAttributes.map((a) => a.slug)));
    if (background && eligibleAttributes.length > 0) {
      const eligibleSlugs = systemAttributes
        .filter((a) => eligibleAttributes.includes(a.id))
        .map((a) => a.slug);

      const bonuses = [...(background.bonuses ?? [])].sort((a, b) => b - a);
      const newBonuses: Record<string, number> = {};

      if (eligibleSlugs.length > 0) {
        const shuffled = [...eligibleSlugs].sort(() => Math.random() - 0.5);
        bonuses.forEach((bonusVal, idx) => {
          const targetSlug = shuffled[idx % shuffled.length];
          newBonuses[targetSlug] = (newBonuses[targetSlug] ?? 0) + bonusVal;
        });
      }
      setAllocatedBonuses(newBonuses);
    }
  }

  async function handleNext() {
    if (!canNext) return;
    setSaveError(null);

    if (heroId && systemAttributes.length > 0) {
      try {
        const attributesPayload = systemAttributes.map((sysAttr) => {
          const key = sysAttr.slug as keyof HeroAttributes;
          const purchased = attrs[key] ?? rules.min;
          const bonus = attributeBonuses[key] ?? 0;
          return { attribute_id: sysAttr.id, value: purchased, bonus };
        });
        await saveDraftAttributes(heroId, attributesPayload);
      } catch (err) {
        console.error('Failed to save draft attributes:', err);
      } finally {
        setLocation(`/heroes/create/aesthetics/${heroId}`);
      }
    } else {
      setLocation('/heroes/create/aesthetics');
    }
  }

  function handleBack() {
    const hasChanges = spent > 0 || Object.keys(allocatedBonuses).length > 0;
    if (hasChanges) {
      setShowConfirm(true);
      return;
    }
    setLocation('/heroes/create/origins');
  }

  if (!ancestry || !characterClass || !background) return null;

  return (
    <div className="attr-page-root">
      <div className="attr-page-scroll">
        <CreationStepHeader
          stepLabel="PASSO 02: ATRIBUTOS"
          headline="ESSÊNCIA DO HERÓI"
          progressPct={50}
        />

        <CharacterPreviewSummary
          ancestry={ancestry}
          background={background}
          characterClass={characterClass}
          loading={heroLoading}
        />

        <PointPoolCard
          remaining={remaining}
          budget={rules.budget}
          bonusDescription={bonusDescription}
          loading={pointBuyLoading}
        />

        {/* Collapsible help card */}
        <div className="attr-help-card">
          <button
            type="button"
            className="attr-help-toggle"
            onClick={() => setHelpOpen((o) => !o)}
            aria-expanded={helpOpen}
          >
            <span className="attr-help-toggle-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              COMO FUNCIONA O POINT BUY?
            </span>
            <svg
              className={`attr-help-chevron ${helpOpen ? 'attr-help-chevron--open' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {helpOpen && (
            <div className="attr-help-body">
              <p>Você tem <strong>{rules.budget} pontos</strong> para gastar. Todo atributo começa em {rules.min}.</p>
              <p>Atributos mais altos custam mais pontos: 14 custa 7 pts e 15 custa 9 pts.</p>
              <p>Os bônus de antecedente são aplicados automaticamente e não consomem pontos.</p>
            </div>
          )}
        </div>

        <AttributeGrid
          attrs={attrs}
          remaining={remaining}
          attributeBonuses={attributeBonuses}
          eligibleAttributes={eligibleAttributes}
          asiPoolRemaining={asiPoolRemaining}
          asiMaxPerAttr={asiMaxPerAttr}
          onSetAttr={handleSetAttr}
          rules={rules}
          systemAttributes={systemAttributes}
          modifiers={modifiers}
          loading={attrsLoading}
        />

        <OracleButton
          onPress={handleRollAttributes}
          label="DISTRIBUIR AUTOMATICAMENTE"
          hint="O Oráculo sugere o melhor caminho para sua classe"
        />

        {saveError && (
          <p className="attr-page-save-error">{saveError}</p>
        )}
      </div>

      <CreationFooter
        onBack={handleBack}
        onNext={handleNext}
        canNext={canNext}
      />
      <ConfirmDialog
        visible={showConfirm}
        title="Alterações não salvas"
        message="Você possui alterações não salvas nos atributos. Deseja realmente voltar e perder o progresso atual?"
        confirmLabel="Voltar e Perder"
        cancelLabel="Continuar Editando"
        onConfirm={() => {
          setShowConfirm(false);
          setLocation('/heroes/create/origins');
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
