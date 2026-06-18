export const isWebView = () =>
  typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

// Envia comando para o host nativo (no-op em browser puro)
export const sendNativeMessage = (action: string, payload: unknown) => {
  if (isWebView()) {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({ action, payload }));
  }
};

// Armazenamento unificado: localStorage em browser, Secure Store nativo em WebView
export const secureStorage = {
  getItem: (key: string): string | null =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null,
  setItem: (key: string, value: string): void => {
    if (isWebView()) sendNativeMessage('SECURE_STORE_SET', { key, value });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (isWebView()) sendNativeMessage('SECURE_STORE_REMOVE', { key });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};
