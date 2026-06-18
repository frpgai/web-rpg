import { Redirect } from 'wouter';
import { useAuthStore } from '../../stores/authStore';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Redirect to="/login" />;
  return <>{children}</>;
}
