import { useParams } from 'wouter';
import { Spinner } from '../../../components/ui/Spinner';
import { usePlaySession } from './usePlaySession';
import { CampaignIntro } from './CampaignIntro';
import { StorytellingScreen } from './StorytellingScreen';
import { ActiveTable } from './ActiveTable';
import './PlayPage.css';

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';

  const {
    session,
    campaign,
    players,
    adventure,
    scene,
    phase,
    error,
    refetchCampaign,
    enterStorytelling,
    enterTable,
    refreshScene,
  } = usePlaySession(sessionId);

  if (phase === 'loading') {
    return (
      <div className="play-root play-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="play-root play-loading">
        <p className="play-error">{error}</p>
      </div>
    );
  }

  if (phase === 'campaign-intro') {
    return (
      <CampaignIntro
        session={session}
        campaign={campaign}
        players={players}
        onEnter={enterStorytelling}
        refetchCampaign={refetchCampaign}
      />
    );
  }

  if (phase === 'storytelling') {
    return <StorytellingScreen adventure={adventure} onEnter={enterTable} />;
  }

  if (!scene) {
    return (
      <div className="play-root play-loading">
        <p className="play-error">Nenhuma cena ativa nesta sessão.</p>
      </div>
    );
  }

  return (
    <ActiveTable
      sessionId={sessionId}
      sessionName={session?.name ?? '...'}
      scene={scene}
      onRefreshScene={refreshScene}
    />
  );
}
