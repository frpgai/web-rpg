import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { sessionApi } from '../api/services/session';
import { SessionBottomNav } from '../pages/sessions/play/components/SessionBottomNav';
import './PlayLayout.css';

interface PlayLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout da Mesa de Jogo Ativa (rota `/app/sessions/:id/play`) — substitui a
 * antiga lógica de `SESSION_ACTIVE_PATTERN` dentro de `AppLayout`. Sempre
 * renderiza o container visual escuro de imersão do jogo e a
 * `SessionBottomNav` (Sessão/Chat/World Map/Options), nunca o `BottomNav`
 * global do painel.
 *
 * Resolve `current_scene_id` aqui (via `GET /sessions/:id`) só para
 * alimentar o badge de notificação da `SessionBottomNav` — `PlayPage`
 * (dentro de `children`) faz seu próprio fetch independente da sessão para
 * decidir a fase (`campaign`/`adventure`/`scene`); os dois fetches não se
 * substituem porque este layout precisa existir mesmo antes/fora do
 * carregamento de fase feito por `PlayPage`.
 */
export default function PlayLayout({ children }: PlayLayoutProps) {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';
  const [sceneId, setSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    sessionApi
      .get(sessionId)
      .then((session) => setSceneId(session.current_scene_id ?? null))
      .catch((err) => console.error('PlayLayout: failed to load session for scene_id:', err));
  }, [sessionId]);

  return (
    <div className="playlayout-root">
      <main className="playlayout-content">{children}</main>

      <div className="playlayout-nav-container">
        <SessionBottomNav sessionId={sessionId} sceneId={sceneId} />
      </div>
    </div>
  );
}
