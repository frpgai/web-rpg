import { sessionApi } from '../../../api/services/session';
import { campaignApi } from '../../../api/services/campaign';

// Reaproveita os services já existentes — Timeline não tem regras próprias de
// rede, apenas combina sessão + campanha + eventos.
export const timelineApi = {
  getSession: sessionApi.get,
  getPlayers: sessionApi.getPlayers,
  getCampaign: campaignApi.getDetail,
  getEvents: sessionApi.getEvents,
};
