import { renderHook, waitFor, act } from '@testing-library/react';
import { useInvestigate } from './useInvestigate';
import { sessionApi } from '../../../../../api/services/session';
import { useAuthStore } from '../../../../../stores/authStore';
import { useDiceRollStore } from '../../../../../stores/diceRollStore';
import { interactionApi } from '../../../../../api/services/interaction';
import type { SceneDetail } from '../../../../../types';

vi.mock('../../../../../api/services/session', () => ({
  sessionApi: {
    getPlayers: vi.fn(),
  },
}));

vi.mock('../../../../../api/services/interaction', () => ({
  interactionApi: {
    interact: vi.fn(),
    getActions: vi.fn(),
  },
}));

const mockedSessionApi = vi.mocked(sessionApi);
const mockedInteractionApi = vi.mocked(interactionApi);

function baseScene(overrides: Partial<SceneDetail> = {}): SceneDetail {
  return {
    id: 'scene-1',
    npcs: [],
    points_of_interest: [
      { id: 'poi-hidden-1', display_name: 'O Poço', actions: [{ slug: 'investigate', completed: false }] },
      { id: 'poi-visible', display_name: 'Praça', actions: [] },
      {
        id: 'poi-hidden-no-check',
        display_name: 'Baú sem teste',
        actions: [{ slug: 'investigate', completed: true }],
      },
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
  mockedInteractionApi.interact.mockResolvedValue({ interaction_id: 'interaction-123' });
  mockedInteractionApi.getActions.mockResolvedValue([]);
});

describe('useInvestigate', () => {
  it('exposes only POIs with a pending investigate action in eligiblePois (be-rpg PR #80)', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));
    expect(result.current.eligiblePois).toEqual([
      { id: 'poi-hidden-1', display_name: 'O Poço', actions: [{ slug: 'investigate', completed: false }] },
    ]);
  });

  it('investigate() triggers a generic roll-request with target_type=poi, action=investigate, and roll_type=normal', async () => {
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
      target_type: 'poi',
      target_id: 'poi-hidden-1',
      action: 'investigate',
      roll_type: 'normal',
    });
  });

  it('investigateGeneral() triggers a roll-request with target_type=scene, action=search, and roll_type=normal', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    act(() => {
      result.current.investigateGeneral();
    });

    const { rollInput, sessionId, rollState } = useDiceRollStore.getState();
    expect(rollState).toBe('pending_roll');
    expect(sessionId).toBe('session-1');
    expect(rollInput).toEqual({
      target_type: 'scene',
      target_id: 'scene-1',
      action: 'search',
      roll_type: 'normal',
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
