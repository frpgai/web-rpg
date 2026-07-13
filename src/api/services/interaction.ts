import { apiClient } from '../client';

export interface InteractionAction {
  slug: string;
  name: string;
  requires_roll: boolean;
  skill?: string;
  dice_type?: string;
}

export interface InteractInput {
  target_type: string;
  target_id: string;
  action: string;
  roll_type: 'normal' | 'advantage' | 'disadvantage';
}

export interface InteractResponse {
  interaction_id: string;
}

export const interactionApi = {
  getActions: (sessionId: string, targetType: string, targetId: string) =>
    apiClient
      .get(`api/v1/sessions/${sessionId}/targets/${targetType}/${targetId}/actions`)
      .json<{ actions: InteractionAction[] }>()
      .then((res) => res.actions || []),

  interact: (sessionId: string, input: InteractInput) =>
    apiClient
      .post(`api/v1/sessions/${sessionId}/interactions`, { json: input })
      .json<InteractResponse>(),
};
