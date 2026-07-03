import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { timelineApi } from './timelineApi';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import type { CampaignDetail, SessionDetail, SessionEvent, SessionPlayer } from '../../../types';

export function useTimeline(sessionId: string) {
  const [, setLocation] = useLocation();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  // Cursor-forward apenas: a API GET /sessions/:id/events só suporta buscar
  // eventos "depois de" um seq (cursor "after"). Não existe cursor "before"
  // para buscar eventos mais antigos ancorados a partir do topo já carregado —
  // então "carregar mais ao rolar para cima" não é suportável hoje. O que dá
  // pra fazer com o contrato atual é paginar para frente (mais recentes).
  const nextCursorRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Fase de introdução (antes do clique no CTA) vs. timeline ativa.
  const [introEntered, setIntroEntered] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchSessionAndCampaign = useCallback(() => {
    if (!sessionId) return;
    setError(null);

    timelineApi
      .getSession(sessionId)
      .then((sessionData) => {
        setSession(sessionData);
        if (sessionData.status === 'lobby') {
          setLocation(`/app/sessions/${sessionId}/lobby`);
          return;
        }
        return timelineApi.getCampaign(sessionData.campaign_id).then(setCampaign);
      })
      .catch((err) => {
        console.error('Failed to load session/campaign:', err);
        setError('Não foi possível carregar a mesa de jogo.');
      })
      .finally(() => setLoading(false));

    timelineApi
      .getPlayers(sessionId)
      .then(setPlayers)
      .catch((err) => console.error('Failed to load session players:', err));
  }, [sessionId, setLocation]);

  useEffect(() => {
    fetchSessionAndCampaign();
  }, [fetchSessionAndCampaign]);

  const fetchInitialEvents = useCallback(() => {
    if (!sessionId) return;
    setEventsLoading(true);
    timelineApi
      .getEvents(sessionId)
      .then((page) => {
        setEvents(page.items);
        nextCursorRef.current = page.next_cursor;
        setHasMore(!!page.next_cursor);
      })
      .catch((err) => console.error('Failed to load session events:', err))
      .finally(() => setEventsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    fetchInitialEvents();
  }, [fetchInitialEvents]);

  const loadMoreEvents = useCallback(() => {
    if (!sessionId || !nextCursorRef.current) return;
    timelineApi
      .getEvents(sessionId, nextCursorRef.current)
      .then((page) => {
        setEvents((prev) => [...prev, ...page.items]);
        nextCursorRef.current = page.next_cursor;
        setHasMore(!!page.next_cursor);
      })
      .catch((err) => console.error('Failed to load more session events:', err));
  }, [sessionId]);

  // Qualquer evento no WS (hoje só session_started/player events existem de
  // fato) dispara um refresh da timeline — não há ainda um tipo de evento
  // dedicado a "nova narração"/"novo turno" broadcast pelo backend.
  useSessionSocket(
    sessionId,
    useCallback(() => {
      loadMoreEvents();
    }, [loadMoreEvents])
  );

  // Refetch dedicado da campanha, usado quando a URL assinada do áudio de
  // introdução expira (1h) e o elemento <audio> dispara erro de carregamento.
  // Retorna a Promise para o chamador poder controlar retries/loop.
  const refetchCampaign = useCallback(() => {
    if (!session) return Promise.resolve();
    return timelineApi
      .getCampaign(session.campaign_id)
      .then(setCampaign)
      .catch((err) => {
        console.error('Failed to refetch campaign for audio URL renewal:', err);
      });
  }, [session]);

  const enterCampaign = useCallback(() => {
    // Não existe endpoint específico de "transição" — a sessão já está
    // `active` neste ponto (GET /sessions/:id/start já foi chamado no Lobby).
    // Aqui apenas revelamos a timeline ativa e a barra de ações no client.
    setIntroEntered(true);
  }, []);

  const goToDashboard = useCallback(() => {
    setLocation('/app/dashboard');
  }, [setLocation]);

  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  return {
    session,
    campaign,
    players,
    loading,
    error,
    events,
    eventsLoading,
    hasMore,
    loadMoreEvents,
    introEntered,
    enterCampaign,
    refetchCampaign,
    drawerOpen,
    toggleDrawer,
    goToDashboard,
  };
}
