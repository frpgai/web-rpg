import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { CreationStepHeader } from '../../../../components/hero-creation/CreationStepHeader';
import { CreationFooter } from '../../../../components/hero-creation/CreationFooter';
import { heroApi } from '../../../../api/services/hero';
import { catalogApi } from '../../../../api/services/catalog';
import { getAssetUrl } from '../../../../utils/url';
// import { useHeroCreationStore } from '../../../../stores/heroCreationStore';
import type {
  HeroDetail,
  ClassKit,
  ClassAbility,
  BackgroundSkill,
  VocationSkills,
} from '../../../../types';
import './SummaryPage.css';

const ATTRIBUTE_COLORS: Record<string, string> = {
  str: 'var(--color-secondary)',
  dex: 'var(--color-primary)',
  con: 'var(--color-tertiary)',
  int: 'var(--color-secondary)',
  wis: 'var(--color-text-muted)',
  cha: 'var(--color-primary)',
};

const ABILITY_TYPE_TOOLTIP: Record<string, string> = {
  action: 'O personagem usa sua ação principal no turno para ativar esta habilidade',
  passive: 'Efeito sempre ativo — não precisa ser ativado; funciona automaticamente nas condições descritas',
  bonus_action: 'Usa a ação bônus do turno para ativar esta habilidade',
  reaction: 'Ativada como reação a um gatilho específico',
};

