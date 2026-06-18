import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLogin } from '../../hooks/useLogin';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const {
    form,
    setField,
    errors,
    generalError,
    isLoading,
    isGoogleLoading,
    submit,
    renderGoogleButton,
  } = useLogin();

  useEffect(() => {
    // Render Google Sign-in button
    renderGoogleButton('google-signin-btn');
  }, [renderGoogleButton]);

  return (
    <div className="auth-scroll-container">
      <div className="auth-container">
        <button onClick={() => setLocation('/')} className="auth-back-btn">
          ← Voltar
        </button>

        <h2 className="auth-heading">Bem-vindo de volta</h2>

        <form onSubmit={submit} className="auth-form">
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
                placeholder="Sua senha"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                className="input-field-text"
                autoComplete="current-password"
              />
            </div>
            {errors.password && <span className="input-field-error">{errors.password}</span>}
          </div>

          {generalError && <p className="auth-general-error">{generalError}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? <div className="loading-spinner-small" /> : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider">─────────── ou ───────────</div>

        <div className="google-btn-wrapper">
          <div id="google-signin-btn" className="google-signin-container"></div>
          {isGoogleLoading && <div className="loading-spinner-google" />}
        </div>

        <div className="auth-footer">
          <button onClick={() => setLocation('/register')} className="auth-footer-link">
            Não tem conta? <span className="link-highlight">Cadastre-se</span>
          </button>
          <button className="auth-footer-link secondary">
            Esqueceu a senha?
          </button>
        </div>
      </div>
    </div>
  );
}
