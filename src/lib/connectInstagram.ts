import { auth } from './firebase';

declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options?: { config_id?: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export interface ConnectInstagramResult {
  igId: string;
  igName: string;
  username: string;
  profilePic: string;
}

export function initMetaSdk(): void {
  const appId = import.meta.env.VITE_META_APP_ID;
  if (!appId) return;

  const init = () => {
    window.FB?.init({
      appId,
      cookie: true,
      xfbml: true,
      version: 'v21.0',
    });
  };

  if (window.FB) {
    init();
  } else {
    window.fbAsyncInit = init;
  }
}

export function connectInstagramViaMeta(
  getAuthHeaders: () => Promise<Record<string, string>>,
  userId?: string
): Promise<ConnectInstagramResult | null> {
  return new Promise((resolve, reject) => {
    const fb = window.FB;
    if (!fb) {
      reject(new Error('Meta SDK not loaded yet. Please refresh and try again.'));
      return;
    }

    fb.login(
      (response) => {
        if (!response.authResponse) {
          resolve(null);
          return;
        }

        (async () => {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/auth/meta', {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accessToken: response.authResponse!.accessToken,
                userId: userId || auth.currentUser?.uid,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              reject(new Error(data.error || 'Failed to connect Instagram account.'));
              return;
            }
            const firstConfig = data.configs?.[0];
            resolve({
              igId: firstConfig?.instagramAccountId || '',
              igName: firstConfig?.instagramName || firstConfig?.pageName || '',
              username: firstConfig?.instagramUsername || '',
              profilePic: firstConfig?.profilePictureUrl || '',
            });
          } catch (err) {
            reject(err);
          }
        })();
      },
      { config_id: import.meta.env.VITE_META_CONFIG_ID }
    );
  });
}
