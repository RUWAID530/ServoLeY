const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const MAX_TOKEN_SECONDS = 7 * 24 * 60 * 60;

const unitToSeconds = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60
};

const parseDurationToSeconds = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return Math.floor(numeric);
  }

  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * (unitToSeconds[unit] || 1);
};

const clampExpiry = (value, fallbackSeconds) => {
  const parsed = parseDurationToSeconds(value);
  const seconds = parsed && parsed > 0 ? parsed : fallbackSeconds;
  return Math.min(seconds, MAX_TOKEN_SECONDS);
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || getJwtSecret();
const getPreviousJwtSecret = () => String(process.env.JWT_SECRET_PREVIOUS || '').trim();
const getPreviousJwtRefreshSecret = () =>
  String(process.env.JWT_REFRESH_SECRET_PREVIOUS || process.env.JWT_SECRET_PREVIOUS || '').trim();

const getAccessTokenExpirySeconds = () => clampExpiry(process.env.JWT_EXPIRES_IN, 15 * 60);
const getRefreshTokenExpirySeconds = () => clampExpiry(process.env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60);

const signAccessToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: getAccessTokenExpirySeconds() });

const signRefreshToken = (payload) => {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, getJwtRefreshSecret(), { expiresIn: getRefreshTokenExpirySeconds() });
};

const verifyWithFallback = (token, primarySecret, fallbackSecret) => {
  try {
    return jwt.verify(token, primarySecret);
  } catch (error) {
    if (!fallbackSecret || error?.name === 'TokenExpiredError') {
      throw error;
    }
    return jwt.verify(token, fallbackSecret);
  }
};

const verifyAccessToken = (token) =>
  verifyWithFallback(token, getJwtSecret(), getPreviousJwtSecret());
const verifyRefreshToken = (token) =>
  verifyWithFallback(token, getJwtRefreshSecret(), getPreviousJwtRefreshSecret());

module.exports = {
  MAX_TOKEN_SECONDS,
  parseDurationToSeconds,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpirySeconds,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken: async (token) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
  },
  compareToken: bcrypt.compare
};
