import { useCallback, useEffect, useRef, useState } from 'react';
import { campaignApi } from '../api/services/campaign';
import { tagsApi } from '../api/services/tags';
import type { CampaignListItem, Tag } from '../types';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_LIMIT = 10;

export function useCampaignSelection() {
  const [search, setSearch] = useState('');
  const [levelMin, setLevelMin] = useState<number | null>(null);
  const [levelMax, setLevelMax] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    tagsApi.list().then(setTags).catch((err) => {
      console.error('Failed to load tags:', err);
    });
  }, []);

  const fetchCampaigns = useCallback(async (cursor?: string) => {
    const requestId = ++requestIdRef.current;
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await campaignApi.list({
        q: search || undefined,
        level_start: levelMin ?? undefined,
        level_end: levelMax ?? undefined,
        tag: selectedTags.length ? selectedTags : undefined,
        cursor,
        limit: PAGE_LIMIT,
      });
      if (requestId !== requestIdRef.current) return;

      // Trata defensivamente caso o backend ainda não retorne o formato com cursor.
      const items = Array.isArray(response) ? response : response.items ?? [];
      const next = Array.isArray(response) ? null : response.next_cursor ?? null;

      setCampaigns((prev) => (cursor ? [...prev, ...items] : items));
      setNextCursor(next);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      if (requestId === requestIdRef.current) {
        setError('Não foi possível carregar as campanhas.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [search, levelMin, levelMax, selectedTags]);

  // Debounce de buscas dinâmicas — reinicia a listagem quando filtros mudam.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [fetchCampaigns]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore || loading) return;
    fetchCampaigns(nextCursor);
  }, [nextCursor, loadingMore, loading, fetchCampaigns]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  return {
    search,
    setSearch,
    levelMin,
    setLevelMin,
    levelMax,
    setLevelMax,
    tags,
    selectedTags,
    toggleTag,
    campaigns,
    loading,
    loadingMore,
    error,
    hasMore: !!nextCursor,
    loadMore,
  };
}
