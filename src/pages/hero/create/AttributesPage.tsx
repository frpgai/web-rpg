import { useLocation } from 'wouter';
import { useEffect, useMemo } from 'react';
import { CreationStepHeader } from '../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../components/hero-creation/OracleButton';
import { useHeroCreationStore } from '../../../stores/heroCreationStore';
import { POINT_BUY_BUDGET, POINT_BUY_COST, totalCost } from '../../../constants/rules';
import { AttributeGrid } from './_AttributeGrid';
import { PointPoolCard } from './_PointPoolCard';
import { CharacterPreviewSummary } from './_CharacterPreviewSummary';
import type { HeroAttributes } from '../../types';
import './AttributesPage.css';

export default function AttributesPage() {
  const [, setLocation] = useLocation();
  const {
    ancestry,
    characterClass,
    background,
    baseAttributes: attrs,
    setAttribute,
    rollAttributes,
  } = useHeroCreationStore();

  // Guard: ensure previous steps are completed
  useEffect(() => {
    if (!ancestry || !characterClass || !background) {
      setLocation('/hero/create/origins');
    }
  }, [ancestry, characterClass, background, setLocation]);

  const spent = useMemo(() => totalCost(attrs), [attrs]);
  const remaining = POINT_BUY_BUDGET - spent;
  const canNext = spent === POINT_BUY_BUDGET;

  function handleSetAttr(key: keyof HeroAttributes, val: number) {
    if (val < 8 || val > 15) return;
    const currentVal = attrs[key];
    const diff = POINT_BUY_COST[val] - POINT_BUY_COST[currentVal];
    if (spent + diff > POINT_BUY_BUDGET) return;
    setAttribute(key, val);
  }

  if (!ancestry || !characterClass || !background) return null;

  return (
    <div className="attributes-page-root">
      <div className="attributes-page-scroll">
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

        <PointPoolCard remaining={remaining} />

        <AttributeGrid
          attrs={attrs}
          remaining={remaining}
          attributeBonuses={
            Object.fromEntries(
              Object.entries(background.attribute_bonuses ?? {})
                .filter(([k, v]) => k !== 'eligible' && typeof v === 'number')
                .map(([k, v]) => [k, v as number])
            )
          }
          onSetAttr={handleSetAttr}
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
