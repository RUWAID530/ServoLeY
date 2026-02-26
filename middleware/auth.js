const { prisma } = require('../config/database');
const { verifyAccessToken } = require('../utils/jwt');

const loadUser = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      profiles: true,
      providers: true,
      wallets: true,
      notification_preferences: true
    }
  });

  if (!user) return null;
  if (user.deletedAt) return null;
  if (!user.isActive || user.isBlocked) return null;

  return {
    ...user,
    profile: user.profiles || null,
    provider: user.providers || null,
    wallet: user.wallets || null,
    notificationPreferences: user.notification_preferences || null
  };
};

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await loadUser(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Check token version to enforce logout invalidation
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    return next();
  };
};

const requireVerification = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required'
    });
  }
  return next();
};

const requireProviderVerification = (req, res, next) => {
  if (req.user?.userType !== 'PROVIDER') {
    return res.status(403).json({
      success: false,
      message: 'Provider access required'
    });
  }

  if (!req.user?.provider?.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Provider verification required'
    });
  }

  return next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVerification,
  requireProviderVerification
};
