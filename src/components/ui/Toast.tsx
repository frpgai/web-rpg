import { useEffect } from 'react';
import './Toast.css';

type Props = {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
};

export function Toast({ message, onDismiss, duration = 2500 }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="ui-toast" role="status">
      <span className="ui-toast-text">{message}</span>
    </div>
  );
}
