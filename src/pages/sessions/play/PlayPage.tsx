import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { sessionApi } from '../../../api/services/session';
import type { SessionDetail } from '../../../types';

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    sessionApi
      .get(sessionId)
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar a sessão.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return <div>Carregando sessão...</div>;
  }

  if (error || !session) {
    return <div>{error ?? 'Sessão não encontrada.'}</div>;
  }

  return <div>Sessão carregada. Fase atual: {session.phase}</div>;
}
