import { useLocation } from 'wouter';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AuthModal({ visible, onClose }: Props) {
  const [, setLocation] = useLocation();

  if (!visible) return null;

  function goRegister() {
    onClose();
    setLocation('/register');
  }

  function goLogin() {
    onClose();
    setLocation('/login');
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-handle" />
        <h2 className="auth-modal-title">Para isso você precisa de uma conta</h2>
        <button className="auth-modal-btn primary" onClick={goRegister}>
          Cadastrar
        </button>
        <button className="auth-modal-btn secondary" onClick={goLogin}>
          Entrar
        </button>
      </div>
    </div>
  );
}
