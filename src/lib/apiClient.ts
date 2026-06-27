/**
 * Type for authentication/authorization headers passed to the API.
 */
export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

/**
 * Helper to build the full URL for backend API calls.
 * Reads `VITE_BACKEND_URL` from the environment (injected by Vite).
 * If not set, defaults to the same origin (useful for local dev where Vite proxies to the Express server).
 */
export function getBackendUrl(path: string): string {
  const base = import.meta.env.VITE_BACKEND_URL?.replace(/\/*$/, '') || '';
  return base ? `${base}${path}` : path;
}

function serializeJsonBody(body: unknown): string {
  try {
    return JSON.stringify(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not serialize request body';
    throw new Error(`Request payload is too large or invalid: ${message}`);
  }
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
export async function postJson(url: string, headers: AuthHeaders = {}, body: unknown): Promise<Response> {
  const fullUrl = getBackendUrl(url);
  const payload = serializeJsonBody(body);
  if (payload.length > 4_000_000) {
    console.warn(`[API] Large POST ${url}: ${(payload.length / 1024 / 1024).toFixed(1)}MB`);
  }
  return fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: payload,
  });
}
