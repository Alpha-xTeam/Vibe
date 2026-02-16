const rawApiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

// Clean trailing slash to prevent double slashes in requests (e.g., base//endpoint)
// which causes CORS preflight issues on production servers.
export const API_URL = rawApiUrl.endsWith('/') 
  ? rawApiUrl.slice(0, -1) 
  : rawApiUrl;
