/**
 * Type for authentication/authorization headers passed to the API.
 */
export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

/**
 * Helper to build the full URL for backend API calls.
 * Uses `VITE_BACKEND_URL` when set to a valid http(s) URL; otherwise same-origin `/api`
 * (Vercel rewrites `/api/*` → Railway — no env var needed in production).
 */
export function getBackendUrl(path: string): string {
  const raw = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/*$/, '') || '';
  if (!raw) return path;
  if (!/^https?:\/\//i.test(raw)) {
    console.warn('[API] Ignoring invalid VITE_BACKEND_URL (must start with http:// or https://):', raw);
    return path;
  }
  return `${raw}${path}`;
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
