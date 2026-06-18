import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useRegister } from '../../hooks/useRegister';

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const {
    form,
    setField,
    acceptedTerms,
    setAcceptedTerms,
    marketingOptIn,
    setMarketingOptIn,
    errors,
    generalError,
    isLoading,
    isGoogleLoading,
    passwordStrength,
    submit,
    renderGoogleButton,
    showTermsModal,
    confirmGoogleTerms,
    dismissTermsModal,
  } = useRegister();

  const [passwordFocused, setPasswordFocused] = useState(false);
  // Terms modal local state for Google SSO registration
  const [googleTermsAccepted, setGoogleTermsAccepted] = useState(false);
  const [googleMarketingOptIn, setGoogleMarketingOptIn] = useState(false);

  useEffect(() => {
    // Render Google Sign-up button
    renderGoogleButton('google-signup-btn');
  }, [renderGoogleButton]);

  const strengthConfig = {
    fraca: { label: 'Fraca', color: '#ef4444', segments: 1 },
    boa: { label: 'Boa', color: '#f59e0b', segments: 2 },
    forte: { label: 'Forte', color: '#22c55e', segments: 3 },
  };

  const { label: strengthLabel, color: strengthColor, segments: strengthSegments } = strengthConfig[passwordStrength];

  return (
    <div className="auth-scroll-container">
      <div className="auth-container">
        <button onClick={() => setLocation('/')} className="auth-back-btn">
          ← Voltar
        </button>

        <h2 className="auth-heading">Crie sua conta</h2>

        <form onSubmit={submit} className="auth-form">
          <div className="input-field-wrapper">
            <label className="input-field-label">Nome</label>
            <div className={`input-field-row ${errors.name ? 'error' : ''}`}>
              <input
                type="text"
                placeholder="Seu nome de guerreiro"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="input-field-text"
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="input-field-error">{errors.name}</span>}
          </div>

          <div className="input-field-wrapper">
            <label className="input-field-label">Email</label>
            <div className={`input-field-row ${errors.email ? 'error' : ''}`}>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="input-field-text"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="input-field-error">{errors.email}</span>}
          </div>

          <div className="input-field-wrapper">
            <label className="input-field-label">Senha</label>
            <div className={`input-field-row ${errors.password ? 'error' : ''}`}>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres, 1 número"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                className="input-field-text"
                autoComplete="new-password"
              />
            </div>
            {errors.password && <span className="input-field-error">{errors.password}</span>}
          </div>

          {passwordFocused && form.password.length > 0 && (
            <div className="password-strength-wrapper">
              <div className="password-strength-bars">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="password-strength-bar"
                    style={{
                      backgroundColor: i <= strengthSegments ? strengthColor : '#3a3a3a',
                    }}
                  />
                ))}
              </div>
              <span className="password-strength-label" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          )}

          {generalError && <p className="auth-general-error">{generalError}</p>}

          <div className="checkbox-row" onClick={() => setAcceptedTerms(!acceptedTerms)}>
            <div className={`checkbox-box ${acceptedTerms ? 'checked' : ''}`}>
              {acceptedTerms && <span className="checkbox-check">✓</span>}
            </div>
            <span className="checkbox-label">
              Li e aceito os <span className="link-highlight underline">Termos de Uso</span> e{' '}
              <span className="link-highlight underline">Política de Privacidade</span>
            </span>
          </div>

          <div className="checkbox-row" onClick={() => setMarketingOptIn(!marketingOptIn)}>
            <div className={`checkbox-box ${marketingOptIn ? 'checked' : ''}`}>
              {marketingOptIn && <span className="checkbox-check">✓</span>}
            </div>
            <span className="checkbox-label">
              Aceito receber novidades e promoções por email (opcional)
            </span>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={!acceptedTerms || isLoading || isGoogleLoading}
          >
            {isLoading ? <div className="loading-spinner-small" /> : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-divider">─────────── ou ───────────</div>

        <div className="google-btn-wrapper">
          <div id="google-signup-btn" className="google-signin-container"></div>
          {isGoogleLoading && <div className="loading-spinner-google" />}
        </div>

        <div className="auth-footer">
          <button onClick={() => setLocation('/login')} className="auth-footer-link">
            Já tem conta? <span className="link-highlight">Entrar</span>
          </button>
        </div>
      </div>

      {/* Terms confirmation modal for Google authentication */}
      {showTermsModal && (
        <div className="auth-modal-backdrop" onClick={dismissTermsModal}>
          <div className="auth-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-handle" />
            <h2 className="auth-modal-title">Bem-vindo ao BARD!</h2>
            <p className="auth-modal-subtitle">Para continuar, confirme:</p>

            <div className="auth-modal-scroll">
              <div
                className="checkbox-row"
                onClick={() => setGoogleTermsAccepted(!googleTermsAccepted)}
              >
                <div className={`checkbox-box ${googleTermsAccepted ? 'checked' : ''}`}>
                  {googleTermsAccepted && <span className="checkbox-check">✓</span>}
                </div>
                <span className="checkbox-label">
                  Li e aceito os <span className="link-highlight underline">Termos de Uso</span> e{' '}
                  <span className="link-highlight underline">Política de Privacidade</span>
                </span>
              </div>

              <div
                className="checkbox-row"
                onClick={() => setGoogleMarketingOptIn(!googleMarketingOptIn)}
              >
                <div className={`checkbox-box ${googleMarketingOptIn ? 'checked' : ''}`}>
                  {googleMarketingOptIn && <span className="checkbox-check">✓</span>}
                </div>
                <span className="checkbox-label">
                  Aceito receber novidades e promoções por email (opcional)
                </span>
              </div>
            </div>

            <button
              className="auth-modal-btn primary"
              disabled={!googleTermsAccepted}
              onClick={() => confirmGoogleTerms(googleMarketingOptIn)}
            >
              Continuar
            </button>
            <button className="auth-modal-btn secondary" onClick={dismissTermsModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
