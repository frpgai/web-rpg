import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlaySession } from './usePlaySession';
import { sessionApi } from '../../../api/services/session';
import { sceneApi } from '../../../api/services/scene';
import { campaignApi } from '../../../api/services/campaign';

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/app/sessions/s1/play', mockSetLocation],
}));

vi.mock('../../../api/services/session', () => ({
  sessionApi: {
    get: vi.fn(),
    getPlayerTargets: vi.fn(),
    createPlayerTarget: vi.fn(),
    getPlayers: vi.fn(),
    getAdventure: vi.fn(),
  },
}));

vi.mock('../../../api/services/scene', () => ({
  sceneApi: {
    getForSession: vi.fn(),
  },
}));

vi.mock('../../../api/services/campaign', () => ({
  campaignApi: {
    getDetail: vi.fn(),
  },
}));

const mockedSessionApi = vi.mocked(sessionApi);
const mockedSceneApi = vi.mocked(sceneApi);
const mockedCampaignApi = vi.mocked(campaignApi);

function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    campaign_id: 'c1',
    status: 'active',
    name: 'Sessão 1',
    current_adventure_id: 'a1',
    current_scene_id: null,
    ...overrides,
  } as any;
}

describe('usePlaySession — máquina de estados (campaign-intro / storytelling / table)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCampaignApi.getDetail.mockResolvedValue({ id: 'c1', title: 'Campanha' } as any);
    mockedSessionApi.getPlayers.mockResolvedValue([]);
  });

  it('starts at campaign-intro when there is no campaign player event yet', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession());
    mockedSessionApi.getPlayerTargets.mockResolvedValue([]);

    const { result } = renderHook(() => usePlaySession('s1'));

    await waitFor(() => expect(result.current.phase).toBe('campaign-intro'));
    expect(result.current.campaign).not.toBeNull();
  });

  it('advances from campaign-intro to storytelling via enterStorytelling, logging the campaign player event, without route navigation', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession());
    mockedSessionApi.getPlayerTargets.mockResolvedValue([]);
    mockedSessionApi.createPlayerTarget.mockResolvedValue({} as any);
    mockedSessionApi.getAdventure.mockResolvedValue({ id: 'a1', title: 'Aventura' } as any);

    const { result } = renderHook(() => usePlaySession('s1'));
    await waitFor(() => expect(result.current.phase).toBe('campaign-intro'));

    act(() => {
      result.current.enterStorytelling();
    });

    await waitFor(() => expect(result.current.phase).toBe('storytelling'));
    expect(result.current.adventure?.id).toBe('a1');
    expect(mockSetLocation).not.toHaveBeenCalled();
    expect(mockedSessionApi.createPlayerTarget).toHaveBeenCalledWith('s1', {
      target_type: 'campaign',
      target_id: 'c1',
    });
  });

  it('resumes directly at storytelling when campaign event exists but adventure event does not', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession());
    mockedSessionApi.getPlayerTargets.mockResolvedValue([
      { id: 'e1', session_id: 's1', session_player_id: 'sp1', target_type: 'campaign', target_id: 'c1', created_at: '' },
    ]);
    mockedSessionApi.getAdventure.mockResolvedValue({ id: 'a1', title: 'Aventura' } as any);

    const { result } = renderHook(() => usePlaySession('s1'));

    await waitFor(() => expect(result.current.phase).toBe('storytelling'));
    expect(result.current.adventure?.id).toBe('a1');
    expect(mockedCampaignApi.getDetail).not.toHaveBeenCalled();
  });

  it('skips directly to table when campaign and adventure player events already exist for current adventure', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession({ current_scene_id: 'scene1' }));
    mockedSessionApi.getPlayerTargets.mockResolvedValue([
      { id: 'e1', session_id: 's1', session_player_id: 'sp1', target_type: 'campaign', target_id: 'c1', created_at: '' },
      { id: 'e2', session_id: 's1', session_player_id: 'sp1', target_type: 'adventure', target_id: 'a1', created_at: '' },
    ]);
    mockedSceneApi.getForSession.mockResolvedValue({ id: 'scene1' } as any);

    const { result } = renderHook(() => usePlaySession('s1'));

    await waitFor(() => expect(result.current.phase).toBe('table'));
    expect(result.current.scene?.id).toBe('scene1');
    expect(mockedCampaignApi.getDetail).not.toHaveBeenCalled();
  });

  it('redirects to lobby when session status is lobby', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession({ status: 'lobby' }));
    mockedSessionApi.getPlayerTargets.mockResolvedValue([]);

    renderHook(() => usePlaySession('s1'));

    await waitFor(() => expect(mockSetLocation).toHaveBeenCalledWith('/app/sessions/s1/lobby'));
  });

  it('enterTable logs the adventure player event and loads the current scene', async () => {
    mockedSessionApi.get.mockResolvedValue(baseSession({ current_scene_id: 'scene1' }));
    mockedSessionApi.getPlayerTargets.mockResolvedValue([]);
    mockedSessionApi.createPlayerTarget.mockResolvedValue({} as any);
    mockedSceneApi.getForSession.mockResolvedValue({ id: 'scene1' } as any);

    const { result } = renderHook(() => usePlaySession('s1'));
    await waitFor(() => expect(result.current.phase).toBe('campaign-intro'));

    await act(async () => {
      await result.current.enterTable();
    });

    expect(mockedSessionApi.createPlayerTarget).toHaveBeenCalledWith('s1', {
      target_type: 'adventure',
      target_id: 'a1',
    });
    await waitFor(() => expect(result.current.phase).toBe('table'));
    expect(result.current.scene?.id).toBe('scene1');
  });
});
