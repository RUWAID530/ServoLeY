const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

export const resolveMediaUrl = (value?: string | null, fallback = '') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  if (raw.startsWith('data:') || raw.startsWith('blob:') || /^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return `${API_BASE}${raw}`;
  }

  return `${API_BASE}/${raw}`;
};
