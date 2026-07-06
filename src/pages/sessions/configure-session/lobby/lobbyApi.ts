import { sessionApi } from '../../../../api/services/session';

// Alias fino sobre o sessionApi compartilhado (também usado pela Mesa de Jogo
// / Timeline em src/pages/sessions/timeline) para não quebrar imports existentes.
export const lobbyApi = sessionApi;
