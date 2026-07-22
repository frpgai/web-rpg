import ky, { isHTTPError } from 'ky';
import { useAuthStore } from '../stores/authStore';
import { useLoadingStore } from '../stores/loadingStore';

export const apiClient = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (requestOrObj: any) => {
        useLoadingStore.getState().increment();
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
        useLoadingStore.getState().decrement();
        const res = requestOrObj?.response || response || requestOrObj;
        if (!res) return;
        if (res.status === 401) {
          useAuthStore.getState().clearToken();
          window.location.hash = '#/login';
        }
        return res;
      },
    ],
    // afterResponse already fires (and decrements) for any request that got
    // an HTTP response, even an error status — only decrement here for
    // errors with no response at all (network failure, timeout), which
    // never reach afterResponse.
    beforeError: [
      (state) => {
        if (!isHTTPError(state.error)) {
          useLoadingStore.getState().decrement();
        }
        return state.error;
      },
    ],
  },
});