export default function SummaryPage() {
  const { t } = useTranslation(['attributes', 'skills', 'common']);
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const heroId = params?.id ?? null;

  // const store = useHeroCreationStore();
  const store = {} as any; // TODO: fix store typing

  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kits, setKits] = useState<ClassKit[]>([]);
  const [abilities, setAbilities] = useState<ClassAbility[]>([]);
  const [backgroundSkills, setBackgroundSkills] = useState<BackgroundSkill[]>([]);
  const [vocationSkills, setVocationSkills] = useState<VocationSkills | null>(null);

  // Local state for selections (mirroring store)
  const [selectedKitId, setSelectedKitId] = useState<string>(store.kitId);
  const [selectedAbilityIds, setSelectedAbilityIds] = useState<string[]>(store.abilityIds);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  useEffect(() => {
    if (!heroId) {
      setLocation('/app/hero/create/aesthetics');
      return;
    }

    async function fetchAll() {
      try {
        const data = await heroApi.get(heroId!, 'draft');
        setHero(data);

        const vocationId = data.class?.id;
        const backgroundId = data.background?.id;

        const promises: Promise<unknown>[] = [];
        if (vocationId) {
          promises.push(
            catalogApi.vocationStartingKits(vocationId),
            catalogApi.vocationAbilities(vocationId),
            catalogApi.vocationSkills(vocationId),
          );
        }
        if (backgroundId) {
          promises.push(catalogApi.backgroundSkills(backgroundId));
        }

        const results = await Promise.all(promises);

        let resultIdx = 0;
        if (vocationId) {
          const fetchedKits = results[resultIdx++] as ClassKit[];
          const fetchedAbilities = results[resultIdx++] as ClassAbility[];
          const fetchedVocationSkills = results[resultIdx++] as VocationSkills;
          setKits(fetchedKits);
          setAbilities(fetchedAbilities);
          setVocationSkills(fetchedVocationSkills);
        }
        if (backgroundId) {
          const fetchedBgSkills = results[resultIdx++] as BackgroundSkill[];
          setBackgroundSkills(fetchedBgSkills);
          // Pre-set background skill ids in selected (they are locked)
          setSelectedSkillIds(fetchedBgSkills.map((s) => s.id));
        }
      } catch (err) {
        console.error('Failed to load hero for summary:', err);
        setLocation('/app/hero/create/aesthetics');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [heroId, setLocation]);

  const handleKitSelect = useCallback((kit: ClassKit) => {
    if (submitting) return;
    setSelectedKitId(kit.id);
    store.setKit(kit.id, kit.slug);
  }, [submitting, store]);

  const handleAbilityToggle = useCallback((ability: ClassAbility) => {
    if (submitting) return;
    if (selectedAbilityIds.includes(ability.id)) {
      const next = selectedAbilityIds.filter((id) => id !== ability.id);
      setSelectedAbilityIds(next);
    } else {
      if (selectedAbilityIds.length >= 2) return;
      const next = [...selectedAbilityIds, ability.id];
      setSelectedAbilityIds(next);
    }
  }, [submitting, selectedAbilityIds]);

  const handleSkillToggle = useCallback((skill: BackgroundSkill) => {
    if (submitting) return;
    const isBackgroundSkill = backgroundSkills.some((s) => s.id === skill.id);
    if (isBackgroundSkill) return;

    const skillChoices = vocationSkills?.skill_choices ?? 0;
    const classSkillIds = selectedSkillIds.filter(
      (id) => !backgroundSkills.some((bs) => bs.id === id),
    );

    if (selectedSkillIds.includes(skill.id)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skill.id));
    } else {
      if (classSkillIds.length >= skillChoices) return;
      setSelectedSkillIds([...selectedSkillIds, skill.id]);
    }
  }, [submitting, backgroundSkills, selectedSkillIds, vocationSkills]);

  const skillChoices = vocationSkills?.skill_choices ?? 0;
  const classSkillIds = selectedSkillIds.filter(
    (id) => !backgroundSkills.some((bs) => bs.id === id),
  );

  const canSubmit =
    !!selectedKitId &&
    selectedAbilityIds.length === 2 &&
    classSkillIds.length === skillChoices &&
    !submitting;

  const handleBack = () => {
    if (submitting) return;
    setLocation(`/app/hero/create/aesthetics/${heroId}`);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !heroId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await heroApi.completeDraft(heroId, {
        starting_kit_id: selectedKitId,
        vocation_ability_ids: selectedAbilityIds,
        skill_ids: selectedSkillIds,
      });
      store.reset();
      setLocation(`/app/hero/${result.id}`);
    } catch (err: unknown) {
      const httpErr = err as { response?: { status?: number; json?: () => Promise<{ field?: string; message?: string }> } };
      if (httpErr?.response?.status === 422) {
        try {
          const body = await httpErr.response.json?.();
          const msg = body?.message ?? 'Dados inválidos. Verifique suas escolhas.';
          setError(msg);
          const field = body?.field;
          if (field === 'attributes') setLocation(`/app/hero/create/attributes/${heroId}`);
        } catch {
          setError('Dados inválidos. Verifique suas escolhas.');
        }
      } else {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="summary-loading">Carregando revisão final...</div>;
  }

  if (!hero) return null;

  const attributeKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

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
                    CLASSE: {hero.class?.name ?? 'Desconhecida'}
                  </p>
                  {hero.ancestry && (
                    <p className="summary-profile-ancestry-slug">
                      RAÇA: {hero.ancestry.name}
                    </p>
                  )}
                </div>
                <div className="summary-class-badge">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shield
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

              <div className="summary-attributes-grid">
                {attributeKeys.map((key) => {
                  const attrData = hero.attributes?.[key];
                  const val = attrData?.final ?? 10;
                  const modifier = attrData?.modifier ?? Math.floor((val - 10) / 2);
                  const label = t(`${key}.name`, { ns: 'attributes' }) || key.toUpperCase();
                  const color = ATTRIBUTE_COLORS[key] ?? 'var(--color-primary)';
                  const pct = Math.min(100, Math.max(0, (val / 20) * 100));
                  const modSign = modifier >= 0 ? `+${modifier}` : String(modifier);

                  return (
                    <div key={key} className="summary-attr-row">
                      <p className="summary-attr-label">
                        {label} <span className="summary-attr-mod">({modSign})</span>
                      </p>
                      <div className="summary-attr-bar-wrap">
                        <div className="summary-attr-bar-bg">
                          <div
                            className="summary-attr-bar-fill"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="summary-attr-value" style={{ color }}>
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
            {/* Arsenal Section */}
            <section className="summary-section">
              <div className="summary-section-header">
                <div className="summary-section-title-wrap">
                  <span className="material-symbols-outlined summary-section-icon summary-section-icon--primary">crossword</span>
                  <h3 className="summary-section-title">Arsenal Inicial</h3>
                </div>
              </div>

              <div className="summary-kits-grid">
                {kits.map((kit) => {
                  const isSelected = selectedKitId === kit.id;
                  return (
                    <div
                      key={kit.id}
                      className={`summary-kit-card${isSelected ? ' summary-kit-card--selected' : ''}`}
                      onClick={() => handleKitSelect(kit)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleKitSelect(kit)}
                    >
                      <div className="summary-kit-check">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div className="summary-kit-body">
                        <div className={`summary-kit-icon${isSelected ? ' summary-kit-icon--selected' : ''}`}>
                          <span className="material-symbols-outlined">{kit.icon || 'swords'}</span>
                        </div>
                        <div className="summary-kit-text">
                          <h4 className="summary-kit-name">{kit.name}</h4>
                          <p className="summary-kit-desc">{kit.description}</p>
                          {kit.items && kit.items.length > 0 && (
                            <ul className="summary-kit-items">
                              {kit.items.map((item, idx) => (
                                <li key={idx} className="summary-kit-item">
                                  <span className="summary-kit-item-name">
                                    {item.name}
                                    {item.quantity > 1 && <span className="summary-kit-item-qty"> ×{item.quantity}</span>}
                                  </span>
                                  <span className="summary-kit-item-rarity">
                                    {t(`rarity.${item.rarity}`, { ns: 'common' }) || item.rarity}
                                  </span>
                                  {item.equipped && (
                                    <span className="summary-kit-item-equipped">Equipado</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Abilities Section */}
            <section className="summary-section">
              <div className="summary-section-header">
                <div className="summary-section-title-wrap">
                  <span className="material-symbols-outlined summary-section-icon summary-section-icon--tertiary">magic_button</span>
                  <h3 className="summary-section-title">Habilidades Arcanas</h3>
                </div>
                <span className="summary-section-badge">
                  {selectedAbilityIds.length} / 2 habilidades
                </span>
              </div>

              <div className="summary-abilities-grid">
                {abilities.map((ability) => {
                   const isSelected = selectedAbilityIds.includes(ability.id);
                  const typeLabel = t(`ability_type.${ability.type}`, { ns: 'common' }) || ability.type;
                  const typeTooltip = ABILITY_TYPE_TOOLTIP[ability.type] ?? '';

                  return (
                    <div
                      key={ability.id}
                      className={`summary-ability-card${isSelected ? ' summary-ability-card--selected' : ''}`}
                      onClick={() => handleAbilityToggle(ability)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleAbilityToggle(ability)}
                    >
                      <div className="summary-ability-img-box">
                        <div className="summary-ability-img-overlay" />
                        {ability.image_url ? (
                          <img
                            src={getAssetUrl(ability.image_url)}
                            alt={ability.name}
                            className="summary-ability-img"
                          />
                        ) : (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {ability.icon || 'bolt'}
                          </span>
                        )}
                      </div>

                      <div className="summary-ability-meta">
                        <span
                          className={`summary-ability-type-badge summary-ability-type-badge--${ability.type}`}
                          title={typeTooltip}
                        >
                          {typeLabel}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined summary-ability-check">check_circle</span>
                        )}
                      </div>

                      <h5 className="summary-ability-name">{ability.name}</h5>
                      <p className="summary-ability-desc">{ability.description}</p>

                      <div className="summary-ability-stats">
                        <span className="summary-ability-stat">
                          <span className="material-symbols-outlined summary-ability-stat-icon">water_drop</span>
                          {ability.mana_cost > 0 ? `${ability.mana_cost} mana` : 'Sem custo'}
                        </span>
                        {ability.range && (
                          <span className="summary-ability-stat">
                            <span className="material-symbols-outlined summary-ability-stat-icon">radar</span>
                            {t(`ability_range.${ability.range}`, { ns: 'common', defaultValue: ability.range })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Skills Section */}
            <section className="summary-section">
              <div className="summary-section-header">
                <div className="summary-section-title-wrap">
                  <span className="material-symbols-outlined summary-section-icon summary-section-icon--secondary">history_edu</span>
                  <h3 className="summary-section-title">Perícias do Herói</h3>
                </div>
                <span className="summary-section-badge">
                  {classSkillIds.length} / {skillChoices} perícias de classe
                </span>
              </div>

              {/* Background skills — locked */}
              {backgroundSkills.length > 0 && (
                <div className="summary-skills-group">
                  <p className="summary-skills-group-label">Antecedente (fixas)</p>
                  <div className="summary-skills-list">
                    {backgroundSkills.map((skill) => (
                      <div key={skill.id} className="summary-skill-chip summary-skill-chip--locked">
                        <span className="material-symbols-outlined summary-skill-chip-check">check_circle</span>
                        <span className="summary-skill-chip-name">{t(`${skill.slug}.name`, { ns: 'skills' }) || skill.name}</span>
                        <span className="material-symbols-outlined summary-skill-chip-lock">lock</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocation eligible skills */}
              {vocationSkills && vocationSkills.eligible_skills.length > 0 && (
                <div className="summary-skills-group">
                  <p className="summary-skills-group-label">
                    Classe — escolha {skillChoices}
                  </p>
                  <div className="summary-skills-list">
                    {vocationSkills.eligible_skills.map((skill) => {
                      const isLockedByBg = backgroundSkills.some((bs) => bs.id === skill.id);
                      const isSelected = selectedSkillIds.includes(skill.id);

                      if (isLockedByBg) {
                        return (
                          <div key={skill.id} className="summary-skill-chip summary-skill-chip--locked">
                            <span className="material-symbols-outlined summary-skill-chip-check">check_circle</span>
                            <span className="summary-skill-chip-name">{t(`${skill.slug}.name`, { ns: 'skills' }) || skill.name}</span>
                            <span className="material-symbols-outlined summary-skill-chip-lock">lock</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={skill.id}
                          className={`summary-skill-chip${isSelected ? ' summary-skill-chip--selected' : ''}`}
                          onClick={() => handleSkillToggle(skill)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSkillToggle(skill)}
                        >
                          <span className="material-symbols-outlined summary-skill-chip-check">
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span className="summary-skill-chip-name">{t(`${skill.slug}.name`, { ns: 'skills' }) || skill.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {error && (
          <div className="summary-error-toast">
            <span className="material-symbols-outlined">error</span>
            {error}
            {error.includes('conexão') && (
              <button className="summary-error-retry" onClick={handleSubmit} disabled={submitting}>
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>

      <CreationFooter
        onBack={handleBack}
        onNext={handleSubmit}
        canNext={canSubmit}
        nextLabel={submitting ? 'Concluindo...' : 'CONCLUIR CRIAÇÃO'}
        backDisabled={submitting}
      />
    </div>
  );
}
