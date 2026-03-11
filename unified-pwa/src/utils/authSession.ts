const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getActiveSessionId = () => {
  return localStorage.getItem('currentSessionId') || localStorage.getItem('sessionId') || 'default';
};

export const getStoredToken = (): string | null => {
  const userId = localStorage.getItem('userId');
  const sessionId = getActiveSessionId();

  if (userId) {
    const sessionToken = localStorage.getItem(`token_${userId}_${sessionId}`);
    const sessionAccessToken = localStorage.getItem(`accessToken_${userId}_${sessionId}`);
    if (sessionToken) return sessionToken;
    if (sessionAccessToken) return sessionAccessToken;
  }

  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

export const setAuthSession = (data: {
  accessToken?: string;
  refreshToken?: string;
  user?: { id?: string; userType?: string } | null;
}) => {
  const accessToken = String(data?.accessToken || '').trim();
  const refreshToken = String(data?.refreshToken || '').trim();
  const userId = String(data?.user?.id || localStorage.getItem('userId') || '').trim();
  const userType = String(data?.user?.userType || localStorage.getItem('userType') || '').trim();
  const sessionId = getActiveSessionId();

  if (sessionId && !localStorage.getItem('currentSessionId')) {
    localStorage.setItem('currentSessionId', sessionId);
  }

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('token', accessToken);
    if (userId) {
      localStorage.setItem(`token_${userId}_${sessionId}`, accessToken);
      localStorage.setItem(`accessToken_${userId}_${sessionId}`, accessToken);
    }
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  if (userId) {
    localStorage.setItem('userId', userId);
  }

  if (userType) {
    localStorage.setItem('userType', userType);
  }
};

export const clearAuthSession = () => {
  const userId = localStorage.getItem('userId');
  const sessionId = getActiveSessionId();
  if (userId) {
    localStorage.removeItem(`token_${userId}_${sessionId}`);
    localStorage.removeItem(`accessToken_${userId}_${sessionId}`);
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
};

const isExpiringSoon = (token: string, thresholdSeconds = 30) => {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= thresholdSeconds;
};

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = String(localStorage.getItem('refreshToken') || '').trim();
      if (!refreshToken) return null;

      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) return null;

      const payload = await response.json();
      const data = payload?.data || {};
      const accessToken = String(data?.accessToken || '').trim();
      const newRefreshToken = String(data?.refreshToken || '').trim();
      const user = data?.user || null;

      if (!accessToken) return null;

      setAuthSession({
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        user
      });

      return accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const getFreshAccessToken = async (): Promise<string | null> => {
  const token = getStoredToken();
  if (!token) return null;
  if (!isExpiringSoon(token)) return token;
  return (await refreshAccessToken()) || token;
};

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  allowRetry = true
): Promise<Response> => {
  const token = await getFreshAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401 || !allowRetry) return response;

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) return response;

  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
};

