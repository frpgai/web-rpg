import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { lobbyApi } from './lobbyApi';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { useUserStore } from '../../../stores/userStore';
import type { SessionDetail, SessionPlayer } from '../../../types';

export function useLobby(sessionId: string) {
  const [, setLocation] = useLocation();
  const user = useUserStore((s) => s.user);
  const fetchMe = useUserStore((s) => s.fetchMe);

  useEffect(() => {
    if (!user) {
      fetchMe().catch((err) => console.error('Failed to load current user:', err));
    }
  }, [user, fetchMe]);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  const loading = sessionLoading || playersLoading;
  const [error, setError] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const fetchLobby = useCallback(() => {
    if (!sessionId) return;
    setError(null);

    lobbyApi
      .get(sessionId)
      .then((sessionData) => {
        setSession(sessionData);
        if (sessionData.status === 'active') {
          setLocation(`/app/sessions/${sessionId}`);
        }
      })
      .catch((err) => {
        console.error('Failed to load session:', err);
        setError('Não foi possível carregar o lobby da sessão.');
      })
      .finally(() => setSessionLoading(false));

    lobbyApi
      .getPlayers(sessionId)
      .then(setPlayers)
      .catch((err) => {
        console.error('Failed to load session players:', err);
        setError('Não foi possível carregar o lobby da sessão.');
      })
      .finally(() => setPlayersLoading(false));
  }, [sessionId, setLocation]);

  useEffect(() => {
    fetchLobby();
  }, [fetchLobby]);

  const refreshPlayers = useCallback(() => {
    if (!sessionId) return;
    lobbyApi
      .getPlayers(sessionId)
      .then(setPlayers)
      .catch((err) => console.error('Failed to refresh session players:', err));
  }, [sessionId]);

  useSessionSocket(
    sessionId,
    useCallback(
      (event) => {
        if (event.type === 'session_started') {
          setLocation(`/app/sessions/${sessionId}`);
          return;
        }
        refreshPlayers();
      },
      [refreshPlayers, setLocation, sessionId]
    )
  );

  const isOwner = !!user && !!session && session.owner_id === user.id;
  const playersCount = players.length;
  const minPlayers = session?.min_players ?? 0;
  const canStart = isOwner && playersCount >= minPlayers && !starting;
  const startButtonTooltip =
    isOwner && playersCount < minPlayers ? 'Aguardando heróis suficientes...' : undefined;

  const inviteLink = session ? `${window.location.origin}${window.location.pathname}#/join/${session.invite_code}` : '';

  const copyInviteLink = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy invite link:', err);
      });
  }, [inviteLink]);

  const startSession = useCallback(async () => {
    if (!sessionId) return;
    setStartError(null);
    setStarting(true);
    try {
      await lobbyApi.start(sessionId);
      setLocation(`/app/sessions/${sessionId}`);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      const status: number | undefined = err?.response?.status;
      let body: { code?: string; message?: string } | null = null;
      try {
        body = err?.response ? await err.response.clone().json() : null;
      } catch {
        body = null;
      }

      if (status === 422 && body?.code === 'MIN_PLAYERS_NOT_MET') {
        setStartError(body.message ?? 'A sessão ainda não atingiu o número mínimo de jogadores.');
      } else if (status === 403) {
        setStartError('Apenas o anfitrião pode iniciar a aventura.');
      } else if (status === 422) {
        setStartError('A sessão não está pronta para ser iniciada.');
      } else {
        setStartError('Não foi possível iniciar a aventura. Tente novamente.');
      }
    } finally {
      setStarting(false);
    }
  }, [sessionId, setLocation]);

  const goToDashboard = useCallback(() => {
    setLocation('/app/dashboard');
  }, [setLocation]);

  return {
    session,
    players,
    loading,
    error,
    isOwner,
    minPlayers,
    maxPlayers: session?.max_players ?? 0,
    playersCount,
    canStart,
    starting,
    startError,
    startButtonTooltip,
    startSession,
    inviteLink,
    copied,
    copyInviteLink,
    goToDashboard,
  };
}
