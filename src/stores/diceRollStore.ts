import { create } from 'zustand';
import { diceRollApi } from '../api/services/diceRoll';
import type { CreateRollRequestInput, DiceRollResult } from '../types/diceRoll';

export type RollState =
  | 'idle'
  | 'pending_roll'
  | 'rolling'
  | 'reveal_raw'
  | 'reveal_calculation'
  | 'result'
  | 'rolling_damage';

interface DiceRollStore {
  rollState: RollState;
  currentRoll: DiceRollResult | null;
  attackRoll: DiceRollResult | null;
  pendingDamage: DiceRollResult | null;
  error: string | null;
  rollRequestId: string | null;
  sessionId: string | null;
  rollInput: CreateRollRequestInput | null;
  contextLabel: string;
  difficultyLabel: string | null;
  showFallbackButton: boolean;

  // Actions
  triggerRollRequest: (
    sessionId: string,
    input: CreateRollRequestInput,
    contextLabel: string,
    difficultyLabel?: string | null
  ) => void;
  startRoll: () => Promise<void>;
  handleRollResolved: (roll: DiceRollResult) => void;
  onAnimationComplete: () => void;
  triggerFallbackFetch: () => Promise<void>;
  reset: () => void;
}

let minRollDurationTimeout: any = null;
let fallbackTimeout: any = null;
let autoCloseTimeout: any = null;
let rollingStartTime = 0;

