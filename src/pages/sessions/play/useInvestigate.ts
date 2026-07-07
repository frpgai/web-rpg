import { useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { heroApi } from '../../../api/services/hero';
import { useAuthStore } from '../../../stores/authStore';
import { useDiceRollStore } from '../../../stores/diceRollStore';
import type { SceneDetail, ScenePointOfInterest } from '../../../types';

export type HeroSkillOption = { slug: string; name: string };

/**
 * Fluxo de Investigação (spec 00153-mesa-jogo/investigacao.md, seções 2.3 e
 * 4.1): não há mais rolagem fake no cliente nem endpoints dedicados
 * (`/investigate`, `/investigate-general` foram removidos em be-rpg
 * commits e123710/f0eafa5). Toda investigação — direcionada ou geral — passa
 * pelo fluxo genérico de `roll-requests` (spec 00134-rolagem-dados), o mesmo
 * usado por combate/diálogo: este hook apenas dispara
 * `useDiceRollStore.triggerRollRequest` com o `context_type` correto e deixa
 * o dado 3D (`DiceRollOverlay`, já montado em `ActiveTable.tsx`) animar o
 * resultado real que chega via WebSocket `roll_resolved`.
 *
 * A descoberta em si (`session.poi_discovered` — revelar pins ocultos,
 * atualizar nome/descrição, pulso dourado, timeline) é tratada de forma
 * genérica no `useSessionSocket` de `ActiveTable.tsx`, que já recarrega a
 * cena e a timeline para qualquer POI descoberto — não duplicado aqui.
 *
 * Dois fluxos, mesmo endpoint (`POST /sessions/{id}/roll-requests`):
 * - "Investigar algo específico" (`investigate`): `context_type:
 *   'poi_investigation_directed'`, `context_id` = `poi.id`. A perícia
 *   correta é resolvida a partir de `scene_points_of_interest.skill_check`
 *   no backend, mas esse campo é estado interno de mestre e não é exposto no
 *   payload slim de `SessionScenePOIView` (ver nota em `POIDetailSheet.tsx`).
 *   Sem essa informação no cliente, envia-se `investigation` como perícia
 *   padrão (mesmo valor do exemplo da spec, seção 4.1-A) — o servidor é quem
 *   valida/resolve o teste de qualquer forma.
 * - "Vasculhar o local" (`investigateGeneral`): `context_type:
 *   'poi_investigation_general'`, `context_id` = `scene.id`. Como o roll é
 *   conferido contra todo POI ainda oculto da cena, o jogador escolhe a
 *   perícia (`heroSkills`, carregadas de `heroApi.get`) antes de rolar.
 */
export function useInvestigate(sessionId: string, scene: SceneDetail) {
  const authUserId = useAuthStore((s) => s.user?.id);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [heroSkills, setHeroSkills] = useState<HeroSkillOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const triggerRollRequest = useDiceRollStore((s) => s.triggerRollRequest);

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
  // 2.3) — o herói de detalhe já vem com `skills[].slug/name` resolvidos
  // pelo backend (ver HeroSkills.tsx), sem dicionário hardcoded no frontend.
  useEffect(() => {
    if (!heroId) return;
    heroApi
      .get(heroId)
      .then((hero) => setHeroSkills((hero.skills ?? []).map((s) => ({ slug: s.slug, name: s.name }))))
      .catch((err) => console.error('Failed to load hero skills for investigate flow:', err));
  }, [heroId]);

  const eligiblePois: ScenePointOfInterest[] = scene.points_of_interest.filter((poi) => poi.investigable);

  function investigate(poi: ScenePointOfInterest, skill = 'investigation') {
    if (!heroId) {
      setError('Nenhum herói disponível para investigar.');
      return;
    }
    setError(null);
    triggerRollRequest(
      sessionId,
      { context_type: 'poi_investigation_directed', context_id: poi.id, hero_id: heroId, skill },
      `Investigar: ${poi.display_name}`
    );
  }

  function investigateGeneral(skill: string) {
    if (!heroId) {
      setError('Nenhum herói disponível para investigar.');
      return;
    }
    setError(null);
    triggerRollRequest(
      sessionId,
      { context_type: 'poi_investigation_general', context_id: scene.id, hero_id: heroId, skill },
      'Vasculhar o Local'
    );
  }

  return {
    eligiblePois,
    heroId,
    heroSkills,
    error,
    investigate,
    investigateGeneral,
  };
}
