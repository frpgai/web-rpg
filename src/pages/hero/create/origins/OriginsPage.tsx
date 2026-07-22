import { useLocation } from 'wouter';
import { useState } from 'react';
import { useOriginsData } from './hooks/useOriginsData';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../../components/hero-creation/OracleButton';
import type { Ancestry, Background, Vocation } from '../../../../types';
import { SECONDARY, TERTIARY } from './origins.utils';
import { SectionPanel } from './SectionPanel';
import { AncestryCard } from './AncestryCard';
import { BackgroundCard } from './BackgroundCard';
import { VocationCard } from './VocationCard';
import { DestinySpectrum } from './DestinySpectrum';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import './OriginsPage.css';

// ── Componente interno: linha de erro com retry ───────────────────────────────
function ErrorRow({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="origins-error-row" onClick={onRetry}>
      <span className="origins-error-text">{message}</span>
      <span className="origins-retry-text">Tentar novamente</span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function OriginsPage() {
  const [, setLocation] = useLocation();
  const {
    ancestries,
    vocations,
    backgrounds,
    systemAttributes,
    preview,
    previewLoading,
    previewError,
    fetchPreview,
    draft: draftData,
    draftError,
    discardDraft,
    saveDraft,
  } = useOriginsData();

  const ancestriesLoading = ancestries.length === 0;
  const vocationsLoading = vocations.length === 0;
  const backgroundsLoading = backgrounds.length === 0;

  const [ancestry, setAncestry] = useState<Ancestry | null>(null);
  const [vocation, setVocation] = useState<Vocation | null>(null);
  const [background, setBackground] = useState<Background | null>(null);

  const [dismissedDraft, setDismissedDraft] = useState(false);
  const hasDraft = draftData !== null && !dismissedDraft;

  function handleContinueDraft() {
    if (!draftData) return;
    const foundAncestry = draftData.ancestry_id ? ancestries.find((a) => a.id === draftData.ancestry_id) : undefined;
    const foundVocation = draftData.vocation_id ? vocations.find((v) => v.id === draftData.vocation_id) : undefined;
    const foundBackground = draftData.background_id ? backgrounds.find((bg) => bg.id === draftData.background_id) : undefined;

    if (foundAncestry) setAncestry(foundAncestry);
    if (foundVocation) setVocation(foundVocation);
    if (foundBackground) setBackground(foundBackground);

    if (foundAncestry || foundVocation || foundBackground) {
      fetchPreview(
        foundAncestry?.id ?? null,
        foundVocation?.id ?? null,
        foundBackground?.id ?? null,
      );
    }

    setDismissedDraft(true);
  }

  async function handleDiscardDraft() {
    await discardDraft();
    setAncestry(null);
    setVocation(null);
    setBackground(null);
    setDismissedDraft(true);
  }

  function handleOracle() {
    if (ancestries.length === 0 || vocations.length === 0 || backgrounds.length === 0) return;
    const randAncestry = ancestries[Math.floor(Math.random() * ancestries.length)];
    const randVocation = vocations[Math.floor(Math.random() * vocations.length)];
    const randBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setAncestry(randAncestry);
    setVocation(randVocation);
    setBackground(randBackground);
    fetchPreview(randAncestry.id, randVocation.id, randBackground.id);
  }

  async function handleNext() {
    if (!ancestry || !vocation || !background) return;
    const draft = await saveDraft({
      ancestry_id: ancestry.id,
      vocation_id: vocation.id,
      background_id: background.id,
    });
    setLocation(`/app/hero/create/attributes/${draft.id}`);
  }

  function handleBack() {
    setLocation('/app/dashboard');
  }

  const canNext = ancestry !== null && vocation !== null && background !== null;

  function handleSelectAncestry(a: Ancestry) {
    setAncestry(a);
    fetchPreview(a.id, vocation?.id ?? null, background?.id ?? null);
  }

  function handleSelectVocation(v: Vocation) {
    setVocation(v);
    fetchPreview(ancestry?.id ?? null, v.id, background?.id ?? null);
  }

  function handleSelectBackground(bg: Background) {
    setBackground(bg);
    fetchPreview(ancestry?.id ?? null, vocation?.id ?? null, bg.id);
  }

  return (
    <div className="origins-page-root">
      <ConfirmDialog
        visible={hasDraft}
        title="Criação em andamento"
        message="Você possui uma criação de personagem em andamento. Deseja continuar de onde parou?"
        confirmLabel="Continuar"
        cancelLabel="Começar do zero"
        onConfirm={handleContinueDraft}
        onCancel={handleDiscardDraft}
      />
      <div className="origins-page-scroll">
        <CreationStepHeader
          stepLabel="PASSO 01: ORIGENS"
          headline="FORJAR IDENTIDADE"
          progressPct={25}
        />

        {draftError ? <ErrorRow message={draftError} /> : null}

        {/* ── Ancestralidade ───────────────────────────────────────────────── */}
        <SectionPanel
          icon="notebook"
          iconColor={SECONDARY}
          title="Ancestralidade"
          loading={ancestriesLoading}
          skeletonHeight={110}
          gridClassName="origins-ancestry-grid"
        >
          {ancestries.map((a: Ancestry) => (
            <AncestryCard
              key={a.id}
              ancestry={a}
              selected={ancestry?.id === a.id}
              onSelect={handleSelectAncestry}
            />
          ))}
        </SectionPanel>

        {/* ── Antecedente ──────────────────────────────────────────────────── */}
        <SectionPanel
          icon="shield-star"
          iconColor={SECONDARY}
          title="Antecedente"
          loading={backgroundsLoading}
          gridClassName="origins-row-grid"
        >
          {backgrounds.map((bg: Background) => (
            <BackgroundCard
              key={bg.id}
              background={bg}
              systemAttributes={systemAttributes}
              selected={background?.id === bg.id}
              onSelect={handleSelectBackground}
            />
          ))}
        </SectionPanel>

        {/* ── Vocação ──────────────────────────────────────────────────────── */}
        <SectionPanel
          icon="dice-multiple"
          iconColor={TERTIARY}
          title="Vocação"
          loading={vocationsLoading}
          gridClassName="origins-row-grid"
        >
          {vocations.map((v: Vocation) => (
            <VocationCard
              key={v.id}
              vocation={v}
              selected={vocation?.id === v.id}
              onSelect={handleSelectVocation}
            />
          ))}
        </SectionPanel>

        {/* ── Espectro do Destino ──────────────────────────────────────────── */}
        <DestinySpectrum
          ancestry={ancestry}
          background={background}
          vocation={vocation}
          systemAttributes={systemAttributes}
          preview={preview}
          previewLoading={previewLoading}
          previewError={previewError}
        />

        {/* ── Oráculo ──────────────────────────────────────────────────────── */}
        <OracleButton
          onPress={handleOracle}
          disabled={ancestriesLoading || vocationsLoading || backgroundsLoading}
          hint={canNext ? 'Rolar origens aleatórias' : 'Selecione ancestralidade, antecedente e vocação'}
        />
      </div>

      <CreationFooter onBack={handleBack} onNext={handleNext} canNext={canNext} />
    </div>
  );
}
