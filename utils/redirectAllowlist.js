const REDIRECT_ALLOWLIST = new Set([
  '/dashboard',
  '/dashboard/user',
  '/dashboard/provider',
  '/dashboard/admin',
  '/landing',
  '/auth',
  '/customer/home',
  '/provider/dashboard',
  '/admin/login'
]);

const normalizeRedirectPath = (value) => {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2048) return null;
  if (candidate.startsWith('//') || candidate.includes('\\')) return null;

  try {
    const parsed = new URL(candidate, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

const isAllowedRedirectPath = (value) => {
  const normalized = normalizeRedirectPath(value);
  if (!normalized) return false;
  const pathname = normalized.split('?')[0].split('#')[0];
  return REDIRECT_ALLOWLIST.has(pathname);
};

const sanitizeRedirectPath = (value, fallback = '/dashboard') => {
  const safeFallback = isAllowedRedirectPath(fallback) ? normalizeRedirectPath(fallback) : '/dashboard';
  if (!isAllowedRedirectPath(value)) return safeFallback;
  return normalizeRedirectPath(value);
};

module.exports = {
  REDIRECT_ALLOWLIST,
  sanitizeRedirectPath,
  isAllowedRedirectPath
};
