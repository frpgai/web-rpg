export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
export type RollType = 'normal' | 'advantage' | 'disadvantage';
// RollContext conhecidos como literais + string para os demais
// `poi_<actionSlug>` gerados dinamicamente no backend
// (fmt.Sprintf("poi_%s", actionSlug)) — não há mais enum/CHECK fixo no
// banco, então o tipo é afrouxado para `string` mantendo os literais
// documentados abaixo para autocomplete/legibilidade.
export type RollContext =
  | 'ability_check_str' | 'ability_check_dex' | 'ability_check_con'
  | 'ability_check_int' | 'ability_check_wis' | 'ability_check_cha'
  | 'saving_throw_str' | 'saving_throw_dex' | 'saving_throw_con'
  | 'saving_throw_int' | 'saving_throw_wis' | 'saving_throw_cha'
  | 'attack_roll_melee' | 'attack_roll_ranged'
  | 'damage_roll_melee' | 'damage_roll_ranged'
  | 'poi_investigate' | 'scene_investigate'
  | (string & {});

export interface CreateRollRequestInput {
  context_type:
    | 'npc_dialogue_option'
    | 'scene_poi'
    | 'combat_attack'
    | 'saving_throw';
  context_id: string;
  hero_id: string;
  // Perícia escolhida pelo jogador — obrigatória para
  // `poi_investigation_directed`/`poi_investigation_general` (spec
  // 00153-mesa-jogo/investigacao.md seção 4.1). O backend resolve
  // dc/modificador a partir dela; nada é calculado no cliente.
  skill?: string;
}

export interface DiceRollResult {
  id: string;
  session_id: string;
  character_id: string;
  roll_request_id: string;
  sequence: 1 | 2;          // 1 = attack/check, 2 = damage encadeado
  sequence_total: 1 | 2;    // 2 quando um damage roll seguirá/seguiu
  dice_type: DiceType;
  num_dice: number;         // 1..12
  roll_type: RollType;
  roll_context: RollContext;
  rolls: number[];          // N valores (dano) | 1 valor (d20 normal) | 2 valores (adv/disadv)
  roll_used: number;        // d20: valor efetivo; dano: soma dos dados
  modifier: number;
  modifier_label: string;   // ex: "+5 (FOR)"
  total: number;
  difficulty_label: string | null; // ex: "Fácil"; null para dano/ataque
  success: boolean | null;  // null para damage roll
  natural_roll: number | null; // null para damage roll
  is_critical: boolean;
  is_fumble: boolean;
  seed: string;
  rolled_at: string;        // ISO 8601
}

export interface RollResolvedEvent {
  type: 'roll_resolved';
  payload: DiceRollResult;
}

export interface PoiDiscoveredPayload {
  event: 'session.poi_discovered';
  session_id: string;
  scene_id: string;
  discovered_by_hero: string;
  pois: {
    id: string;
    display_name: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
    description?: string | null;
    success_text?: string | null;
    visible_initially: boolean;
    discovered: boolean;
  }[];
}

// Nota: não há mais tipos de request/response dedicados para investigação
// (`InvestigateDirectedRequest/Response`, `InvestigateGeneralRequest/
// Response`) — os endpoints `/investigate` e `/investigate-general` foram
// removidos (be-rpg commits e123710/f0eafa5). O fluxo de investigação usa
// `CreateRollRequestInput`/`DiceRollResult` acima e `PoiDiscoveredPayload`
// abaixo, iguais aos demais `context_type` (combate, diálogo).
