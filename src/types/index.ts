export type AvailableCampaign = {
  id: string;
  name: string;
  cover_url: string | null;
  system: string;
  level_range: string;
  open_slots: number;
  ai_narration: boolean;
};
