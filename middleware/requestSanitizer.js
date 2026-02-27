const MAX_INPUT_LENGTH = Math.max(Number(process.env.MAX_INPUT_LENGTH || 4000), 256);
const MAX_INPUT_DEPTH = Math.max(Number(process.env.MAX_INPUT_DEPTH || 8), 2);
const MAX_ARRAY_ITEMS = Math.max(Number(process.env.MAX_ARRAY_ITEMS || 100), 10);
const MAX_OBJECT_KEYS = Math.max(Number(process.env.MAX_OBJECT_KEYS || 100), 20);
const MAX_AVATAR_INPUT_LENGTH = Math.max(Number(process.env.MAX_AVATAR_INPUT_LENGTH || 900000), 100000);
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const AVATAR_ENDPOINTS = ['/api/auth/me/avatar', '/api/profiles/avatar'];

// Capture raw body for webhook verification
const captureRawBody = (req, _res, buf) => {
  if (!buf || !buf.length) return;
  const path = String(req.originalUrl || req.url || '');
  if (path.startsWith('/api/payments/webhook') || path.startsWith('/api/communication/call-status')) {
    req.rawBody = Buffer.from(buf);
  }
};

const buildBadRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  return error;
};

const resolveStringLimit = (requestPath, valuePath) => {
  const matchesAvatarEndpoint = AVATAR_ENDPOINTS.some((endpoint) => requestPath.startsWith(endpoint));
  if (matchesAvatarEndpoint && valuePath === 'body.avatar') {
    return MAX_AVATAR_INPUT_LENGTH;
  }
  return MAX_INPUT_LENGTH;
};

const sanitizeString = (value, path, requestPath) => {
  const cleaned = String(value).replace(/\u0000/g, '').trim();
  if (cleaned.length > resolveStringLimit(requestPath, path)) {
    throw buildBadRequest(`${path} exceeds maximum allowed length`);
  }
  return cleaned;
};

const sanitizeNode = (value, path, depth, requestPath) => {
  if (depth > MAX_INPUT_DEPTH) {
    throw buildBadRequest(`${path} is nested too deeply`);
  }

  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeString(value, path, requestPath);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw buildBadRequest(`${path} must be a finite number`);
    return value;
  }
  if (typeof value === 'boolean') return value;

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) {
      throw buildBadRequest(`${path} exceeds maximum allowed array size`);
    }
    return value.map((item, index) => sanitizeNode(item, `${path}[${index}]`, depth + 1, requestPath));
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > MAX_OBJECT_KEYS) {
      throw buildBadRequest(`${path} has too many fields`);
    }

    const sanitizedObject = {};
    for (const key of keys) {
      if (DANGEROUS_KEYS.has(key)) {
        throw buildBadRequest(`${path}.${key} is not allowed`);
      }
      if (key.length > 64) {
        throw buildBadRequest(`${path}.${key} is too long`);
      }
      sanitizedObject[key] = sanitizeNode(value[key], `${path}.${key}`, depth + 1, requestPath);
    }
    return sanitizedObject;
  }

  throw buildBadRequest(`${path} contains unsupported value type`);
};

const sanitizeRequestInput = (req, _res, next) => {
  try {
    const requestPath = String(req.originalUrl || req.url || '');
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeNode(req.body, 'body', 0, requestPath);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeNode(req.query, 'query', 0, requestPath);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeNode(req.params, 'params', 0, requestPath);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  sanitizeRequestInput,
  captureRawBody
};
