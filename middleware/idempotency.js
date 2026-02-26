const crypto = require('crypto');
const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');

const TTL_HOURS = Math.max(Number(process.env.IDEMPOTENCY_TTL_HOURS || 24), 1);

const stableValue = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableValue(value[key]);
      return acc;
    }, {});
};

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const buildRequestHash = (req) => {
  const payload = {
    method: req.method,
    path: req.baseUrl + req.path,
    params: stableValue(req.params || {}),
    query: stableValue(req.query || {}),
    body: stableValue(req.body || {})
  };
  return sha256(JSON.stringify(payload));
};

const safeParseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

const requireIdempotency = (scope) => {
  return async (req, res, next) => {
    try {
      const key = String(req.headers['idempotency-key'] || '').trim();
      if (!key) {
        return res.status(400).json({
          success: false,
          message: 'Idempotency-Key header is required'
        });
      }

      if (key.length < 8 || key.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Idempotency-Key format'
        });
      }

      const userId = String(req.user?.id || '').trim();
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for idempotent endpoint'
        });
      }

      const requestHash = buildRequestHash(req);
      const lockId = randomUUID();

      const inserted = await prisma.$executeRaw`
        INSERT INTO "idempotency_keys"
          ("id", "scope", "userId", "key", "requestHash", "status", "createdAt", "expiresAt")
        VALUES
          (${lockId}, ${scope}, ${userId}, ${key}, ${requestHash}, 'IN_PROGRESS', NOW(), NOW() + (${TTL_HOURS}::int * interval '1 hour'))
        ON CONFLICT ("scope", "userId", "key") DO NOTHING
      `;

      if (inserted === 0) {
        const rows = await prisma.$queryRaw`
          SELECT "id", "status", "requestHash", "responseCode", "responseBody"
          FROM "idempotency_keys"
          WHERE "scope" = ${scope}
            AND "userId" = ${userId}
            AND "key" = ${key}
          LIMIT 1
        `;
        const existing = rows?.[0];

        if (!existing) {
          return res.status(409).json({
            success: false,
            message: 'Idempotency conflict'
          });
        }

        if (existing.requestHash !== requestHash) {
          return res.status(409).json({
            success: false,
            message: 'Idempotency-Key reuse with different request payload is not allowed'
          });
        }

        if (existing.status === 'COMPLETED') {
          const responseBody = safeParseJson(existing.responseBody);
          return res.status(Number(existing.responseCode || 200)).json(
            responseBody || {
              success: true,
              message: 'Request already processed'
            }
          );
        }

        return res.status(409).json({
          success: false,
          message: 'Duplicate request is already in progress'
        });
      }

      const originalJson = res.json.bind(res);
      let responseBody = null;
      res.json = (body) => {
        responseBody = body;
        return originalJson(body);
      };

      res.on('finish', () => {
        const finalStatus = res.statusCode >= 200 && res.statusCode < 400 ? 'COMPLETED' : 'FAILED';
        prisma.$executeRaw`
          UPDATE "idempotency_keys"
          SET "status" = ${finalStatus},
              "responseCode" = ${res.statusCode},
              "responseBody" = ${JSON.stringify(responseBody || null)}::jsonb
          WHERE "id" = ${lockId}
        `.catch(() => {});
      });

      return next();
    } catch (error) {
      console.error('Idempotency middleware error:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: 'Idempotency layer unavailable'
      });
    }
  };
};

module.exports = {
  requireIdempotency
};
