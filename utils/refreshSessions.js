const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');
const { hashToken, compareToken, getRefreshTokenExpirySeconds } = require('./jwt');

const createRefreshSession = async (userId, refreshToken, userAgent = null, ip = null) => {
  try {
    const decoded = require('./jwt').verifyRefreshToken(refreshToken);
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + (getRefreshTokenExpirySeconds() * 1000));
    
    const session = await prisma.auth_refresh_sessions.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        jti: decoded.jti,
        token_hash: tokenHash,
        user_agent: userAgent,
        ip: ip,
        expires_at: expiresAt
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating refresh session:', error);
    throw error;
  }
};

const validateRefreshSession = async (refreshToken) => {
  try {
    const decoded = require('./jwt').verifyRefreshToken(refreshToken);
    
    const session = await prisma.auth_refresh_sessions.findFirst({
      where: {
        jti: decoded.jti,
        revoked_at: null,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return null;
    }

    const isValid = await compareToken(refreshToken, session.token_hash);
    if (!isValid) {
      // Token replay detected - revoke all user sessions
      await revokeUserSessions(session.user_id);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error validating refresh session:', error);
    return null;
  }
};

const rotateRefreshSession = async (oldSession, newRefreshToken, userAgent = null, ip = null) => {
  try {
    const newDecoded = require('./jwt').verifyRefreshToken(newRefreshToken);
    const newTokenHash = await hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + (getRefreshTokenExpirySeconds() * 1000));

    await prisma.$transaction(async (tx) => {
      // Revoke old session
      await tx.auth_refresh_sessions.update({
        where: { id: oldSession.id },
        data: {
          revoked_at: new Date(),
          rotated_to_jti: newDecoded.jti
        }
      });

      // Create new session
      await tx.auth_refresh_sessions.create({
        data: {
          id: randomUUID(),
          user_id: oldSession.user_id,
          jti: newDecoded.jti,
          token_hash: newTokenHash,
          user_agent: userAgent,
          ip: ip,
          expires_at: expiresAt
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Error rotating refresh session:', error);
    return false;
  }
};

const revokeSession = async (sessionId) => {
  try {
    await prisma.auth_refresh_sessions.update({
      where: { id: sessionId },
      data: { revoked_at: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
};

const revokeUserSessions = async (userId) => {
  try {
    await prisma.auth_refresh_sessions.updateMany({
      where: { 
        user_id: userId,
        revoked_at: null
      },
      data: { revoked_at: new Date() }
    });
    return true;
  } catch (error) {
    console.error('Error revoking user sessions:', error);
    return false;
  }
};

const cleanupExpiredSessions = async () => {
  try {
    const result = await prisma.auth_refresh_sessions.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
};

module.exports = {
  createRefreshSession,
  validateRefreshSession,
  rotateRefreshSession,
  revokeSession,
  revokeUserSessions,
  cleanupExpiredSessions
};
