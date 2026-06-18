import ky from 'ky';
import { useAuthStore } from '../stores/authStore';

export const apiClient = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (requestOrObj: any) => {
        const request = requestOrObj?.request || requestOrObj;
        if (!request || !request.headers) return;
        const token = useAuthStore.getState().token;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (requestOrObj: any, _options?: any, response?: any) => {
        const res = requestOrObj?.response || response || requestOrObj;
        if (!res) return;
        if (res.status === 401) {
          useAuthStore.getState().clearToken();
          window.location.hash = '#/login';
        }
        return res;
      },
    ],
  },
});
