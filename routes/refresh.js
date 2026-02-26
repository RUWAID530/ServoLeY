const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../config/database');
const { authLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { validateRefreshSession, rotateRefreshSession, revokeUserSessions } = require('../utils/refreshSessions');

const router = express.Router();

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  userType: user.userType,
  isVerified: user.isVerified,
  profile: user.profiles || null,
  provider: user.providers || null,
  wallet: user.wallets || null
});

router.post(
  '/',
  authLimiter,
  strictBody([body('refreshToken').isString().isLength({ min: 20, max: 4096 })]),
  async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken || '').trim();
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Validate refresh session
    const session = await validateRefreshSession(refreshToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user_id },
      include: {
        profiles: true,
        providers: true,
        wallets: true
      }
    });

    if (!user || user.deletedAt || !user.isActive || user.isBlocked) {
      await revokeUserSessions(session.user_id);
      return res.status(401).json({
        success: false,
        message: 'Session is no longer valid'
      });
    }

    const payload = {
      userId: user.id,
      userType: user.userType
    };

    const newRefreshToken = signRefreshToken(payload);
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    
    // Rotate refresh session
    const rotated = await rotateRefreshSession(session, newRefreshToken, userAgent, ip);
    if (!rotated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to rotate session'
      });
    }

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: signAccessToken(payload),
        refreshToken: newRefreshToken,
        user: mapUser(user)
      }
    });
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

module.exports = router;
