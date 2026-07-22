import { useLoadingStore } from '../../stores/loadingStore';
import './GlobalLoadingIndicator.css';

// Thin top bar that shows whenever at least one apiClient request is in
// flight (see api/client.ts). Mount once at the app root.
export function GlobalLoadingIndicator() {
  const isLoading = useLoadingStore((s) => s.count > 0);
  if (!isLoading) return null;
  return <div className="global-loading-bar" role="status" aria-label="Carregando" />;
}
