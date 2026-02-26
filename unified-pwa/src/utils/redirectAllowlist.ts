const REDIRECT_EXACT_ALLOWLIST = new Set<string>([
  '/',
  '/landing',
  '/auth',
  '/role',
  '/forgot-password',
  '/login-signup',
  '/customersignup',
  '/providersignup',
  '/provider-signup',
  '/provider-dashboard',
  '/customer-dashboard',
  '/profile',
  '/escrow-demo',
  '/unified',
  '/Landing/View',
  '/unauthorized'
]);

const REDIRECT_PREFIX_ALLOWLIST = ['/customer', '/provider', '/admin', '/vendor'];

const stripQueryAndHash = (path: string): string => {
  const queryIndex = path.indexOf('?');
  const hashIndex = path.indexOf('#');
  const cutAt = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .reduce((min, index) => Math.min(min, index), path.length);
  return path.slice(0, cutAt);
};

const matchesPrefixAllowlist = (pathname: string): boolean =>
  REDIRECT_PREFIX_ALLOWLIST.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const isAllowedPath = (path: string): boolean => {
  const pathname = stripQueryAndHash(path);
  return REDIRECT_EXACT_ALLOWLIST.has(pathname) || matchesPrefixAllowlist(pathname);
};

const normalizeRedirectTarget = (target: string): string | null => {
  const value = target.trim();
  if (!value || value.length > 2048) return null;
  if (value.startsWith('//') || value.includes('\\')) return null;

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(value, baseOrigin);
    if (parsed.origin !== baseOrigin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

export const sanitizeRedirectPath = (target: unknown, fallback = '/landing'): string => {
  const normalizedFallback = normalizeRedirectTarget(String(fallback)) || '/landing';
  const safeFallback = isAllowedPath(normalizedFallback) ? normalizedFallback : '/landing';

  if (typeof target !== 'string') return safeFallback;
  const normalizedTarget = normalizeRedirectTarget(target);
  if (!normalizedTarget) return safeFallback;
  if (!isAllowedPath(normalizedTarget)) return safeFallback;
  return normalizedTarget;
};
