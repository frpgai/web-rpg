import { renderHook, waitFor, act } from '@testing-library/react';
import { useInvestigate } from './useInvestigate';
import { sessionApi } from '../../../api/services/session';
import { useAuthStore } from '../../../stores/authStore';
import { useDiceRollStore } from '../../../stores/diceRollStore';
import type { SceneDetail } from '../../../types';

vi.mock('../../../api/services/session', () => ({
  sessionApi: {
    getPlayers: vi.fn(),
  },
}));

const mockedSessionApi = vi.mocked(sessionApi);

// Fixtures refletem o payload de SessionScenePOIView (be-rpg PR #70):
// id/display_name/x_coordinate/y_coordinate/investigable. `investigable` já
// vem calculado pelo backend (skill_check configurado e ainda não
// descoberto) — o frontend só filtra por esse booleano.
function baseScene(overrides: Partial<SceneDetail> = {}): SceneDetail {
  return {
    id: 'scene-1',
    npcs: [],
    points_of_interest: [
      { id: 'poi-hidden-1', display_name: 'O Poço', investigable: true },
      { id: 'poi-visible', display_name: 'Praça', investigable: false },
      { id: 'poi-hidden-no-check', display_name: 'Baú sem teste', investigable: false },
    ],
    ...overrides,
  } as SceneDetail;
}

beforeEach(() => {
  vi.clearAllMocks();
  useDiceRollStore.getState().reset();
  useAuthStore.setState({ user: { id: 'user-1', name: 'Fulano', email: 'a@a.com' } } as any);
  mockedSessionApi.getPlayers.mockResolvedValue([
    { user_id: 'user-1', username: 'Fulano', is_owner: true, is_ready: true, hero: { id: 'hero-1', name: 'H', class: 'x', level: 1, avatar_url: null } },
  ] as any);
});

describe('useInvestigate', () => {
  it('exposes only POIs with investigable=true in eligiblePois (be-rpg PR #70)', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));
    expect(result.current.eligiblePois).toEqual([{ id: 'poi-hidden-1', display_name: 'O Poço', investigable: true }]);
  });

  it('investigate() triggers a generic roll-request with context_type=poi_investigation_directed, no dice value computed on the client', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    act(() => {
      result.current.investigate(scene.points_of_interest[0]);
    });

    const { rollInput, sessionId, rollState } = useDiceRollStore.getState();
    expect(rollState).toBe('pending_roll');
    expect(sessionId).toBe('session-1');
    expect(rollInput).toEqual({
      context_type: 'poi_investigation_directed',
      context_id: 'poi-hidden-1',
      hero_id: 'hero-1',
      skill: 'investigation',
    });
  });

  it('investigateGeneral() triggers a roll-request with context_type=poi_investigation_general and context_id=scene.id', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    act(() => {
      result.current.investigateGeneral('perception');
    });

    const { rollInput, sessionId, rollState } = useDiceRollStore.getState();
    expect(rollState).toBe('pending_roll');
    expect(sessionId).toBe('session-1');
    expect(rollInput).toEqual({
      context_type: 'poi_investigation_general',
      context_id: 'scene-1',
      hero_id: 'hero-1',
      skill: 'perception',
    });
  });

  it('surfaces a friendly error and does not trigger a roll when no hero is available', async () => {
    mockedSessionApi.getPlayers.mockResolvedValue([]);
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(mockedSessionApi.getPlayers).toHaveBeenCalled());

    act(() => {
      result.current.investigate(scene.points_of_interest[0]);
    });

    expect(result.current.error).toBeTruthy();
    expect(useDiceRollStore.getState().rollState).toBe('idle');
  });
});
