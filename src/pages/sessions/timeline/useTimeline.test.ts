import { renderHook, waitFor } from '@testing-library/react';
import { useTimeline } from './useTimeline';
import { timelineApi } from './timelineApi';

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/app/sessions/s1', mockSetLocation],
}));

vi.mock('../../../hooks/useSessionSocket', () => ({
  useSessionSocket: vi.fn(),
}));

vi.mock('./timelineApi', () => ({
  timelineApi: {
    getSession: vi.fn(),
    getPlayers: vi.fn(),
    getCampaign: vi.fn(),
    getEvents: vi.fn(),
  },
}));

const mockedTimelineApi = vi.mocked(timelineApi);

describe('useTimeline — refetchCampaign (renovação de URL assinada de áudio)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTimelineApi.getSession.mockResolvedValue({
      id: 's1',
      campaign_id: 'c1',
      status: 'active',
      name: 'Sessão 1',
    } as any);
    mockedTimelineApi.getPlayers.mockResolvedValue([]);
    mockedTimelineApi.getEvents.mockResolvedValue({ items: [], next_cursor: null } as any);
  });

  it('refetches the campaign and updates intro_narration_audio_url with a fresh signed URL', async () => {
    mockedTimelineApi.getCampaign
      .mockResolvedValueOnce({
        id: 'c1',
        title: 'Campanha',
        intro_narration_audio_url: 'https://r2.example/intro.mp3?sig=old',
      } as any)
      .mockResolvedValueOnce({
        id: 'c1',
        title: 'Campanha',
        intro_narration_audio_url: 'https://r2.example/intro.mp3?sig=new',
      } as any);

    const { result } = renderHook(() => useTimeline('s1'));

    await waitFor(() => {
      expect(result.current.campaign).not.toBeNull();
    });
    expect(mockedTimelineApi.getCampaign).toHaveBeenCalledTimes(1);

    await result.current.refetchCampaign();

    await waitFor(() => {
      expect(result.current.campaign?.intro_narration_audio_url).toBe(
        'https://r2.example/intro.mp3?sig=new'
      );
    });

    expect(mockedTimelineApi.getCampaign).toHaveBeenCalledTimes(2);
    expect(mockedTimelineApi.getCampaign).toHaveBeenCalledWith('c1');
  });

  it('does nothing when there is no session/campaign_id loaded yet', async () => {
    mockedTimelineApi.getSession.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useTimeline('s1'));

    await result.current.refetchCampaign();

    expect(mockedTimelineApi.getCampaign).not.toHaveBeenCalled();
  });
});
