const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const crypto = require('crypto');
const { verifyAccessToken } = require('../utils/jwt');

let sharedRateLimitStore;
let redisStoreInitAttempted = false;

const toRetryAfterSeconds = (resetTime) => {
  if (!(resetTime instanceof Date)) return null;
  const seconds = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const rateLimitResponse = (req, message) => {
  const retryAfterSeconds = toRetryAfterSeconds(req?.rateLimit?.resetTime);
  return {
    success: false,
    code: 'RATE_LIMITED',
    message,
    ...(retryAfterSeconds ? { retryAfterSeconds } : {})
  };
};

const getBearerToken = (req) => {
  const authHeader = String(req.headers?.authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 16);

const identityKeyGenerator = (req) => {
  const subnet = Number(process.env.RATE_LIMIT_IPV6_SUBNET || 56);
  const safeSubnet = Number.isFinite(subnet) ? subnet : 56;
  const ip = ipKeyGenerator(String(req.ip || ''), safeSubnet);
  
  if (req.user?.id) {
    return `${ip}:u:${String(req.user.id)}`;
  }

  const token = getBearerToken(req);
  if (!token) {
    return `${ip}:anon`;
  }

  try {
    const decoded = verifyAccessToken(token);
    if (decoded?.userId) {
      return `${ip}:u:${String(decoded.userId)}`;
    }
    return `${ip}:t:${hashToken(token)}`;
  } catch {
    return `${ip}:t:${hashToken(token)}`;
  }
};

const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json(rateLimitResponse(req, message));
};

const resolveRedisStore = () => {
  if (redisStoreInitAttempted) {
    return sharedRateLimitStore;
  }
  redisStoreInitAttempted = true;

  const redisUrl = String(process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL || '').trim();
  if (!redisUrl) {
    sharedRateLimitStore = null;
    return sharedRateLimitStore;
  }

  try {
    // Lazy-load Redis dependencies so non-Redis environments keep working.
    const Redis = require('ioredis');
    const { RedisStore } = require('rate-limit-redis');

    const redis = new Redis(redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });

    const prefix = String(process.env.RATE_LIMIT_REDIS_PREFIX || 'rl:');
    sharedRateLimitStore = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix
    });
  } catch (error) {
    sharedRateLimitStore = null;
    console.warn('Redis rate-limit store initialization failed, using in-memory store.', error?.message);
  }

  return sharedRateLimitStore;
};

const withDefaultConfig = (message) => {
  const config = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: identityKeyGenerator,
    handler: rateLimitHandler(message)
  };

  const store = resolveRedisStore();
  if (store) {
    config.store = store;
  }

  return config;
};

const isWebhookPath = (path) =>
  path.startsWith('/api/payments/webhook') || path.startsWith('/api/communication/call-status');

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  ...withDefaultConfig('Too many requests. Please try again later.'),
  skip: (req) => {
    const path = String(req.originalUrl || req.url || '');
    return path === '/health' || path === '/api/health' || isWebhookPath(path);
  }
});

const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || 5),
  ...withDefaultConfig('Too many login attempts. Please wait one minute and try again.'),
  skipSuccessfulRequests: true
});

const registrationLimiter = rateLimit({
  windowMs: Number(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS || 15),
  ...withDefaultConfig('Too many registration attempts. Please try again later.')
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  ...withDefaultConfig('Too many authentication requests. Please try again shortly.')
});

const otpVerifyLimiter = rateLimit({
  windowMs: Number(process.env.OTP_VERIFY_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.OTP_VERIFY_RATE_LIMIT_MAX_REQUESTS || 10),
  ...withDefaultConfig('Too many OTP verification attempts. Please wait and retry.'),
  skipSuccessfulRequests: true
});

const paymentMethodLimiter = rateLimit({
  windowMs: Number(process.env.PAYMENT_METHOD_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000),
  max: Number(process.env.PAYMENT_METHOD_RATE_LIMIT_MAX_REQUESTS || 20),
  ...withDefaultConfig('Too many payment method requests. Please try again later.')
});

const messagingLimiter = rateLimit({
  windowMs: Number(process.env.MESSAGING_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.MESSAGING_RATE_LIMIT_MAX_REQUESTS || 30),
  ...withDefaultConfig('Too many messaging requests. Please slow down.')
});

const webhookLimiter = rateLimit({
  windowMs: Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS || 300),
  ...withDefaultConfig('Webhook rate limit exceeded'),
  // Webhooks should be source-IP limited; caller auth tokens are not part of the contract.
  keyGenerator: (req) => {
    const subnet = Number(process.env.RATE_LIMIT_IPV6_SUBNET || 56);
    const safeSubnet = Number.isFinite(subnet) ? subnet : 56;
    return ipKeyGenerator(String(req.ip || ''), safeSubnet);
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registrationLimiter,
  authLimiter,
  otpVerifyLimiter,
  paymentMethodLimiter,
  messagingLimiter,
  webhookLimiter
};
