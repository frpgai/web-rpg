import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { useOriginsStep } from '../../../../hooks/useOriginsStep';
import { useHeroCreationStore } from '../../../../stores/heroCreationStore';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../../components/hero-creation/OracleButton';
import type { Ancestry, Background, Vocation, DraftHero } from '../../../../types';
import { heroApi } from '../../../../api/services/hero';
import { SECONDARY, TERTIARY } from './origins.utils';
import { SectionPanel } from './SectionPanel';
import { AncestryCard } from './AncestryCard';
import { BackgroundCard } from './BackgroundCard';
import { VocationCard } from './VocationCard';
import { DestinySpectrum } from './DestinySpectrum';
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
    preview,
    catalogLoading: loading,
    previewLoading,
    previewError,
    catalogError: error,
    reloadCatalog: reload,
    fetchPreview,
  } = useOriginsStep();

  const {
    ancestry, characterClass, background,
    setAncestry, setCharacterClass, setBackground, reset,
  } = useHeroCreationStore();

  // characterClass now accepts StoredClass (Vocation | CharacterClass)
  const vocation = characterClass as Vocation | null;

  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<DraftHero | null>(null);

  // Load draft on mount
  useEffect(() => {
    heroApi.getDraft().then((draft) => {
      if (draft) {
        setDraftData(draft);
        setHasDraft(true);
      }
    }).catch(() => {
      // silently ignore draft load errors
    });
  }, []);

  function handleContinueDraft() {
    if (!draftData) return;
    const foundAncestry = draftData.ancestry_id ? ancestries.find((a) => a.id === draftData.ancestry_id) : undefined;
    const foundVocation = draftData.vocation_id ? vocations.find((v) => v.id === draftData.vocation_id) : undefined;
    const foundBackground = draftData.background_id ? backgrounds.find((bg) => bg.id === draftData.background_id) : undefined;

    if (foundAncestry) setAncestry(foundAncestry);
    if (foundVocation) setCharacterClass(foundVocation);
    if (foundBackground) setBackground(foundBackground);

    if (foundAncestry || foundVocation || foundBackground) {
      fetchPreview(
        foundAncestry?.id ?? null,
        foundVocation?.id ?? null,
        foundBackground?.id ?? null,
      );
    }

    setHasDraft(false);
    setDraftData(null);
  }

  async function handleDiscardDraft() {
    try {
      await heroApi.deleteDraft();
    } catch {
      // non-blocking
    }
    reset();
    setHasDraft(false);
    setDraftData(null);
  }

  function handleOracle() {
    if (ancestries.length === 0 || vocations.length === 0 || backgrounds.length === 0) return;
    const randAncestry = ancestries[Math.floor(Math.random() * ancestries.length)];
    const randVocation = vocations[Math.floor(Math.random() * vocations.length)];
    const randBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setAncestry(randAncestry);
    setCharacterClass(randVocation);
    setBackground(randBackground);
    fetchPreview(randAncestry.id, randVocation.id, randBackground.id);
  }

  async function handleNext() {
    if (!ancestry || !vocation || !background) return;
    try {
      await heroApi.saveDraft({
        draft_step: 'origins',
        ancestry_id: ancestry.id,
        vocation_id: vocation.id,
        background_id: background.id,
      });
    } catch {
      console.error('Failed to save draft');
    }
    setLocation('/hero/create/attributes');
  }

  function handleBack() {
    setLocation('/dashboard');
  }

  const canNext = ancestry !== null && vocation !== null && background !== null;

  function handleSelectAncestry(a: Ancestry) {
    setAncestry(a);
    fetchPreview(a.id, vocation?.id ?? null, background?.id ?? null);
  }

  function handleSelectVocation(v: Vocation) {
    setCharacterClass(v);
    fetchPreview(ancestry?.id ?? null, v.id, background?.id ?? null);
  }

  function handleSelectBackground(bg: Background) {
    setBackground(bg);
    fetchPreview(ancestry?.id ?? null, vocation?.id ?? null, bg.id);
  }

  return (
    <div className="origins-page-root">
      {hasDraft && (
        <div className="origins-draft-overlay">
          <div className="origins-draft-modal">
            <h2 className="origins-draft-title">Criação em andamento</h2>
            <p className="origins-draft-body">
              Você possui uma criação de personagem em andamento. Deseja continuar de onde parou?
            </p>
            <div className="origins-draft-actions">
              <button className="origins-draft-btn-primary" onClick={handleContinueDraft}>
                Continuar
              </button>
              <button className="origins-draft-btn-secondary" onClick={handleDiscardDraft}>
                Começar do zero
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="origins-page-scroll">
        <CreationStepHeader
          stepLabel="PASSO 01: ORIGENS"
          headline="FORJAR IDENTIDADE"
          progressPct={25}
        />

        {/* ── Ancestralidade ───────────────────────────────────────────────── */}
        <SectionPanel
          icon="notebook"
          iconColor={SECONDARY}
          title="Ancestralidade"
          loading={loading}
          errorSlot={error ? <ErrorRow message={error} onRetry={reload} /> : null}
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
          loading={loading}
          errorSlot={error ? <ErrorRow message={error} onRetry={reload} /> : null}
          gridClassName="origins-row-grid"
        >
          {backgrounds.map((bg: Background) => (
            <BackgroundCard
              key={bg.id}
              background={bg}
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
          loading={loading}
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
          preview={preview}
          previewLoading={previewLoading}
          previewError={previewError}
        />

        {/* ── Oráculo ──────────────────────────────────────────────────────── */}
        <OracleButton
          onPress={handleOracle}
          disabled={loading}
          hint={canNext ? 'Rolar origens aleatórias' : 'Selecione ancestralidade, antecedente e vocação'}
        />
      </div>

      <CreationFooter onBack={handleBack} onNext={handleNext} canNext={canNext} />
    </div>
  );
}
