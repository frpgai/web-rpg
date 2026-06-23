import { useState } from 'react';
import { useLocation } from 'wouter';
import './AttributesPageEx.css';

interface AttributeState {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

const ATTRIBUTE_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export default function AttributesPageEx() {
  const [, setLocation] = useLocation();
  const [pointsPool, setPointsPool] = useState<number>(27);
  const [attrs, setAttrs] = useState<AttributeState>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });

  const bonuses = {
    strength: 2, // +2 Raça (Dragonborn)
    dexterity: 0,
    constitution: 1, // +1 Raça
    intelligence: 0,
    wisdom: 0,
    charisma: 0
  };

  const attrMetadata = [
    { key: 'strength', name: 'Strength', desc: 'Poder físico puro e carga.' },
    { key: 'dexterity', name: 'Dexterity', desc: 'Agilidade, reflexos e equilíbrio.' },
    { key: 'constitution', name: 'Constitution', desc: 'Resistência, vitalidade e saúde.' },
    { key: 'intelligence', name: 'Intelligence', desc: 'Poder mental, lógica e memória.' },
    { key: 'wisdom', name: 'Wisdom', desc: 'Percepção, intuição e sintonização.' },
    { key: 'charisma', name: 'Charisma', desc: 'Influência, charme e liderança.' }
  ] as const;

  const calculateTotalCost = (newAttrs: AttributeState): number => {
    return Object.keys(newAttrs).reduce((total, key) => {
      const val = newAttrs[key as keyof AttributeState];
      return total + ATTRIBUTE_COSTS[val];
    }, 0);
  };

  const handleIncrement = (key: keyof AttributeState) => {
    const currentVal = attrs[key];
    if (currentVal >= 15) return;

    const nextVal = currentVal + 1;
    const currentCost = ATTRIBUTE_COSTS[currentVal];
    const nextCost = ATTRIBUTE_COSTS[nextVal];
    const costDiff = nextCost - currentCost;

    if (pointsPool >= costDiff) {
      setAttrs(prev => ({ ...prev, [key]: nextVal }));
      setPointsPool(prev => prev - costDiff);
    }
  };

  const handleDecrement = (key: keyof AttributeState) => {
    const currentVal = attrs[key];
    if (currentVal <= 8) return;

    const prevVal = currentVal - 1;
    const currentCost = ATTRIBUTE_COSTS[currentVal];
    const prevCost = ATTRIBUTE_COSTS[prevVal];
    const costDiff = currentCost - prevCost;

    setAttrs(prev => ({ ...prev, [key]: prevVal }));
    setPointsPool(prev => prev + costDiff);
  };

  const handleAutoDistribute = () => {
    // Sugestão de distribuição automática para uma classe (ex: Guerreiro/Bárbaro)
    const preset: AttributeState = {
      strength: 15,
      constitution: 14,
      dexterity: 13,
      wisdom: 10,
      intelligence: 9,
      charisma: 8
    };
    setAttrs(preset);
    const cost = calculateTotalCost(preset);
    setPointsPool(27 - cost);
  };

  return (
    <div className="attributes-ex-root">
      {/* Background Cinematográfico */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
      </div>

      {/* Navegação Topo */}
      <header className="attributes-ex-header">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">auto_fix_high</span>
          <span className="font-headline-lg-mobile text-lg font-bold tracking-widest text-primary drop-shadow-[0_0_10px_rgba(215,186,255,0.5)]">
            BARD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-8 font-label-mono text-xs uppercase tracking-widest">
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Origins</span>
            <span className="text-primary font-bold border-b-2 border-primary cursor-pointer">Attributes</span>
            <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Aesthetics</span>
          </div>
          <span className="material-symbols-outlined text-primary cursor-pointer active:scale-95 duration-200">
            account_circle
          </span>
        </div>
      </header>

      {/* Progresso Lateral (Desktop) */}
      <aside className="attributes-ex-aside">
        <div className="space-y-2">
          <p className="font-label-mono text-[10px] uppercase tracking-widest text-tertiary opacity-80">CHRONICLE PROGRESS</p>
          <div className="attributes-ex-progress-track">
            <div className="attributes-ex-progress-bar"></div>
          </div>
        </div>
        <nav className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 text-on-surface-variant opacity-60 font-label-mono text-[12px] uppercase">
            <span className="material-symbols-outlined">history_edu</span>
            <span>Origins</span>
          </div>
          <div className="flex items-center gap-3 text-tertiary font-bold border-l-2 border-tertiary pl-4 font-label-mono text-[12px] uppercase">
            <span className="material-symbols-outlined">casino</span>
            <span>Attributes</span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant opacity-60 font-label-mono text-[12px] uppercase">
            <span className="material-symbols-outlined">brush</span>
            <span>Aesthetics</span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant opacity-60 font-label-mono text-[12px] uppercase">
            <span className="material-symbols-outlined">crossword</span>
            <span>Armory</span>
          </div>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="attributes-ex-main">
        {/* Título */}
        <div className="attributes-ex-title-container">
          <p className="attributes-ex-step">PASSO 02: ATRIBUTOS</p>
          <h1 className="attributes-ex-title">ESSÊNCIA DO HERÓI</h1>
          
          <div className="attributes-ex-progress-wrapper">
            <div className="attributes-ex-progress-info">
              <span>Progresso da Alma</span>
              <span>50%</span>
            </div>
            <div className="attributes-ex-progress-track">
              <div className="attributes-ex-progress-bar"></div>
            </div>
          </div>
        </div>

        {/* Resumo da Criação */}
        <div className="attributes-ex-glass attributes-ex-summary">
          <div className="attributes-ex-summary-item">
            <span className="attributes-ex-summary-label">Ancestralidade</span>
            <span className="attributes-ex-summary-value">Dragonborn</span>
          </div>
          <div className="attributes-ex-divider"></div>
          <div className="attributes-ex-summary-item">
            <span className="attributes-ex-summary-label">Antecedente</span>
            <span className="attributes-ex-summary-value">Acolyte</span>
          </div>
          <div className="attributes-ex-divider"></div>
          <div className="attributes-ex-summary-item">
            <span className="attributes-ex-summary-label">Vocação</span>
            <span className="attributes-ex-summary-value">Barbarian</span>
          </div>
          <div className="attributes-ex-divider"></div>
          <div className="flex flex-wrap gap-2">
            <span className="attributes-ex-badge attributes-ex-badge-tertiary">REPTILIANO</span>
            <span className="attributes-ex-badge attributes-ex-badge-primary">SAGRADO</span>
            <span className="attributes-ex-badge attributes-ex-badge-secondary">FÚRIA</span>
          </div>
        </div>

        {/* Painel de Pontos */}
        <div className="attributes-ex-glass attributes-ex-pool-container">
          <span className="attributes-ex-pool-label">PONTOS DISPONÍVEIS</span>
          <span className="attributes-ex-pool-value">{pointsPool}</span>
          <span className="text-on-surface-variant/40 font-label-mono text-[10px] tracking-widest mt-1">RESTANTES</span>
        </div>

        {/* Grid de Atributos */}
        <div className="attributes-ex-grid">
          {attrMetadata.map(({ key, name, desc }) => {
            const val = attrs[key];
            const bonus = bonuses[key];
            const isBonusActive = bonus > 0;
            return (
              <div key={key} className="attributes-ex-glass attributes-ex-card">
                <div className="attributes-ex-card-header">
                  <div>
                    <h3 className="attributes-ex-card-title">{name}</h3>
                    <p className="attributes-ex-card-desc">{desc}</p>
                  </div>
                  <div className={`attributes-ex-bonus-box ${!isBonusActive ? 'attributes-ex-bonus-box-empty' : ''}`}>
                    {isBonusActive ? `+${bonus}` : '+0'}
                  </div>
                </div>

                <div className="attributes-ex-card-controls">
                  <div className="attributes-ex-card-value-group">
                    <span className="attributes-ex-card-value">{val + bonus}</span>
                    <span className="attributes-ex-card-base">
                      BASE: {val} {isBonusActive && `(+${bonus} RAÇA)`}
                    </span>
                  </div>

                  <div className="attributes-ex-btn-group">
                    <button
                      onClick={() => handleDecrement(key)}
                      disabled={val <= 8}
                      className="attributes-ex-icon-btn"
                      style={{ opacity: val <= 8 ? 0.4 : 1 }}
                    >
                      <span className="material-symbols-outlined text-on-surface-variant">remove</span>
                    </button>
                    <button
                      onClick={() => handleIncrement(key)}
                      disabled={val >= 15 || pointsPool <= 0}
                      className="attributes-ex-icon-btn"
                      style={{ opacity: (val >= 15 || pointsPool <= 0) ? 0.4 : 1 }}
                    >
                      <span className="material-symbols-outlined text-primary">add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Sugestão / Oráculo */}
        <div className="attributes-ex-oracle-section">
          <button onClick={handleAutoDistribute} className="attributes-ex-oracle-btn">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-label-mono text-sm uppercase font-bold tracking-widest">
              Distribuir Automaticamente
            </span>
          </button>
          <p className="text-[10px] font-label-mono text-on-surface-variant/40 uppercase tracking-widest">
            O Oráculo sugere o melhor caminho para sua classe
          </p>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="attributes-ex-footer">
        <button onClick={() => setLocation('/')} className="attributes-ex-footer-btn-back">
          VOLTAR
        </button>
        <button onClick={() => setLocation('/')} className="attributes-ex-footer-btn-next">
          PRÓXIMO
        </button>
      </footer>
    </div>
  );
}
