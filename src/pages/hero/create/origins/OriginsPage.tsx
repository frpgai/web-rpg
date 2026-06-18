import { useLocation } from 'wouter';
import { useOriginsStep } from '../../../../hooks/useOriginsStep';
import { useHeroCreationStore } from '../../../../stores/heroCreationStore';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { OracleButton } from '../../../../components/hero-creation/OracleButton';
import type { Ancestry, Background, CharacterClass } from '../../../../types';
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
    classes,
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
    setAsiPlus2, setAsiPlus1, setAsiAllPlus1,
  } = useHeroCreationStore();

  function handleOracle() {
    if (ancestries.length === 0 || classes.length === 0 || backgrounds.length === 0) return;
    const randAncestry = ancestries[Math.floor(Math.random() * ancestries.length)];
    const randCharacterClass = classes[Math.floor(Math.random() * classes.length)];
    const randBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setAncestry(randAncestry);
    setCharacterClass(randCharacterClass);
    setBackground(randBackground);
    fetchPreview(randAncestry.id, randCharacterClass.id, randBackground.id);
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

  const canNext = ancestry !== null && characterClass !== null && background !== null;

  function handleSelectAncestry(a: Ancestry) {
    setAncestry(a);
    fetchPreview(a.id, characterClass?.id ?? null, background?.id ?? null);
  }

  function handleSelectCharacterClass(v: CharacterClass) {
    setCharacterClass(v);
    fetchPreview(ancestry?.id ?? null, v.id, background?.id ?? null);
  }

  function handleSelectBackground(bg: Background) {
    setBackground(bg);
    // Reset ASI ao trocar antecedente
    setAsiPlus2(null);
    setAsiPlus1(null);
    setAsiAllPlus1(false);
    fetchPreview(ancestry?.id ?? null, characterClass?.id ?? null, bg.id);
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
        </SectionPanel>

        {/* ── Vocação ──────────────────────────────────────────────────────── */}
        <SectionPanel
          icon="dice-multiple"
          iconColor={TERTIARY}
          title="Vocação"
          loading={loading}
          gridClassName="origins-row-grid"
        >
          {classes.map((v: CharacterClass) => (
            <VocationCard
              key={v.id}
              vocation={v}
              selected={characterClass?.id === v.id}
              onSelect={handleSelectCharacterClass}
            />
          ))}
        </SectionPanel>

        {/* ── Espectro do Destino ──────────────────────────────────────────── */}
        <DestinySpectrum
          ancestry={ancestry}
          background={background}
          characterClass={characterClass}
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
