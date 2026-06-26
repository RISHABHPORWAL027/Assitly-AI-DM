import type { AuthHeaders } from './apiClient';

/**
 * Helper to build the full URL for backend API calls.
 * Reads `VITE_BACKEND_URL` from the environment (injected by Vite).
 * If not set, defaults to the same origin (useful for local dev where Vite proxies to the Express server).
 */
function getBackendUrl(path: string): string {
  const base = import.meta.env.VITE_BACKEND_URL?.replace(/\/*$/, '') || '';
  // If base is empty, just use the relative path (Vite dev server proxies to localhost:3001)
  return base ? `${base}${path}` : path;
}

/**
 * GET request returning the raw `Response` object.
 */
export async function getJson(url: string, headers: AuthHeaders = {}): Promise<Response> {
  const fullUrl = getBackendUrl(url);
  return fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * POST request that sends JSON and returns the raw `Response`.
 */
export async function postJson(url: string, headers: AuthHeaders = {}, body: any): Promise<Response> {
  const fullUrl = getBackendUrl(url);
  return fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Type for authentication/authorization headers passed to the API.
 */
export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}
