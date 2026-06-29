import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { AuthModal } from '../components/landing/AuthModal';
import { useAuthStore } from '../stores/authStore';
import type { AvailableCampaign } from '../types';

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxaN_1Wxk7TcZEoO29ZEQyo2GrkcNw6D1cDA_OrhPKb18VhRpdYQITkMmy-Rqfm9vDdvlnYRaFG1nCVa0Z5YhVWzZvTMooL-0rSLMB_v3bmgnia9T241khcpD4FYDhE4FZ8PJ19nCYMUmuF71L-Z6fAV6j2MdDdkcwhL_4tc-hk-V6BuIHAh4u-5iqcv7Z6rN2Nz1rEg_WGMuTaHaMSg74GC4vL4UJ2oDIU8hfdfHpdFqNGi5BDFSm7myG7vo7FyeqZCiYIiX-m0SY';

type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearToken = useAuthStore((s) => s.clearToken);
  const [modalVisible, setModalVisible] = useState(false);
  const [adventures, setAdventures] = useState<AvailableCampaign[]>([]);
  const [loadingAdventures, setLoadingAdventures] = useState(true);
  const [adventureError, setAdventureError] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoRef = useRef<{ audio_url: string; duration_seconds: number; title: string } | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const cleanApiUrl = apiUrl.replace(/\/$/, '');

    fetch(`${cleanApiUrl}/api/v1/campaigns/available`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AvailableCampaign[]) => {
        setAdventures(data);
        setLoadingAdventures(false);
      })
      .catch(() => {
        setAdventureError(true);
        setLoadingAdventures(false);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  async function handlePlayPress() {
    if (audioState === 'playing') {
      audioRef.current?.pause();
      setAudioState('paused');
      return;
    }
    if (audioState === 'paused') {
      audioRef.current?.play().catch(() => setAudioState('error'));
      setAudioState('playing');
      return;
    }

    setAudioState('loading');
    try {
      if (!demoRef.current) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const cleanApiUrl = apiUrl.replace(/\/$/, '');
        const res = await fetch(`${cleanApiUrl}/narration/demo`);
        if (!res.ok) throw new Error();
        demoRef.current = await res.json();
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(demoRef.current!.audio_url);
      audioRef.current = audio;
      audio.play().catch(() => setAudioState('error'));
      setAudioState('playing');

      audio.onended = () => {
        setAudioState('idle');
      };

      audio.onerror = () => {
        setAudioState('error');
        setTimeout(() => setAudioState('idle'), 3000);
      };
    } catch {
      setAudioState('error');
      setTimeout(() => setAudioState('idle'), 3000);
    }
  }

  function requireAuth() {
    if (!isAuthenticated) {
      setModalVisible(true);
    } else {
      setLocation('/app/dashboard');
    }
  }

  return (
    <div className="landing-root">
      {/* Header */}
      <header className="landing-header">
        <h1 className="landing-logo">BARD</h1>
        {isAuthenticated ? (
          <button className="landing-login-btn" onClick={clearToken}>
            Sair
          </button>
        ) : (
          <button className="landing-login-btn" onClick={() => setLocation('/login')}>
            Entrar / Cadastrar
          </button>
        )}
      </header>

      <div className="landing-scroll-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-card">
            <img src={HERO_IMAGE} className="hero-image" alt="Narrativa Viva" />
            <div className="hero-gradient" />
            <div className="hero-content">
              <button 
                className={`play-btn ${audioState === 'idle' || audioState === 'paused' ? 'pulsing' : ''}`}
                onClick={handlePlayPress}
              >
                {audioState === 'loading' ? (
                  <div className="loading-spinner" />
                ) : (
                  <span className="play-arrow">
                    {audioState === 'playing' ? '⏸' : '▶'}
                  </span>
                )}
              </button>
              <div className="hero-text-block">
                <h2 className="hero-title">Sinta a narrativa viva</h2>
                <div className={`waveform ${audioState === 'playing' ? 'playing' : ''}`}>
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                </div>
              </div>
              {audioState === 'error' ? (
                <p className="hero-error">ERRO AO CARREGAR DEMO</p>
              ) : (
                <p className="hero-subtitle">OUÇA A IMERSÃO</p>
              )}
            </div>
          </div>
        </section>

        {/* Explore Campanhas */}
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">Explore Campanhas</h3>
          </div>
          {loadingAdventures && (
            <div className="card-list-wrapper">
              <div className="card-list">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            </div>
          )}
          {adventureError && (
            <p className="error-text">Não foi possível carregar. Tente novamente.</p>
          )}
          {!loadingAdventures && !adventureError && (
            <div className="card-list-wrapper">
              <div className="card-list">
                {adventures.map((item) => (
                  <button key={item.id} className="card" onClick={requireAuth}>
                    <div className="card-image-wrap">
                      {item.cover_url ? (
                        <img src={item.cover_url} className="card-image" alt={item.name} />
                      ) : (
                        <div className="card-image-fallback" />
                      )}
                      <div className="card-image-gradient" />
                      {item.ai_narration && (
                        <div className="ai-badge">
                          <p className="ai-badge-text">✦ Narração por IA Ativa</p>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <p className="card-level">NÍVEL {item.level_range}</p>
                      <h4 className="card-title">{item.name}</h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Soundboard Block */}
        <section className="soundboard-section">
          <div className="soundboard-card">
            <div className="soundboard-icon">
              <span className="soundboard-icon-text">≋</span>
            </div>
            <div className="soundboard-text-block">
              <h3 className="soundboard-title">Ajudante de Mesa Síncrono</h3>
              <p className="soundboard-desc">
                Acesse o painel de sons e efeitos para sua mesa ao vivo agora. Sincronize o clima com sua narrativa em tempo real.
              </p>
            </div>
            <a href="https://bard.app/soundboard" className="soundboard-btn" target="_blank" rel="noopener noreferrer">
              ABRIR SOUNDBOARD GRÁTIS ↗
            </a>
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="landing-bottom-bar">
        <button className="cta-btn" onClick={() => setLocation(isAuthenticated ? '/app/dashboard' : '/register')}>
          <span className="cta-btn-icon">👤</span>
          <span className="cta-btn-text">
            {isAuthenticated ? 'ENTRAR NO PAINEL' : 'CRIAR MEU PRIMEIRO HERÓI'}
          </span>
        </button>
      </div>

      <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </div>
  );
}
