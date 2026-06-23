import { useLocation } from 'wouter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CreationStepHeader } from '../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../components/hero-creation/OracleButton';
import { useHeroCreationStore } from '../../../stores/heroCreationStore';
import { useSystemStore } from '../../../stores/systemStore';
import { usePointBuyRules } from '../../../hooks/usePointBuyRules';
import { getSystemAttributes, previewAttributes } from '../../../api/services/attributes';
import type { SystemAttribute } from '../../../api/services/attributes';
import { AttributeGrid } from './_AttributeGrid';
import { PointPoolCard } from './_PointPoolCard';
import { CharacterPreviewSummary } from './_CharacterPreviewSummary';
import type { HeroAttributes } from '../../../types';
import './AttributesPage.css';

export default function AttributesPage() {
  const [, setLocation] = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [systemAttributes, setSystemAttributes] = useState<SystemAttribute[]>([]);
  const [modifiers, setModifiers] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSystem = useSystemStore((s) => s.currentSystem);
  const systemId = currentSystem?.id ?? '';

  const { rules } = usePointBuyRules(systemId);

  const {
    ancestry,
    characterClass,
    background,
    baseAttributes: attrs,
    asiPlus2,
    asiPlus1,
    asiAllPlus1,
    setAttribute,
    rollAttributes,
  } = useHeroCreationStore();

  // Guard: ensure previous steps are completed
  useEffect(() => {
    if (!ancestry || !characterClass || !background) {
      setLocation('/hero/create/origins');
    }
  }, [ancestry, characterClass, background, setLocation]);

  // Load system attributes dynamically
  useEffect(() => {
    if (!systemId) return;
    getSystemAttributes(systemId)
      .then((attrs) => setSystemAttributes(attrs))
      .catch(() => {
        // fallback: attributes will be empty, grid falls back to static order
      });
  }, [systemId]);

  // Debounced preview call — 300ms after any attribute change
  useEffect(() => {
    if (!background) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      previewAttributes({
        backgroundId: background.id,
        str: attrs.str,
        dex: attrs.dex,
        con: attrs.con,
        int: attrs.int,
        wis: attrs.wis,
        cha: attrs.cha,
      })
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

  const eligibleAttributes = background?.eligible_attributes ?? [];
  // Total ASI pool: +1/+1/+1 mode = 3, +2/+1 mode = 3 (2+1), +2 only = 2, +1 only = 1
  const asiPoolTotal = useMemo(() => {
    if (!background) return 0;
    if (asiAllPlus1) return eligibleAttributes.length; // one +1 per eligible attr
    return (asiPlus2 ? 2 : 0) + (asiPlus1 ? 1 : 0);
  }, [background, asiAllPlus1, asiPlus2, asiPlus1, eligibleAttributes.length]);

  // Max bonus a single eligible attribute can receive
  const asiMaxPerAttr = asiAllPlus1 ? 1 : 2;

  const attributeBonuses = useMemo<Partial<Record<keyof HeroAttributes, number>>>(() => {
    const bonuses: Partial<Record<keyof HeroAttributes, number>> = {};
    if (asiAllPlus1 && background) {
      for (const attr of (background.eligible_attributes ?? [])) {
        bonuses[attr as keyof HeroAttributes] = 1;
      }
    } else {
      if (asiPlus2) bonuses[asiPlus2 as keyof HeroAttributes] = 2;
      if (asiPlus1) bonuses[asiPlus1 as keyof HeroAttributes] = 1;
    }
    return bonuses;
  }, [asiPlus2, asiPlus1, asiAllPlus1, background]);

  // Remaining = total pool minus sum of allocated bonuses on eligible attrs
  const asiAllocated = useMemo(() => {
    return eligibleAttributes.reduce((sum, attr) => {
      return sum + (attributeBonuses[attr as keyof typeof attributeBonuses] ?? 0);
    }, 0);
  }, [eligibleAttributes, attributeBonuses]);
  const asiPoolRemaining = asiPoolTotal - asiAllocated;

  // Describe bonus for display
  const bonusDescription = useMemo(() => {
    if (asiAllPlus1) return '+1 / +1 / +1';
    const hasPlus2 = !!asiPlus2;
    const hasPlus1 = !!asiPlus1;
    if (hasPlus2 && hasPlus1) return '+2 / +1';
    if (hasPlus2) return '+2';
    if (hasPlus1) return '+1';
    return undefined;
  }, [asiPlus2, asiPlus1, asiAllPlus1]);

  function handleSetAttr(key: keyof HeroAttributes, val: number) {
    if (val < rules.min || val > rules.max) return;
    const currentVal = attrs[key];
    const diff = (rules.costTable[val] ?? 0) - (rules.costTable[currentVal] ?? 0);
    if (spent + diff > rules.budget) return;
    setAttribute(key, val);
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
        />

        <PointPoolCard
          remaining={remaining}
          budget={rules.budget}
          bonusDescription={bonusDescription}
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
              <p>Você tem <strong>27 pontos</strong> para gastar. Todo atributo começa em 8.</p>
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
        />

        <OracleButton
          onPress={rollAttributes}
          label="DISTRIBUIR AUTOMATICAMENTE"
          hint="O Oráculo sugere o melhor caminho para sua classe"
        />
      </div>

      <CreationFooter
        onBack={() => setLocation('/hero/create/origins')}
        onNext={() => setLocation('/hero/create/aesthetics')}
        canNext={canNext}
      />
    </div>
  );
}
