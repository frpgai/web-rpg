import { useParams } from 'wouter';
import { Spinner } from '../../../components/ui/Spinner';
import { usePlaySession } from './usePlaySession';
import { StorytellingScreen } from './StorytellingScreen';
import { ActiveTable } from './ActiveTable';
import './PlayPage.css';

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';

  const { session, adventure, scene, phase, error, enterTable, refreshScene } = usePlaySession(sessionId);

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

  if (phase === 'storytelling') {
    return (
      <StorytellingScreen
        adventure={adventure}
        sessionName={session?.name ?? '...'}
        onEnter={enterTable}
      />
    );
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
      onSceneRefresh={refreshScene}
    />
  );
}
