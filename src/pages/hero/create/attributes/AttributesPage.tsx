import { useLocation, useParams } from 'wouter';
import { toast } from 'react-toastify';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../../components/hero-creation/OracleButton';
import { AttributeGrid } from './_AttributeGrid';
import { PointPoolCard } from './_PointPoolCard';
import { CharacterPreviewSummary } from './_CharacterPreviewSummary';
import { AttributeHelpCard } from './_AttributeHelpCard';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useAttributesData } from './hooks/useAttributesData';
import { useAttributeAllocation } from './hooks/useAttributeAllocation';
import { useAttributeOracle } from './hooks/useAttributeOracle';
import './AttributesPage.css';

export default function AttributesPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  const {
    hero,
    rules,
    systemAttributes,
    ancestryDetails,
    vocationDetails,
    backgroundDetails,
    saveDraft,
  } = useAttributesData(heroId);

  const allocation = useAttributeAllocation({ rules, systemAttributes, backgroundDetails });
  const oracle = useAttributeOracle({
    rules,
    systemAttributes,
    backgroundDetails,
    eligibleAttributes: allocation.eligibleAttributes,
    setAttrs: allocation.setAttrs,
    setAllocatedBonuses: allocation.setAllocatedBonuses,
  });

  if (!hero || !rules || !allocation.attrs) return null;

  async function handleNext() {
    if (!allocation.canNext || !allocation.attrs || !rules) return;

    if (heroId && systemAttributes.length > 0) {
      try {
        const attributesPayload = systemAttributes.map((sysAttr) => {
          const key = sysAttr.slug;
          const purchased = allocation.attrs![key] ?? rules.min;
          const bonus = allocation.attributeBonuses[key] ?? 0;
          return { attribute_id: sysAttr.id, value: purchased, bonus };
        });
        await saveDraft(heroId, attributesPayload);
        setLocation(`/app/hero/create/aesthetics/${heroId}`);
      } catch (err) {
        console.error('AttributesPage: failed to save draft attributes', err);
        toast.error('Não foi possível salvar os atributos. Tente novamente.');
      }
    } else {
      setLocation('/app/hero/create/aesthetics');
    }
  }

  return (
    <div className="attr-page-root">
      <div className="attr-page-scroll">
        <CreationStepHeader
          stepLabel="PASSO 02: ATRIBUTOS"
          headline="ESSÊNCIA DO HERÓI"
          progressPct={50}
        />

        <CharacterPreviewSummary
          ancestry={ancestryDetails as any}
          background={backgroundDetails as any}
          characterClass={vocationDetails as any}
        />

        <PointPoolCard
          remaining={allocation.remaining}
          bonusDescription={allocation.bonusDescription}
          loading={!rules}
        />

        <AttributeHelpCard rules={rules} />

        <AttributeGrid
          attrs={allocation.attrs}
          remaining={allocation.remaining}
          attributeBonuses={allocation.attributeBonuses}
          eligibleAttributes={allocation.eligibleAttributes}
          asiPoolRemaining={allocation.asiPoolRemaining}
          asiMaxPerAttr={allocation.asiMaxPerAttr}
          onSetAttr={allocation.handleSetAttr}
          rules={rules}
          systemAttributes={systemAttributes}
          loading={systemAttributes.length === 0}
        />

        <OracleButton
          onPress={oracle.rollAttributes}
          label="DISTRIBUIR AUTOMATICAMENTE"
          hint="O Oráculo sugere o melhor caminho para sua classe"
        />

      </div>

      <CreationFooter
        onBack={allocation.handleBack}
        onNext={handleNext}
        canNext={allocation.canNext}
      />
      <ConfirmDialog
        visible={allocation.showConfirm}
        title="Alterações não salvas"
        message="Você possui alterações não salvas nos atributos. Deseja realmente voltar e perder o progresso atual?"
        confirmLabel="Voltar e Perder"
        cancelLabel="Continuar Editando"
        onConfirm={allocation.handleConfirmBack}
        onCancel={() => allocation.setShowConfirm(false)}
      />
    </div>
  );
}
