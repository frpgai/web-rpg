import { useState, useCallback } from 'react';

import { useLocation } from 'wouter';
import { postLogin, postGoogleAuth } from '../api/services/auth';
import { useAuthStore } from '../stores/authStore';
import { systemService } from '../api/services/systemService';
import { useSystemStore } from '../stores/systemStore';

type LoginForm = {
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof LoginForm, string>>;

type LoginState = {
  form: LoginForm;
  setField: (field: keyof LoginForm, value: string) => void;
  errors: FieldErrors;
  generalError: string;
  isLoading: boolean;
  isGoogleLoading: boolean;
  submit: (e?: React.FormEvent) => Promise<void>;
  renderGoogleButton: (elementId: string) => void;
};

async function loadDefaultSystem() {
  try {
    const systems = await systemService.list();
    if (systems.length === 1) {
      useSystemStore.getState().setCurrentSystem(systems[0]);
    }
  } catch {
    // non-critical — ignore errors
  }
}

export function useLogin(): LoginState {
  const [, setLocation] = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const setField = useCallback((field: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError('');
  }, []);

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.email) newErrors.email = 'Email é obrigatório';
    if (!form.password) newErrors.password = 'Senha é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const resp = await postLogin({ email: form.email, password: form.password });
      setAuth(resp.token, resp.user);
      await loadDefaultSystem();
      setLocation('/');
    } catch (err: unknown) {
      console.error('Login failed error:', err);
      const status = getHttpStatus(err);
      if (status === 401) {
        setGeneralError('Email ou senha incorretos');
      } else if (status === 429) {
        setGeneralError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setGeneralError('Sem conexão. Verifique sua internet.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [form, setAuth, setLocation]);

  const handleCredentialResponse = useCallback(async (response: any) => {
    setIsGoogleLoading(true);
    setGeneralError('');
    try {
      const resp = await postGoogleAuth({
        id_token: response.credential,
        accepted_terms: true,
        marketing_opt_in: false,
      });
      setAuth(resp.token, resp.user);
      await loadDefaultSystem();
      setLocation('/');
    } catch (err) {
      setGeneralError('Não foi possível entrar com Google. Tente novamente.');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [setAuth, setLocation]);

  const renderGoogleButton = useCallback((elementId: string) => {
    const initGoogle = () => {
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      const google = (window as any).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id,
        callback: handleCredentialResponse,
      });

      // Executa após o layout inicial para obter a largura real do container
      setTimeout(() => {
        const btnContainer = document.getElementById(elementId);
        if (btnContainer) {
          const availableWidth = btnContainer.clientWidth;
          // Restringe a largura aos limites permitidos pela API do Google (200px - 400px)
          const buttonWidth = Math.max(200, Math.min(400, availableWidth || 320));

          google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: buttonWidth,
            text: 'signin_with',
            logo_alignment: 'left',
            shape: 'pill',
          });
        }
      }, 50);
    };

    if ((window as any).google) {
      initGoogle();
    } else {
      const scriptTag = document.createElement('script');
      scriptTag.id = 'google-gsi-script';
      scriptTag.src = 'https://accounts.google.com/gsi/client';
      scriptTag.async = true;
      scriptTag.defer = true;
      scriptTag.onload = initGoogle;
      document.body.appendChild(scriptTag);
    }
  }, [handleCredentialResponse]);

  return {
    form,
    setField,
    errors,
    generalError,
    isLoading,
    isGoogleLoading,
    submit,
    renderGoogleButton,
  };
}

function getHttpStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { status?: number } }).response;
    return r?.status ?? null;
  }
  return null;
}
