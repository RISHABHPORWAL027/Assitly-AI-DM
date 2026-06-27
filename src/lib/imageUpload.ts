import { postJson, type AuthHeaders } from './apiClient';

/** Resize/compress a data URL before upload (keeps payloads under proxy limits). */
export async function compressDataUrl(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function uploadAutomationImage(
  headers: AuthHeaders,
  dataUrl: string
): Promise<string> {
  const compressed = await compressDataUrl(dataUrl);
  const res = await postJson('/api/automations/upload-image', headers, { dataUrl: compressed });
  // Railway may not have redeployed yet — fall back to inline compressed base64 on save
  if (res.status === 404) {
    console.warn('[Upload] upload-image route unavailable — using compressed inline image on save');
    return compressed;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Image upload failed (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json?.url || typeof json.url !== 'string') {
    throw new Error('Image upload succeeded but no URL was returned');
  }
  return json.url;
}