export const useDiceRollStore = create<DiceRollStore>((set, get) => ({
  rollState: 'idle',
  currentRoll: null,
  attackRoll: null,
  pendingDamage: null,
  error: null,
  rollRequestId: null,
  sessionId: null,
  rollInput: null,
  contextLabel: '',
  difficultyLabel: null,
  showFallbackButton: false,

  triggerRollRequest: (sessionId, input, contextLabel, difficultyLabel = null) => {
    // Clear timeouts
    if (minRollDurationTimeout) clearTimeout(minRollDurationTimeout);
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

    set({
      rollState: 'pending_roll',
      currentRoll: null,
      attackRoll: null,
      pendingDamage: null,
      error: null,
      rollRequestId: null,
      sessionId,
      rollInput: input,
      contextLabel,
      difficultyLabel,
      showFallbackButton: false,
    });
  },

  startRoll: async () => {
    const { sessionId, rollInput } = get();
    if (!sessionId || !rollInput) return;

    set({ rollState: 'rolling', error: null, showFallbackButton: false });
    rollingStartTime = Date.now();

    if (sessionId === 'test') {
      set({ rollRequestId: 'test-req' });

      // Timeout simulando o delay do server/WS
      setTimeout(() => {
        const isCombatAttack = rollInput.context_type === 'combat_attack';
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + 3; // Modificador +3
        const r1: DiceRollResult = {
          id: 'test-roll-1',
          session_id: 'test',
          character_id: rollInput.hero_id,
          roll_request_id: 'test-req',
          sequence: 1,
          sequence_total: isCombatAttack && d20 >= 10 ? 2 : 1,
          dice_type: 'd20',
          num_dice: 1,
          roll_type: d20 === 20 ? 'advantage' : 'normal',
          roll_context: rollInput.context_type === 'saving_throw' ? 'saving_throw_wis' : 'ability_check_str',
          rolls: d20 === 20 ? [20, 10] : [d20],
          roll_used: d20,
          modifier: 3,
          modifier_label: '+3 (Força)',
          total: total,
          difficulty_label: get().difficultyLabel || 'Médio',
          success: d20 >= 10,
          natural_roll: d20,
          is_critical: d20 === 20,
          is_fumble: d20 === 1,
          seed: 'fake-seed',
          rolled_at: new Date().toISOString(),
        };

        get().handleRollResolved(r1);

        if (isCombatAttack && d20 >= 10) {
          // Se acertou o ataque, agenda rolagem de dano
          setTimeout(() => {
            const d6_1 = Math.floor(Math.random() * 6) + 1;
            const d6_2 = Math.floor(Math.random() * 6) + 1;
            const damageRolls = d20 === 20 ? [d6_1, d6_2, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1] : [d6_1, d6_2];
            const sum = damageRolls.reduce((a, b) => a + b, 0);
            const r2: DiceRollResult = {
              id: 'test-roll-2',
              session_id: 'test',
              character_id: rollInput.hero_id,
              roll_request_id: 'test-req',
              sequence: 2,
              sequence_total: 2,
              dice_type: 'd6',
              num_dice: damageRolls.length,
              roll_type: 'normal',
              roll_context: 'damage_roll_melee',
              rolls: damageRolls,
              roll_used: sum,
              modifier: 3,
              modifier_label: '+3 (Força)',
              total: sum + 3,
              difficulty_label: null,
              success: null,
              natural_roll: null,
              is_critical: d20 === 20,
              is_fumble: false,
              seed: 'fake-seed',
              rolled_at: new Date().toISOString(),
            };
            get().handleRollResolved(r2);
          }, 3500); // 3.5s depois (após o attack animation terminar e transicionar)
        }
      }, 1000);
      return;
    }

    // Armar timeout de 5 segundos para o fallback HTTP
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    fallbackTimeout = setTimeout(() => {
      if (get().rollState === 'rolling') {
        set({ showFallbackButton: true });
      }
    }, 5000);

    try {
      const res = await diceRollApi.createRollRequest(sessionId, rollInput);
      set({ rollRequestId: res.roll_request_id });
    } catch (err) {
      console.error('Failed to create roll request:', err);
      set({ error: 'Não foi possível iniciar a rolagem de dados.', rollState: 'idle' });
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    }
  },

  handleRollResolved: (roll: DiceRollResult) => {
    const { rollRequestId, rollState } = get();
    // Validar se o evento é para este request
    if (rollRequestId && roll.roll_request_id !== rollRequestId) return;

    if (roll.sequence === 1) {
      set({ currentRoll: roll, attackRoll: roll });

      // Garante uma duração mínima de animação de 1.5s para suspense
      const elapsed = Date.now() - rollingStartTime;
      const delay = Math.max(0, 1500 - elapsed);

      if (minRollDurationTimeout) clearTimeout(minRollDurationTimeout);
      minRollDurationTimeout = setTimeout(() => {
        if (get().rollState === 'rolling') {
          if (fallbackTimeout) clearTimeout(fallbackTimeout);
          set({ rollState: 'reveal_raw' });
        }
      }, delay);
    } else if (roll.sequence === 2) {
      // Se é a rolagem de dano encadeada
      if (rollState === 'rolling_damage' || rollState === 'rolling') {
        set({ currentRoll: roll, rollState: 'reveal_raw' });
      } else {
        // Buffer se a animação do ataque ainda não terminou
        set({ pendingDamage: roll });
      }
    }
  },

  onAnimationComplete: () => {
    const { rollState, currentRoll, pendingDamage } = get();

    if (rollState === 'reveal_raw') {
      set({ rollState: 'reveal_calculation' });
    } else if (rollState === 'reveal_calculation') {
      set({ rollState: 'result' });

      // Se é o resultado final, agenda o auto-fechamento após 3 segundos
      if (!currentRoll || currentRoll.sequence_total === 1 || currentRoll.sequence === 2) {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
        autoCloseTimeout = setTimeout(() => {
          get().reset();
        }, 3000);
      }
    } else if (rollState === 'result') {
      // Se era ataque e tem dano pendente ou esperado
      if (currentRoll && currentRoll.sequence === 1 && currentRoll.sequence_total === 2) {
        set({ rollState: 'rolling_damage' });
        rollingStartTime = Date.now();

        // Se o dano já está no buffer, aplica imediatamente após um leve delay
        if (pendingDamage) {
          setTimeout(() => {
            set({
              currentRoll: pendingDamage,
              pendingDamage: null,
              rollState: 'reveal_raw',
            });
          }, 1000);
        }
      }
    }
  },

  triggerFallbackFetch: async () => {
    const { rollRequestId, sessionId } = get();
    if (!rollRequestId || !sessionId) return;

    try {
      const res = await diceRollApi.listRolls(sessionId, { roll_request_id: rollRequestId });
      const rolls = res.data;
      if (rolls && rolls.length > 0) {
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        set({ showFallbackButton: false });

        // Encontra o roll de sequence 1
        const r1 = rolls.find((r) => r.sequence === 1);
        if (r1) {
          get().handleRollResolved(r1);
        }

        // Se houver sequence 2, guarda no buffer
        const r2 = rolls.find((r) => r.sequence === 2);
        if (r2) {
          set({ pendingDamage: r2 });
        }
      }
    } catch (err) {
      console.error('Fallback fetch failed:', err);
      set({ error: 'Erro ao obter resultado no servidor.' });
    }
  },

  reset: () => {
    if (minRollDurationTimeout) clearTimeout(minRollDurationTimeout);
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

    set({
      rollState: 'idle',
      currentRoll: null,
      pendingDamage: null,
      error: null,
      rollRequestId: null,
      sessionId: null,
      rollInput: null,
      contextLabel: '',
      difficultyLabel: null,
      showFallbackButton: false,
    });
  },
}));
