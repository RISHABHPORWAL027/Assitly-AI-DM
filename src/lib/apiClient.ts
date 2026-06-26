export type AuthHeaders = Record<string, string>;

export function jsonHeaders(headers: AuthHeaders): AuthHeaders {
  return { ...headers, 'Content-Type': 'application/json' };
}

export async function postJson(
  url: string,
  headers: AuthHeaders,
  body: unknown
): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: jsonHeaders(headers),
    body: JSON.stringify(body),
  });
}
