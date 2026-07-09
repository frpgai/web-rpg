import { useCallback, useEffect, useState } from 'react';
import { npcApi } from '../../../../../api/services/npc';
import { sessionApi } from '../../../../../api/services/session';
import type { DialogueOptionView, NPCDialogueTree, SceneNPC } from '../../../../../types';

/**
 * Carrega e navega a árvore de diálogo (grafo plano) de um NPC — spec A00153
 * seção 5. `npc.id` aqui é o `campaign_npc.id` retornado em `scene.npcs[]`.
 */
export function useNpcDialogue(sessionId: string, npc: SceneNPC | null, onEventLogged: () => void) {
  const [tree, setTree] = useState<NPCDialogueTree | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!npc) {
      setTree(null);
      setCurrentNodeId(null);
      return;
    }
    setLoading(true);
    setError(null);
    npcApi
      .getDialogueTree(npc.id)
      .then((result) => {
        setTree(result);
        setCurrentNodeId(result.root_node_id ?? result.nodes[0]?.id ?? null);
      })
      .catch((err) => {
        console.error('Failed to load NPC dialogue tree:', err);
        setError('Não foi possível carregar o diálogo deste NPC.');
      })
      .finally(() => setLoading(false));
  }, [npc]);

  const currentNode = tree?.nodes.find((node) => node.id === currentNodeId) ?? null;

  const choose = useCallback(
    (option: DialogueOptionView) => {
      // Persiste a escolha do jogador na timeline (spec A00153 seção 5).
      sessionApi
        .createEvent(sessionId, {
          type: 'npc_dialogue_choice',
          payload: {
            npc_id: npc?.id,
            node_id: currentNodeId,
            option_id: option.id,
            text: option.label,
          },
        })
        .catch((err) => console.error('Failed to log dialogue choice event:', err))
        .finally(() => onEventLogged());

      // Opções com teste de perícia (`requires_skill_check`) não são
      // resolvidas aqui: nenhum dos 4 endpoints desta spec expõe uma rota de
      // resolução de rolagem para diálogo, e o projeto proíbe cálculo de
      // regras no frontend (ver Regra de Ouro em web-rpg/CLAUDE.md). Essas
      // opções ficam desabilitadas na UI com um aviso — ver NPCDialogueModal.
      if (option.next_node_id) {
        setCurrentNodeId(option.next_node_id);
      }
    },
    [sessionId, npc, currentNodeId, onEventLogged]
  );

  return { tree, currentNode, loading, error, choose };
}
