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
  phase: 'campaign' | 'adventure' | 'scene';
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
  id: string;
  session_id: string;
  scene_id: string;
  type: string;
  // Colunas tipadas (be-rpg PR #69) — substituem o antigo `payload` JSONB
  // para os 4 tipos de evento client-submissíveis. Cada tipo só preenche o
  // subconjunto relevante; o resto vem undefined/null.
  entity_type?: 'campaign' | 'adventure' | 'scene' | null; // narrative_entered
  entity_id?: string | null; // narrative_entered
  hero_id?: string | null; // dice_roll / poi_investigation
  skill_check?: string | null; // dice_roll / poi_investigation
  roll?: number | null; // dice_roll / poi_investigation
  modifier?: number | null; // dice_roll / poi_investigation
  total?: number | null; // dice_roll / poi_investigation
  dc?: number | null; // poi_investigation
  success?: boolean | null; // dice_roll / poi_investigation
  poi_id?: string | null; // poi_investigation
  npc_id?: string | null; // npc_dialogue_choice
  dialogue_node_id?: string | null; // npc_dialogue_choice
  dialogue_option_id?: string | null; // npc_dialogue_choice
  choice_text?: string | null; // npc_dialogue_choice
  payload: unknown; // fallback JSONB para tipos futuros sem colunas dedicadas
  created_at: string;
};

export type SessionEventsPage = {
  items: SessionEvent[];
  next_cursor: string | null;
};

// ── Fase da sessão (be-rpg — substitui o antigo SessionPlayerTarget) ────────
// O backend agora expõe `phase` diretamente em SessionDetail
// (GET /api/v1/sessions/{id}), eliminando o endpoint por-jogador
// `/sessions/{id}/players-target`.

export type SessionTarget = {
  id: string;
  sessionId: string;
  targetType: 'campaign' | 'adventure' | 'scene';
  targetId: string;
  createdAt: string;
};

// Nota: `InvestigatePoiRequest`/`InvestigatePoiResponse` foram removidos —
// os endpoints dedicados que eles tipavam (`.../pois/{poi_id}/investigate`,
// `.../investigate-general`) não existem mais (be-rpg commits e123710/
// f0eafa5). Investigação agora usa `CreateRollRequestInput`/`DiceRollResult`
// (`types/diceRoll.ts`), como qualquer outro `context_type` de roll-request.

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

// SceneNPC — resolvido no contexto de uma sessão de jogo específica (GET
// /api/v1/sessions/{session_id}/scenes/{scene_id}, be-rpg PR #70). `name` é
// o nome de exibição já resolvido pelo backend (nome real se descoberto/sem
// unknown_name configurado, ou o unknown_name/"Desconhecido" caso contrário)
// — mapeado de `display_name` no payload da API.
export type SceneNPC = {
  id: string;
  name: string;
  name_discovered: boolean;
  avatar_url?: string | null;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
};

// ScenePointOfInterest — shape slim reduzido de GET
// /api/v1/sessions/{session_id}/scenes/{scene_id} (be-rpg PR #70,
// SessionScenePOIView). O backend deliberadamente expõe só o necessário para
// renderizar um pin e abrir sua modal de detalhes — todos os demais campos
// que existiam antes (name, short_name, type, skill_check, dc, success_text,
// failure_text, description, enabled, sort_order) são estado de
// domínio interno usado por InvestigatePOI e outras regras de negócio, e não
// vazam mais para este payload. `enabled`/`discovered` já são aplicados
// server-side (a query só retorna POIs habilitados); não há mais como listar
// POIs ocultos via este endpoint — reposicionamento de pins ocultos no Modo
// Edição passa a ser feito via banco direto, não mais via API.
export type ScenePointOfInterest = {
  id: string;
  // Nome a ser exibido tanto no pin do mapa quanto na modal de detalhes —
  // já resolvido pelo backend conforme o estado de descoberta da sessão.
  display_name: string;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
  // true quando o POI tem skill_check configurado e ainda não foi
  // descoberto nesta sessão — habilita a ação "Investigar". false para POIs
  // já descobertos ou públicos (sem skill_check). Ver be-rpg PR #70,
  // SessionScenePOIView.Investigable.
  investigable: boolean;
};

// SceneDetail — resposta de GET /api/v1/sessions/{session_id}/scenes/{scene_id}
// (be-rpg PR #70, branch feature/scene-session-endpoint). Substitui o
// endpoint antigo GET /api/v1/scenes/{id} (não escopado por sessão) — os
// campos de mídia mudaram de nome (ex: `map_image_url` -> `map_url`,
// `audio_transition_file`/`transition_sfx` -> `audio_transition_url`).
export type SceneDetail = {
  id: string;
  map_url: string;
  intro_narration?: string | null;
  intro_narration_audio_url?: string | null;
  ambient_soundtrack_url?: string | null;
  audio_transition_url?: string | null;
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

export type CreateEventType = 'narrative_entered' | 'npc_dialogue_choice' | 'dice_roll';

export type CreateEventRequest = {
  type: CreateEventType;
  // narrative_entered usa colunas tipadas (be-rpg PR #69) em vez de payload.
  entity_type?: 'campaign' | 'adventure' | 'scene';
  entity_id?: string;
  // npc_dialogue_choice / dice_roll ainda usam payload genérico — fora do
  // escopo desta migração pontual (só narrative_entered foi convertido aqui).
  payload?: Record<string, unknown>;
};

export type SessionSocketEventType =
  | 'session_joined'
  | 'session_left'
  | 'player_ready_changed'
  | 'session_started'
  | 'roll_resolved'
  | 'session.poi_discovered';

export type SessionSocketEvent = {
  type: SessionSocketEventType;
  payload?: any;
  event?: string;
  session_id?: string;
  scene_id?: string;
  discovered_by_hero?: string;
  pois?: any[];
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

