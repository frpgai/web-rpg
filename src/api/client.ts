import ky from 'ky';
import { useAuthStore } from '../stores/authStore';

export const apiClient = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().token;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      ({ response }) => {
        if (response.status === 401) {
          useAuthStore.getState().clearToken();
          window.location.hash = '#/login';
        }
        return response;
      },
    ],
  },
});
