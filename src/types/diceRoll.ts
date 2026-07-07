export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
export type RollType = 'normal' | 'advantage' | 'disadvantage';
export type RollContext =
  | 'ability_check_str' | 'ability_check_dex' | 'ability_check_con'
  | 'ability_check_int' | 'ability_check_wis' | 'ability_check_cha'
  | 'saving_throw_str' | 'saving_throw_dex' | 'saving_throw_con'
  | 'saving_throw_int' | 'saving_throw_wis' | 'saving_throw_cha'
  | 'attack_roll_melee' | 'attack_roll_ranged'
  | 'damage_roll_melee' | 'damage_roll_ranged';

export interface CreateRollRequestInput {
  context_type: 'npc_dialogue_option' | 'scene_poi' | 'combat_attack' | 'saving_throw';
  context_id: string;
  hero_id: string;
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

export interface InvestigateDirectedRequest {
  character_id: string;
  skill: string;
  dice_roll: number;
}

export interface InvestigateDirectedResponse {
  success: boolean;
  total_result: number;
  dice_roll: number;
  modifier: number;
  dc: number;
  display_name: string;
  description: string;
  narrative_text: string;
}

export interface InvestigateGeneralRequest {
  character_id: string;
  skill: string;
  dice_roll: number;
}

export interface DiscoveredPoiView {
  id: string;
  display_name: string;
  x_coordinate: number;
  y_coordinate: number;
  success_text: string;
}

export interface InvestigateGeneralResponse {
  total_result: number;
  discovered_pois: DiscoveredPoiView[];
}
