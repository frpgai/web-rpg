import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { sessionApi } from '../../../api/services/session';
import { Spinner } from '../../../components/ui/Spinner';
import { CampaignPhase } from './phases/campaign/CampaignPhase';
import { AdventurePhase } from './phases/adventure/AdventurePhase';
import { ScenePhase } from './phases/scene/ScenePhase';
import type { SessionDetail } from '../../../types';
import './PlayPage.css';

/**
 * Mesa de Jogo Ativa (rota /app/sessions/:id/play) — spec 00190.
 *
 * Fonte de verdade da fase é o campo `phase` retornado por
 * `GET /api/v1/sessions/:id` (be-rpg `internal/session/service.go`,
 * `Service.Get`), calculado a partir do último `session_target` gravado
 * pelos eventos `narrative_entered`. O client não computa a fase
 * localmente — apenas lê `session.phase` e refaz o fetch (`refetch`) depois
 * de cada avanço (`onAdvance`, disparado pelas próprias fases ao gravar o
 * evento `narrative_entered` correspondente).
 */
export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const sessionId = params.id ?? '';

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!sessionId) return;
    setError(null);

    sessionApi
      .get(sessionId)
      .then((data) => {
        if (data.status === 'lobby') {
          setLocation(`/app/sessions/${sessionId}/lobby`);
          return;
        }
        setSession(data);
      })
      .catch((err) => {
        console.error('Failed to load play session:', err);
        setError('Não foi possível carregar a mesa de jogo.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, setLocation]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="play-root play-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="play-root play-loading">
        <p className="play-error">{error ?? 'Sessão não encontrada.'}</p>
      </div>
    );
  }

  switch (session.phase) {
    case 'campaign':
      return <CampaignPhase sessionId={sessionId} session={session} onAdvance={load} />;
    case 'adventure':
      return <AdventurePhase sessionId={sessionId} session={session} onAdvance={load} />;
    case 'scene':
      return <ScenePhase sessionId={sessionId} session={session} />;
    default:
      // Fase desconhecida/inesperada retornada pelo backend — evita tela em
      // branco, mas não tenta adivinhar qual fase seria a correta.
      return (
        <div className="play-root play-loading">
          <p className="play-error">Fase de sessão desconhecida: "{session.phase}".</p>
        </div>
      );
  }
}
