import { useCallback, useEffect, useState } from 'react';
import { sceneApi } from '../../../api/services/scene';
import { sessionApi } from '../../../api/services/session';
import { heroApi } from '../../../api/services/hero';
import { useAuthStore } from '../../../stores/authStore';
import type {
  DiscoveredPoi,
  InvestigateGeneralResponse,
  InvestigatePoiResponse,
  SceneDetail,
  ScenePointOfInterest,
} from '../../../types';

type RollState = {
  poi: ScenePointOfInterest;
  roll: number;
  result?: InvestigatePoiResponse;
} | null;

type GeneralRollState = {
  skill: string;
  roll: number;
  result?: InvestigateGeneralResponse;
} | null;

export type HeroSkillOption = { slug: string; name: string };

/**
 * Fluxo de Investigação (spec A00153 seção 4.3, spec 00153-mesa-jogo/
 * investigacao.md): descobre POIs ocultos que tenham `skill_check`/`dc`
 * configurados, rola um d20 bruto no client (sem modificador — a Regra de
 * Ouro do projeto proíbe cálculo de regras no frontend) e envia para o
 * backend, que calcula modificador e sucesso/falha.
 *
 * Dois fluxos, dois endpoints (be-rpg branch feature/poi-investigation-system,
 * internal/scene/handler.go):
 * - "Investigar algo específico" (`investigate`): mira um POI já elegível
 *   (`investigable === true`) — POST .../pois/{poi_id}/investigate. O POI
 *   tem um único `skill_check` resolvido no backend, então o jogador não
 *   escolhe perícia aqui.
 * - "Vasculhar o local" (`investigateGeneral`): não mira um POI específico —
 *   POST .../investigate-general. Como o roll é conferido contra todo POI
 *   ainda oculto configurado na cena, o jogador escolhe a perícia
 *   (`heroSkills`, carregadas de `heroApi.get`) antes de rolar.
 *
 * Elegibilidade (be-rpg PR #70, SessionScenePOIView.Investigable): o payload
 * de `GET /sessions/{session_id}/scenes/{scene_id}` expõe um booleano
 * `investigable` por POI, já calculado no backend a partir de
 * `skill_check != nil && !discovered`. O frontend não recalcula essa regra —
 * apenas filtra por `poi.investigable === true`.
 */
export function useInvestigate(sessionId: string, scene: SceneDetail, onDiscovered: (poiId: string) => void) {
  const authUserId = useAuthStore((s) => s.user?.id);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [heroSkills, setHeroSkills] = useState<HeroSkillOption[]>([]);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<RollState>(null);
  const [generalRoll, setGeneralRoll] = useState<GeneralRollState>(null);
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

  // Lista de perícias do herói, usada apenas pelo fluxo "Vasculhar o local"
  // (a escolha de perícia da spec 00153-mesa-jogo/investigacao.md seção
  // 4.3.1) — o herói de detalhe já vem com `skills[].slug/name` resolvidos
  // pelo backend (ver HeroSkills.tsx), sem dicionário hardcoded no frontend.
  useEffect(() => {
    if (!heroId) return;
    heroApi
      .get(heroId)
      .then((hero) => setHeroSkills((hero.skills ?? []).map((s) => ({ slug: s.slug, name: s.name }))))
      .catch((err) => console.error('Failed to load hero skills for investigate flow:', err));
  }, [heroId]);

  const eligiblePois: ScenePointOfInterest[] = scene.points_of_interest.filter((poi) => poi.investigable);

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

  const investigateGeneral = useCallback(
    (skill: string) => {
      if (!heroId) {
        setError('Nenhum herói disponível para investigar.');
        return;
      }
      setError(null);
      setRolling(true);
      const d20 = Math.floor(Math.random() * 20) + 1;
      setGeneralRoll({ skill, roll: d20 });

      sceneApi
        .investigateGeneral(scene.id, { session_id: sessionId, hero_id: heroId, skill, roll: d20 })
        .then((result) => {
          setGeneralRoll({ skill, roll: d20, result });
          result.discovered_pois.forEach((poi: DiscoveredPoi) => onDiscovered(poi.id));
        })
        .catch((err) => {
          console.error('Failed to investigate scene (general):', err);
          setError('Não foi possível vasculhar o local. Tente novamente.');
          setGeneralRoll(null);
        })
        .finally(() => setRolling(false));
    },
    [scene.id, sessionId, heroId, onDiscovered]
  );

  const reset = useCallback(() => {
    setRoll(null);
    setGeneralRoll(null);
    setError(null);
  }, []);

  return {
    eligiblePois,
    heroId,
    heroSkills,
    rolling,
    roll,
    generalRoll,
    error,
    investigate,
    investigateGeneral,
    reset,
  };
}
