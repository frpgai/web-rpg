import { useLocation } from 'wouter';
import { useOriginsStep } from '../../../../hooks/useOriginsStep';
import { useHeroCreationStore } from '../../../../stores/heroCreationStore';
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
import { AsiSection } from './AsiSection';
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
    asiPlus2, asiPlus1, asiAllPlus1,
    setAncestry, setCharacterClass, setBackground, reset,
    setAsiPlus2, setAsiPlus1, setAsiAllPlus1,
  } = useHeroCreationStore();

  // characterClass now accepts StoredClass (Vocation | CharacterClass)
  const vocation = characterClass as Vocation | null;

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

  function handleNext() {
    setLocation('/hero/create/attributes');
  }

  function handleBack() {
    const hasProgress = ancestry !== null || characterClass !== null || background !== null;
    if (!hasProgress) {
      setLocation('/dashboard');
      return;
    }
    if (window.confirm('Descartar herói? O progresso da criação será perdido.')) {
      reset();
      setLocation('/dashboard');
    }
  }

  const asiComplete = asiAllPlus1 || (asiPlus2 !== null && asiPlus1 !== null && asiPlus2 !== asiPlus1);
  const canNext = ancestry !== null && vocation !== null && background !== null && asiComplete;

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
    // Reset ASI ao trocar antecedente
    setAsiPlus2(null);
    setAsiPlus1(null);
    setAsiAllPlus1(false);
    fetchPreview(ancestry?.id ?? null, vocation?.id ?? null, bg.id);
  }

  return (
    <div className="origins-page-root">
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
          {/* ASI Sub-seção: aparece após selecionar antecedente */}
          {background && (
            <AsiSection
              background={background}
              asiPlus2={asiPlus2}
              asiPlus1={asiPlus1}
              asiAllPlus1={asiAllPlus1}
              onSetPlus2={setAsiPlus2}
              onSetPlus1={setAsiPlus1}
              onSetAllPlus1={setAsiAllPlus1}
            />
          )}
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
          hint={canNext ? 'Rolar origens aleatórias' : 'Selecione ancestralidade, antecedente, vocação e distribua os atributos'}
        />
      </div>

      <CreationFooter onBack={handleBack} onNext={handleNext} canNext={canNext} />
    </div>
  );
}
