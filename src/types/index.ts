export interface DraftHero {
  id: string;
  draft_step: string;
  ancestry_id: string | null;
  vocation_id: string | null;
  background_id: string | null;
}

export interface SaveDraftRequest {
  draft_step: string;
  ancestry_id?: string | null;
  vocation_id?: string | null;
  background_id?: string | null;
}

export interface SaveDraftResponse {
  id: string;
  draft_step: string;
}

export type AvailableCampaign = {
  id: string;
  name: string;
  cover_url: string | null;
  level_range: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type CampaignListItem = {
  id: string;
  title: string;
  cover_image_url: string | null;
  level_start: number;
  level_end: number;
  tags: Tag[];
  min_players?: number;
  max_players?: number;
};

export type CampaignListResponse = {
  items: CampaignListItem[];
  next_cursor: string | null;
};

export type CampaignAdventureSummary = {
  id: string;
  title: string;
  position: number;
};

export type CampaignDetail = CampaignListItem & {
  description: string | null;
  adventures: CampaignAdventureSummary[];
  start_cta_label?: string;
  start_cta_subtext?: string | null;
  // URL assinada do Cloudflare R2, totalmente qualificada, válida por 1 hora.
  // Omitida/null quando a campanha não tem áudio de introdução. Como expira,
  // o consumidor deve tratar falha de carregamento fazendo refetch da campanha
  // (ver TimelinePage/useTimeline) para obter uma nova URL assinada.
  intro_narration_audio_url?: string | null;
};

export type CampaignListParams = {
  q?: string;
  level_start?: number;
  level_end?: number;
  tag?: string[];
  cursor?: string;
  limit?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export interface Trait {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Ancestry {
  id: string;
  system_id?: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  speed?: number;
  hp_bonus_per_level?: number;
  enabled?: boolean;
  eligible_attributes?: string[];
  traits: Trait[];
}


export interface AncestryDetails extends Omit<Ancestry, 'traits'> {
  traits: Trait[];
}

export interface Background {
  id: string;
  system_id?: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  bonuses: number[];
  eligible_attributes: string[];
  traits: string[];
  enabled?: boolean;
}

export interface BackgroundDetails extends Omit<Background, 'traits'> {
  traits: Trait[];
}

export interface AsiChoice {
  plus2: string | null;
  plus1: string | null;
  allPlus1: boolean;
}

export interface StartingItem {
  item_id: string;
  slug: string;
  name: string;
  type: string;
  quantity: number;
  equipped: boolean;
}

export interface Vocation {
  id: string;
  system_id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  key_attribute: string;
  hit_die: number;
  is_spellcaster: boolean;
  spell_slots_by_level: Record<string, number> | null;
  enabled: boolean;
}

export interface VocationDetails extends Vocation {
  starting_items: StartingItem[];
  traits: Trait[];
}

export interface ClassKitItem {
  name: string;
  rarity: string;
  weight_kg: number;
  quantity: number;
  equipped: boolean;
}

export interface ClassKit {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  items: ClassKitItem[];
}

export interface BackgroundSkill {
  id: string;
  slug: string;
  name: string;
}

export interface VocationSkills {
  skill_choices: number;
  eligible_skills: BackgroundSkill[];
}

export interface CompleteHeroPayload {
  starting_kit_id: string;
  vocation_ability_ids: string[];
  skill_ids: string[];
}

export interface ClassAbility {
  id: string;
  slug: string;
  name: string;
  type: 'action' | 'bonus_action' | 'reaction' | 'passive';
  description: string;
  icon: string;
  mana_cost: number;
  range: string;
  image_url?: string;
}

export interface HeroAbility {
  id: string;
  slug: string;
  name: string;
  type: 'action' | 'bonus_action' | 'reaction' | 'passive';
  type_label: string;
  description: string;
  mana_cost: number;
  range: string;
  image_url: string;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  rarity_label: string;
  weight_kg: number;
  quantity: number;
  equipped: boolean;
}

export interface CharacterClass {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  key_attribute: string;
  base_hp: number;
  base_mp: number;
  base_def: number;
  starting_kits: ClassKit[];
  abilities: ClassAbility[];
}

/** @deprecated Use Vocation instead */
export type LegacyCharacterClass = CharacterClass;

export interface AvatarPreset {
  id: string;
  url: string;
  label: string;
  recommended: boolean;
}

export interface HeroAttributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface HeroStats {
  hp: number;
  hp_max: number;
  mp: number;
  mp_max: number;
  def: number;
}

export interface HeroSheet {
  attributes: HeroAttributes;
  base_attributes?: HeroAttributes;
  bonuses?: Record<string, number>;
  stats: HeroStats;
  traits: string[];
  abilities: ClassAbility[];
  inventory: { name: string; rarity: string; weight_kg: number }[];
}

export interface HeroDetail {
  id: string;
  name: string;
  ancestry: { id: string; slug: string; name: string } | null;
  class: { id: string; slug: string; name: string } | null;
  background: { id: string; slug: string; name: string } | null;
  level: number;
  xp: number;
  xp_next_level: number;
  avatar_url: string | null;
  backstory: string | null;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  def: number;
  proficiency_bonus: number;
  attributes: Record<string, {
    base: number;
    bonus: number;
    final: number;
    modifier: number;
    abbreviation: string;
    name: string;
  }>;
  traits: string[];
  skills: Array<{
    slug: string;
    name: string;
    base_ability: string;
    proficient: boolean;
  }>;
  abilities: HeroAbility[];
  inventory: InventoryItem[];
  active_session: { id: string; name: string } | null;
}

export interface PreviewTrait {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface PreviewAttributeBonuses {
  bonuses: number[];
  eligible_attributes: string[];
}

export interface PreviewResult {
  base_hp: number | null;
  base_def: number | null;
  is_spellcaster?: boolean | null;
  key_attribute: string | null;
  spell_slots?: Record<string, number> | null;
  attribute_bonuses: PreviewAttributeBonuses | null;
  traits: PreviewTrait[];
}

export interface CreateHeroRequest {
  name: string;
  ancestry_id: string;
  characterClass_id: string;
  attributes: HeroAttributes;
  avatar_url: string;
  backstory?: string;
  kit_slug: string;
  ability_slugs: [string, string];
}

export type Hero = {
  id: string;
  name: string;
  class: string;
  level: number;
  avatar_url: string | null;
  pending_turn: boolean;
  hp_current: number;
  hp_max: number;
  xp: number;
  xp_next_level: number;
};

export type PendingTurnNext = {
  turn_id: string;
  campaign_id: string;
  campaign_name: string;
  hero_name: string;
  hero_avatar_url: string | null;
  created_at: string;
};

export type PendingTurn = {
  total: number;
  next: PendingTurnNext | null;
};

export type CreateSessionRequest = {
  campaign_id: string;
  name: string;
  is_private: boolean;
  hero_id: string;
  min_players: number;
  max_players: number;
};

export type Session = {
  id: string;
  campaign_id: string;
  name: string;
  is_private: boolean;
};

export type SessionPlayerHero = {
  id: string;
  name: string;
  class: string;
  level: number;
  avatar_url: string | null;
};

export type SessionPlayer = {
  user_id: string;
  username: string;
  is_owner: boolean;
  hero: SessionPlayerHero | null;
  is_ready: boolean;
};

export type SessionStatus = 'lobby' | 'active' | 'finished';

export type SessionDetail = {
  id: string;
  campaign_id: string;
  name: string;
  invite_code: string;
  status: SessionStatus;
  owner_id: string;
  min_players: number;
  max_players: number;
  current_adventure_id?: string | null;
  current_scene_id?: string | null;
  current_turn_player_id?: string | null;
};

export type StartSessionResponse = {
  id: string;
  status: SessionStatus;
  started_at: string;
  current_adventure_id?: string | null;
  current_scene_id?: string | null;
  current_turn_player_id?: string | null;
};

export type SessionEvent = {
  seq: number;
  session_id: string;
  scene_id: string;
  session_player_id?: string | null;
  type: string;
  payload: unknown;
  created_at: string;
};

export type SessionEventsPage = {
  items: SessionEvent[];
  next_cursor: string | null;
};

// ── Mesa de Jogo (Storytelling, Mapa, Diálogos de NPC) — spec A00153 ────────

export type Adventure = {
  id: string;
  title: string;
  media_url?: string | null;
  media_type?: 'video' | 'image' | null;
  audio_transition_file?: string | null;
  transition_sfx?: string | null;
  intro_narration?: string | null;
  intro_narration_audio_file?: string | null;
  narration_style?: string | null;
  ambient_soundtrack_file?: string | null;
  ambient_soundtrack?: string | null;
};

export type SceneNPC = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

export type ScenePointOfInterest = {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  sort_order: number;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
  skill_check?: string | null;
  dc?: number | null;
  success_text?: string | null;
  failure_text?: string | null;
};

// Payload de POST /api/v1/scenes/{scene_id}/pois/{poi_id}/investigate
// (be-rpg branch feature/poi-investigation, PR #68, commit 4c7baa0 — ainda
// não mergeada em main; contrato confirmado lendo internal/scene/model.go e
// service.go nessa branch). O frontend envia apenas o d20 puro (`roll`,
// 1-20) e o `hero_id` ativo — o backend resolve modificador de atributo +
// bônus de proficiência da perícia do POI e soma ao roll, retornando o
// `total` já calculado. Nenhum cálculo de stats acontece no cliente.
export type InvestigatePoiRequest = {
  session_id: string;
  hero_id: string;
  roll: number;
};

export type InvestigatePoiResponse = {
  poi_id: string;
  success: boolean;
  enabled: boolean;
  total: number;
  success_text?: string | null;
  failure_text?: string | null;
};

export type SceneDetail = {
  id: string;
  map_prompt?: string | null;
  map_image_url?: string | null;
  intro_narration?: string | null;
  audio_transition_file?: string | null;
  transition_sfx?: string | null;
  intro_narration_audio_file?: string | null;
  narration_style?: string | null;
  ambient_soundtrack_file?: string | null;
  ambient_soundtrack?: string | null;
  npcs: SceneNPC[];
  points_of_interest: ScenePointOfInterest[];
};

export type DialogueOptionView = {
  id: string;
  label: string;
  next_node_id?: string | null;
  requires_skill_check: boolean;
  skill?: string | null;
  dc?: number | null;
  success_node_id?: string | null;
  failure_node_id?: string | null;
  sort_order: number;
  conditions: unknown[];
};

export type DialogueNodeView = {
  id: string;
  node_key: string;
  text: string;
  audio_url?: string | null;
  video_url?: string | null;
  is_root: boolean;
  options: DialogueOptionView[];
};

export type NPCDialogueTree = {
  npc_id: string;
  root_node_id?: string | null;
  nodes: DialogueNodeView[];
};

export type CreateEventType = 'adventure_started' | 'npc_dialogue_choice' | 'dice_roll';

export type CreateEventRequest = {
  type: CreateEventType;
  payload: Record<string, unknown>;
};

export type SessionSocketEventType =
  | 'session_joined'
  | 'session_left'
  | 'player_ready_changed'
  | 'session_started';

export type SessionSocketEvent = {
  type: SessionSocketEventType;
  payload?: unknown;
};

export interface System {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SystemRules {
  id: string;
  system_id: string;
  point_buy_budget: number;
  min_attribute_score: number;
  max_attribute_buy_score: number;
  point_buy_costs: Record<string, number>;
  carry_capacity_multiplier: number;
  carry_capacity_base: number;
  created_at: string;
  updated_at: string;
}

export interface SystemAttribute {
  id: string;
  system_id: string;
  slug: string;
  name: string;
  abbreviation: string;
  description: string;
  created_at: string;
  updated_at: string;
}

