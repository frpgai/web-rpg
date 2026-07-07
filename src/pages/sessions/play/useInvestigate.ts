import { useCallback, useEffect, useState } from 'react';
import { sceneApi } from '../../../api/services/scene';
import { sessionApi } from '../../../api/services/session';
import { useAuthStore } from '../../../stores/authStore';
import type { InvestigatePoiResponse, SceneDetail, ScenePointOfInterest } from '../../../types';

type RollState = {
  poi: ScenePointOfInterest;
  roll: number;
  result?: InvestigatePoiResponse;
} | null;

/**
 * Fluxo de Investigação (spec A00153 seção 4.3): descobre POIs ocultos
 * que tenham `skill_check`/`dc` configurados, rola um d20 bruto no client
 * (sem modificador — a Regra de Ouro do projeto proíbe cálculo de regras no
 * frontend) e envia para `POST /scenes/{scene_id}/pois/{poi_id}/investigate`,
 * que calcula modificador e sucesso/falha no backend.
 *
 * GAP CONHECIDO (be-rpg PR #70, SessionScenePOIView): o payload de
 * `GET /sessions/{session_id}/scenes/{scene_id}` passou a expor só
 * `id`/`display_name`/`x_coordinate`/`y_coordinate` por POI — os campos
 * `enabled` (flag estática de catálogo), `skill_check`, `dc` e `discovered`
 * usados aqui para montar `eligiblePois` não vêm mais nesse endpoint. Sem
 * eles não há como o frontend saber, a partir deste payload, quais POIs
 * ainda exigem investigação. `eligiblePois` fica permanentemente vazio até
 * o backend decidir expor esses campos (ou um campo `investigable`
 * equivalente) nesse endpoint de sessão — isto não é regressão introduzida
 * aqui, é consequência direta da redução de payload; reportado ao líder.
 */
export function useInvestigate(sessionId: string, scene: SceneDetail, onDiscovered: (poiId: string) => void) {
  const authUserId = useAuthStore((s) => s.user?.id);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<RollState>(null);
  const [error, setError] = useState<string | null>(null);

  // Herói ativo do jogador atual: não há noção de "herói selecionado" na
  // tela de jogo hoje (ver limitação documentada em ActiveTable.tsx). Segue
  // o mesmo padrão de `sessionApi.getPlayers` usado em `usePlaySession`/
  // `CampaignIntro`, casando `session_player.user_id` com o usuário
  // autenticado (`useAuthStore`); se não encontrar (ex: `authStore.user`
  // ainda não carregado), cai para o primeiro herói disponível na sessão.
  useEffect(() => {
    sessionApi
      .getPlayers(sessionId)
      .then((players) => {
        const mine = players.find((p) => p.user_id === authUserId)?.hero ?? players.find((p) => p.hero)?.hero;
        setHeroId(mine?.id ?? null);
      })
      .catch((err) => console.error('Failed to load session players for investigate flow:', err));
  }, [sessionId, authUserId]);

  // Ver GAP CONHECIDO acima — sem `enabled`/`skill_check`/`dc` neste payload,
  // não há dado suficiente para determinar quais POIs são elegíveis.
  const eligiblePois: ScenePointOfInterest[] = [];

  const investigate = useCallback(
    (poi: ScenePointOfInterest) => {
      if (!heroId) {
        setError('Nenhum herói disponível para investigar.');
        return;
      }
      setError(null);
      setRolling(true);
      const d20 = Math.floor(Math.random() * 20) + 1;
      setRoll({ poi, roll: d20 });

      sceneApi
        .investigatePoi(scene.id, poi.id, { session_id: sessionId, hero_id: heroId, roll: d20 })
        .then((result) => {
          setRoll({ poi, roll: d20, result });
          if (result.success && result.enabled) {
            onDiscovered(result.poi_id);
          }
        })
        .catch((err) => {
          console.error('Failed to investigate POI:', err);
          setError('Não foi possível investigar este local. Tente novamente.');
          setRoll(null);
        })
        .finally(() => setRolling(false));
    },
    [scene.id, sessionId, heroId, onDiscovered]
  );

  const reset = useCallback(() => {
    setRoll(null);
    setError(null);
  }, []);

  return { eligiblePois, heroId, rolling, roll, error, investigate, reset };
}
