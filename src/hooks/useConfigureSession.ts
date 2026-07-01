import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { campaignApi } from '../api/services/campaign';
import { heroApi } from '../api/services/hero';
import { sessionApi } from '../api/services/session';
import { useUserStore } from '../stores/userStore';
import type { CampaignDetail, Hero } from '../types';

const DEFAULT_MIN_PLAYERS = 2;
const DEFAULT_MAX_PLAYERS = 5;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;

export function useConfigureSession(campaignId: string) {
  const [, setLocation] = useLocation();
  const user = useUserStore((s) => s.user);

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [heroesLoading, setHeroesLoading] = useState(true);
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [participantLimit, setParticipantLimit] = useState(DEFAULT_MIN_PLAYERS);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      useUserStore.getState().fetchMe().catch(() => {
        // non-critical — mantém o campo editável mesmo sem o nome do usuário
      });
    }
  }, [user]);

  useEffect(() => {
    if (!name && !nameTouched) {
      const playerName = user?.name ?? '';
      setName(playerName ? `Mesa de ${playerName}` : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setCampaignLoading(true);
    setCampaignError(null);
    campaignApi
      .getDetail(campaignId)
      .then((data) => {
        if (cancelled) return;
        setCampaign(data);
        setParticipantLimit(data.min_players ?? DEFAULT_MIN_PLAYERS);
      })
      .catch((err) => {
        console.error('Failed to load campaign detail:', err);
        if (!cancelled) setCampaignError('Não foi possível carregar os dados da campanha.');
      })
      .finally(() => {
        if (!cancelled) setCampaignLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    setHeroesLoading(true);
    setHeroesError(null);
    heroApi
      .list()
      .then((data) => {
        if (!cancelled) setHeroes(data);
      })
      .catch((err) => {
        console.error('Failed to load heroes:', err);
        if (!cancelled) setHeroesError('Não foi possível carregar seus heróis.');
      })
      .finally(() => {
        if (!cancelled) setHeroesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const minPlayers = campaign?.min_players ?? DEFAULT_MIN_PLAYERS;
  const maxPlayers = campaign?.max_players ?? DEFAULT_MAX_PLAYERS;

  const nameError = useMemo(() => {
    if (!nameTouched) return null;
    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      return `Nome deve ter entre ${NAME_MIN_LENGTH} e ${NAME_MAX_LENGTH} caracteres.`;
    }
    return null;
  }, [name, nameTouched]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setNameTouched(true);
  }, []);

  const incrementLimit = useCallback(() => {
    setParticipantLimit((prev) => Math.min(prev + 1, maxPlayers));
  }, [maxPlayers]);

  const decrementLimit = useCallback(() => {
    setParticipantLimit((prev) => Math.max(prev - 1, minPlayers));
  }, [minPlayers]);

  const canSubmit =
    name.trim().length >= NAME_MIN_LENGTH &&
    name.trim().length <= NAME_MAX_LENGTH &&
    !!selectedHeroId &&
    !submitting;

  const submit = useCallback(async () => {
    setSubmitError(null);
    setNameTouched(true);

    if (name.trim().length < NAME_MIN_LENGTH || name.trim().length > NAME_MAX_LENGTH) {
      setSubmitError(`O nome da mesa deve ter entre ${NAME_MIN_LENGTH} e ${NAME_MAX_LENGTH} caracteres.`);
      return;
    }
    if (!selectedHeroId) {
      setSubmitError('Selecione um herói para continuar.');
      return;
    }
    if (participantLimit < minPlayers || participantLimit > maxPlayers) {
      setSubmitError(
        `O limite de participantes deve estar entre ${minPlayers} e ${maxPlayers}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const session = await sessionApi.create({
        campaign_id: campaignId,
        name: name.trim(),
        is_private: isPrivate,
        hero_id: selectedHeroId,
      });
      setLocation(`/app/sessions/${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setSubmitError('Não foi possível criar a sessão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }, [campaignId, name, isPrivate, selectedHeroId, participantLimit, minPlayers, maxPlayers, setLocation]);

  return {
    campaign,
    campaignLoading,
    campaignError,
    heroes,
    heroesLoading,
    heroesError,
    selectedHeroId,
    setSelectedHeroId,
    name,
    handleNameChange,
    nameError,
    isPrivate,
    setIsPrivate,
    participantLimit,
    minPlayers,
    maxPlayers,
    incrementLimit,
    decrementLimit,
    canSubmit,
    submitting,
    submitError,
    submit,
  };
}
