import { useEffect, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { npcApi } from '../../../../../api/services/npc';
import type { DialogueNodeView, SceneNPC, SessionEvent, SessionPlayerDetail } from '../../../../../types';

export type GroupConversationEntry = {
  key: string;
  heroName: string;
  createdAt: string;
  optionLabel: string;
  npcResponseText: string | null;
  npcResponseAudioUrl: string | null;
};

/**
 * Aba "Conversas do Grupo" do NPCDialogueModal (spec 00153/dialogos.md): lista
 * as escolhas de diálogo de TODOS os jogadores da sessão com este NPC, não só
 * as do jogador atual.
 *
 * Limitação documentada: os eventos `npc_dialogue_choice` (be-rpg PR #69) só
 * expõem colunas tipadas para `npc_id`/`dialogue_node_id`/`dialogue_option_id`/
 * `choice_text` — não há coluna de herói/jogador dedicada para este tipo de
 * evento (`hero_id` só é preenchido para `dice_roll`/`poi_investigation`).
 * Sem um vínculo confiável entre `session_player_id` do evento e o herói do
 * jogador, o nome exibido cai para "Jogador da mesa" quando não é possível
 * resolver. Isso deveria ser resolvido expondo `hero_id` também para
 * `npc_dialogue_choice` no backend.
 */
export function useNpcGroupConversations(sessionId: string, sceneId: string, npc: SceneNPC | null) {
  const [entries, setEntries] = useState<GroupConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!npc) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all([
      sessionApi.getEvents(sessionId, sceneId),
      sessionApi.getPlayers(sessionId),
      npcApi.getDialogueTree(npc.id).catch(() => null),
    ])
      .then(([eventsPage, players, tree]) => {
        const nodesById = new Map<string, DialogueNodeView>((tree?.nodes ?? []).map((n) => [n.id, n]));
        const heroByPlayerIndex = players.map((p: SessionPlayerDetail) => p.hero?.name ?? p.username);

        const rows = eventsPage.items
          .filter((event: SessionEvent) => event.type === 'npc_dialogue_choice' && event.npc_id === npc.id)
          .map((event) => {
            const chosenNode = event.dialogue_node_id ? nodesById.get(event.dialogue_node_id) : undefined;
            const chosenOption = chosenNode?.options.find((o) => o.id === event.dialogue_option_id);
            const responseNode = chosenOption?.next_node_id
              ? nodesById.get(chosenOption.next_node_id)
              : undefined;

            // Sem coluna de herói dedicada neste tipo de evento — ver nota
            // acima. Usa o primeiro jogador com herói como aproximação
            // best-effort quando não há outro sinal disponível.
            const heroName = heroByPlayerIndex[0] ?? 'Jogador da mesa';

            return {
              key: `${event.session_id}-${event.created_at}-${event.dialogue_option_id ?? event.id}`,
              heroName,
              createdAt: event.created_at,
              optionLabel: event.choice_text ?? chosenOption?.label ?? '...',
              npcResponseText: responseNode?.text ?? null,
              npcResponseAudioUrl: responseNode?.audio_url ?? null,
            };
          })
          .reverse();

        setEntries(rows);
      })
      .catch((err) => {
        console.error('Failed to load group conversations for NPC:', err);
        setError('Não foi possível carregar as conversas do grupo.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, sceneId, npc]);

  return { entries, loading, error };
}
