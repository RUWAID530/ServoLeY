// ========================================
// JWT-BASED AUTHENTICATION + RBAC
// Production-Ready Middleware
// ========================================

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Role-based access control configuration
const ROLES = {
  USER: 'USER',
  PROVIDER: 'PROVIDER', 
  ADMIN: 'ADMIN'
};

const PERMISSIONS = {
  // User permissions
  USER_DASHBOARD: ['USER'],
  USER_PROFILE: ['USER'],
  
  // Provider permissions
  PROVIDER_DASHBOARD: ['PROVIDER'],
  PROVIDER_PROFILE: ['PROVIDER'],
  PROVIDER_SERVICES: ['PROVIDER'],
  PROVIDER_ORDERS: ['PROVIDER'],
  PROVIDER_WALLET: ['PROVIDER'],
  
  // Admin permissions
  ADMIN_DASHBOARD: ['ADMIN'],
  ADMIN_USERS: ['ADMIN'],
  ADMIN_SYSTEM: ['ADMIN']
};

// Middleware to verify JWT and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      console.log('🔒 No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token verified for user:', decoded.userId);
    
    // Get user from database with fresh data
    const user = await prisma.users.findUnique({
      where: { 
        id: decoded.userId,
        status: 'ACTIVE' // Only active users
      },
      include: {
        profile: true,
        provider: true
      }
    });

    if (!user) {
      console.log('❌ User not found or inactive:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Attach user and permissions to request
    req.user = {
      ...user,
      permissions: PERMISSIONS[user.role] || []
    };

    console.log('✅ User authenticated:', { 
      id: user.id, 
      role: user.role, 
      permissions: req.user.permissions 
    });

    next();
  } catch (error) {
    console.error('🔐 Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authentication failed'
    });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      console.log('🚫 Access denied:', { 
        userRole, 
        requiredRoles: allowedRoles 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    console.log('✅ Role access granted:', { userRole, allowedRoles });
    next();
  };
};

// Permission-based access control middleware
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.log('🚫 Permission denied:', { 
        userRole: req.user.role,
        userPermissions,
        requiredPermissions 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    console.log('✅ Permission access granted');
    next();
  };
};

// Helper function to check if user has specific role
const hasRole = (user, role) => {
  return user && user.role === role;
};

// Helper function to check if user has specific permission
const hasPermission = (user, permission) => {
  return user && user.permissions && user.permissions.includes(permission);
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  hasRole,
  hasPermission,
  ROLES,
  PERMISSIONS
};
