/**
 * Helper to build the complete URL for static assets (like avatars)
 * by concatenating the backend address from environment variable when needed.
 */
export function getAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || '';
  // Remove trailing slash from base if present
  const cleanBase = baseUrl.replace(/\/$/, '');
  // Ensure leading slash for target url
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
}
