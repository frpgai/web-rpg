import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { lobbyApi } from './lobbyApi';
import { useSessionSocket } from './useSessionSocket';
import { useUserStore } from '../../../stores/userStore';
import type { SessionDetail } from '../../../types';

export function useLobby(sessionId: string) {
  const [, setLocation] = useLocation();
  const user = useUserStore((s) => s.user);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const fetchSession = useCallback(() => {
    if (!sessionId) return;
    setError(null);
    lobbyApi
      .get(sessionId)
      .then((data) => {
        setSession(data);
        if (data.status === 'active') {
          setLocation(`/app/sessions/${sessionId}`);
        }
      })
      .catch((err) => {
        console.error('Failed to load session:', err);
        setError('Não foi possível carregar o lobby da sessão.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, setLocation]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useSessionSocket(
    sessionId,
    useCallback(
      (event) => {
        if (event.type === 'session_started') {
          setLocation(`/app/sessions/${sessionId}`);
          return;
        }
        fetchSession();
      },
      [fetchSession, setLocation, sessionId]
    )
  );

  const isOwner = !!user && !!session && session.owner_id === user.id;
  const playersCount = session?.players.length ?? 0;
  const minPlayers = session?.min_players ?? 0;
  const canStart = isOwner && playersCount >= minPlayers && !starting;

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
    } catch (err) {
      console.error('Failed to start session:', err);
      setStartError('Não foi possível iniciar a aventura. Tente novamente.');
    } finally {
      setStarting(false);
    }
  }, [sessionId, setLocation]);

  const goToDashboard = useCallback(() => {
    setLocation('/app/dashboard');
  }, [setLocation]);

  return {
    session,
    loading,
    error,
    isOwner,
    minPlayers,
    maxPlayers: session?.max_players ?? 0,
    playersCount,
    canStart,
    starting,
    startError,
    startSession,
    inviteLink,
    copied,
    copyInviteLink,
    goToDashboard,
  };
}
