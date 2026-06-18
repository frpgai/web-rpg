import { useState, useCallback } from 'react';

import { useLocation } from 'wouter';
import { postRegister, postGoogleAuth } from '../api/services/auth';
import { useAuthStore } from '../stores/authStore';
import { systemService } from '../api/services/systemService';
import { useSystemStore } from '../stores/systemStore';

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

export type PasswordStrength = 'fraca' | 'boa' | 'forte';

type RegisterState = {
  form: RegisterForm;
  setField: (field: keyof RegisterForm, value: string) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  marketingOptIn: boolean;
  setMarketingOptIn: (v: boolean) => void;
  errors: FieldErrors;
  generalError: string;
  isLoading: boolean;
  isGoogleLoading: boolean;
  passwordStrength: PasswordStrength;
  submit: (e?: React.FormEvent) => Promise<void>;
  renderGoogleButton: (elementId: string) => void;
  // Google terms confirmation modal state
  showTermsModal: boolean;
  pendingGoogleToken: string | null;
  confirmGoogleTerms: (marketingOptIn: boolean) => Promise<void>;
  dismissTermsModal: () => void;
};

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length >= 12 && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) return 'forte';
  if (password.length >= 8 && /\d/.test(password)) return 'boa';
  return 'fraca';
}

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

export function useRegister(): RegisterState {
  const [, setLocation] = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const setField = useCallback((field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError('');
  }, []);

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    if (form.name.length > 50) newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    if (!form.password || form.password.length < 8) newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    if (!/\d/.test(form.password)) newErrors.password = 'Senha deve conter pelo menos um número';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      const resp = await postRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        accepted_terms: acceptedTerms,
        marketing_opt_in: marketingOptIn,
      });
      setAuth(resp.token, resp.user);
      await loadDefaultSystem();
      setLocation('/');
    } catch (err: unknown) {
      console.error('Registration failed error:', err);
      const status = getHttpStatus(err);
      if (status === 409) {
        setGeneralError('Este email já está cadastrado.');
      } else if (status === 400) {
        setGeneralError('Verifique os campos e tente novamente.');
      } else {
        setGeneralError('Sem conexão. Verifique sua internet.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [form, acceptedTerms, marketingOptIn, setAuth, setLocation]);

  const handleCredentialResponse = useCallback((response: any) => {
    if (response.credential) {
      setPendingGoogleToken(response.credential);
      setShowTermsModal(true);
    } else {
      setGeneralError('Não foi possível entrar com Google. Tente novamente.');
    }
  }, []);

  const confirmGoogleTerms = useCallback(async (marketingOpt: boolean) => {
    if (!pendingGoogleToken) return;
    setShowTermsModal(false);
    setIsGoogleLoading(true);
    try {
      const resp = await postGoogleAuth({
        id_token: pendingGoogleToken,
        accepted_terms: true,
        marketing_opt_in: marketingOpt,
      });
      setAuth(resp.token, resp.user);
      await loadDefaultSystem();
      setLocation('/');
    } catch {
      setGeneralError('Não foi possível entrar com Google. Tente novamente.');
    } finally {
      setPendingGoogleToken(null);
      setIsGoogleLoading(false);
    }
  }, [pendingGoogleToken, setAuth, setLocation]);

  const dismissTermsModal = useCallback(() => {
    setShowTermsModal(false);
    setPendingGoogleToken(null);
  }, []);

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
            text: 'signup_with',
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
    acceptedTerms,
    setAcceptedTerms,
    marketingOptIn,
    setMarketingOptIn,
    errors,
    generalError,
    isLoading,
    isGoogleLoading,
    passwordStrength: getPasswordStrength(form.password),
    submit,
    renderGoogleButton,
    showTermsModal,
    pendingGoogleToken,
    confirmGoogleTerms,
    dismissTermsModal,
  };
}

function getHttpStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { status?: number } }).response;
    return r?.status ?? null;
  }
  return null;
}
