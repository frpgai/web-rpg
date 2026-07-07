import { renderHook, waitFor, act } from '@testing-library/react';
import { useInvestigate } from './useInvestigate';
import { sceneApi } from '../../../api/services/scene';
import { sessionApi } from '../../../api/services/session';
import { useAuthStore } from '../../../stores/authStore';
import type { SceneDetail } from '../../../types';

vi.mock('../../../api/services/scene', () => ({
  sceneApi: {
    investigatePoi: vi.fn(),
  },
}));

vi.mock('../../../api/services/session', () => ({
  sessionApi: {
    getPlayers: vi.fn(),
  },
}));

const mockedSceneApi = vi.mocked(sceneApi);
const mockedSessionApi = vi.mocked(sessionApi);

// Fixtures refletem o payload reduzido de SessionScenePOIView (be-rpg PR
// #70): apenas id/display_name/x_coordinate/y_coordinate. Ver GAP CONHECIDO
// em useInvestigate.ts — sem enabled/skill_check/dc, eligiblePois é sempre
// vazio; os testes abaixo passam o POI diretamente para `investigate`.
function baseScene(overrides: Partial<SceneDetail> = {}): SceneDetail {
  return {
    id: 'scene-1',
    npcs: [],
    points_of_interest: [
      { id: 'poi-hidden-1', display_name: 'O Poço' },
      { id: 'poi-visible', display_name: 'Praça' },
      { id: 'poi-hidden-no-check', display_name: 'Baú sem teste' },
    ],
    ...overrides,
  } as SceneDetail;
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: { id: 'user-1', name: 'Fulano', email: 'a@a.com' } } as any);
  mockedSessionApi.getPlayers.mockResolvedValue([
    { user_id: 'user-1', username: 'Fulano', is_owner: true, is_ready: true, hero: { id: 'hero-1', name: 'H', class: 'x', level: 1, avatar_url: null } },
  ] as any);
});

describe('useInvestigate', () => {
  it('exposes eligiblePois as empty — payload não traz mais enabled/skill_check/dc (be-rpg PR #70)', async () => {
    const scene = baseScene();
    const { result } = renderHook(() => useInvestigate('session-1', scene, vi.fn()));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));
    expect(result.current.eligiblePois).toEqual([]);
  });

  it('rolls a d20 and calls the investigate endpoint with the raw roll, no modifier', async () => {
    const scene = baseScene();
    mockedSceneApi.investigatePoi.mockResolvedValue({
      poi_id: 'poi-hidden-1',
      success: true,
      enabled: true,
      total: 18,
      success_text: 'Você encontrou uma passagem secreta.',
    });
    const onDiscovered = vi.fn();
    const { result } = renderHook(() => useInvestigate('session-1', scene, onDiscovered));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    await act(async () => {
      result.current.investigate(scene.points_of_interest[0]);
    });

    await waitFor(() => expect(result.current.roll?.result).toBeDefined());

    expect(mockedSceneApi.investigatePoi).toHaveBeenCalledWith(
      'scene-1',
      'poi-hidden-1',
      expect.objectContaining({ session_id: 'session-1', hero_id: 'hero-1' })
    );
    const [, , body] = mockedSceneApi.investigatePoi.mock.calls[0];
    expect(body.roll).toBeGreaterThanOrEqual(1);
    expect(body.roll).toBeLessThanOrEqual(20);
    expect(onDiscovered).toHaveBeenCalledWith('poi-hidden-1');
  });

  it('does not call onDiscovered on failure and keeps the POI hidden', async () => {
    const scene = baseScene();
    mockedSceneApi.investigatePoi.mockResolvedValue({
      poi_id: 'poi-hidden-1',
      success: false,
      enabled: false,
      total: 6,
      failure_text: 'Nada encontrado.',
    });
    const onDiscovered = vi.fn();
    const { result } = renderHook(() => useInvestigate('session-1', scene, onDiscovered));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    await act(async () => {
      result.current.investigate(scene.points_of_interest[0]);
    });

    await waitFor(() => expect(result.current.roll?.result).toBeDefined());
    expect(onDiscovered).not.toHaveBeenCalled();
  });

  it('surfaces a friendly error message when the API call fails', async () => {
    const scene = baseScene();
    mockedSceneApi.investigatePoi.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useInvestigate('session-1', scene, vi.fn()));

    await waitFor(() => expect(result.current.heroId).toBe('hero-1'));

    await act(async () => {
      result.current.investigate(scene.points_of_interest[0]);
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.roll).toBeNull();
  });
});
