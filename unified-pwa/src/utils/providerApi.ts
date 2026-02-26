const DEFAULT_API_BASE = 'http://localhost:8086';

const parseBase = (value: string) => String(value || '').replace(/\/$/, '');

export const getProviderAuthToken = () => {
  const userId = localStorage.getItem('userId');
  const sessionId = localStorage.getItem('currentSessionId') || 'default';
  return (
    localStorage.getItem(`token_${userId}_${sessionId}`) ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
};

export const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const buildApiCandidates = () => {
  const configured = parseBase(import.meta.env.VITE_API_URL || '');
  const defaults = [DEFAULT_API_BASE, 'http://localhost:8084', 'http://localhost:8083'];
  const all = [configured, ...defaults].filter(Boolean).map(parseBase);
  return Array.from(new Set(all));
};

export const providerFetchWithFallback = async (
  path: string,
  token: string,
  options: RequestInit = {}
) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpoints = buildApiCandidates().map((base) => `${base}${normalizedPath}`);
  endpoints.push(normalizedPath);
  let lastError: any = null;

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });

      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error. Backend not running or wrong port.');
};

export const getApiErrorMessage = (payload: any, fallback: string) => {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (first?.msg) return String(first.msg);
    if (first?.message) return String(first.message);
  }
  return payload?.message || fallback;
};
