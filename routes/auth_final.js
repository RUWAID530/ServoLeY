const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { randomUUID, randomInt } = require('crypto');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter, registrationLimiter, otpVerifyLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { createRefreshSession, validateRefreshSession, revokeSession, revokeUserSessions } = require('../utils/refreshSessions');
const { encryptField } = require('../utils/encryption');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const BCRYPT_ROUNDS = Math.min(Math.max(Number(process.env.JWT_BCRYPT_ROUNDS || 12), 10), 14);

const normalizePhone = (phone) => {
  if (!phone) return null;
  const normalized = String(phone).replace(/[^\d+]/g, '');
  return normalized || null;
};

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  userType: user.userType,
  isVerified: user.isVerified,
  isActive: user.isActive,
  isBlocked: user.isBlocked,
  profile: user.profiles || null,
  provider: user.providers || null,
  wallet: user.wallets || null
});

const issueTokens = (user) => {
  const payload = {
    userId: user.id,
    userType: user.userType,
    tokenVersion: user.tokenVersion || 0
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
};

const safeAuthError = {
  success: false,
  message: 'Invalid credentials'
};

router.post(
  '/register',
  registrationLimiter,
  upload.single('profileImage'),
  strictBody([
    body('userType').isIn(['CUSTOMER', 'PROVIDER']),
    body('email').isEmail().isLength({ max: 254 }),
    body('phone').optional().isString().isLength({ min: 10, max: 15 }),
    body('password').isString().isLength({ min: 8, max: 128 }),
    body('firstName').isString().trim().isLength({ min: 1, max: 60 }),
    body('lastName').isString().trim().isLength({ min: 1, max: 60 }),
    body('businessName').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('businessAddress').optional().isString().trim().isLength({ min: 1, max: 240 }),
    body('serviceCategory').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('category').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('yearsExperience').optional().isInt({ min: 0, max: 80 }),
    body('experience').optional().isInt({ min: 0, max: 80 }),
    body('area').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('panNumber').optional().isString().trim().isLength({ min: 8, max: 20 }),
    body('aadhaarNumber').optional().isString().trim().isLength({ min: 8, max: 20 }),
    body('gstNumber').optional().isString().trim().isLength({ min: 5, max: 20 }),
    body('bankAccount').optional().isString().trim().isLength({ min: 6, max: 30 }),
    body('upiId').optional().isString().trim().isLength({ min: 3, max: 100 }),
    body('paymentMethods').optional().isArray({ max: 5 }),
    body('paymentMethods.*.type').optional().isIn(['UPI', 'CARD', 'NET_BANKING']),
    body('paymentMethods.*.provider').optional().isString().trim().isLength({ max: 80 }),
    body('paymentMethods.*.upiId').optional().isString().trim().isLength({ max: 100 }),
    body('paymentMethods.*.cardNumber').optional().isString().trim().isLength({ max: 32 }),
    body('paymentMethods.*.cardName').optional().isString().trim().isLength({ max: 80 }),
    body('paymentMethods.*.expiryMonth').optional().isString().trim().isLength({ min: 1, max: 2 }),
    body('paymentMethods.*.expiryYear').optional().isString().trim().isLength({ min: 2, max: 4 }),
    body('paymentMethods.*.last4').optional().isString().trim().isLength({ min: 4, max: 4 })
  ]),
  async (req, res, next) => {
    try {
      const validationResponse = validate(req, res);
      if (validationResponse) return validationResponse;

      const userType = String(req.body.userType).toUpperCase();
      
      // Block public ADMIN registration
      if (userType === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admin self-registration is disabled'
        });
      }
      
      const email = String(req.body.email).trim().toLowerCase();
      const phone = normalizePhone(req.body.phone);
      const password = String(req.body.password || '');
      const firstName = String(req.body.firstName || '').trim();
      const lastName = String(req.body.lastName || '').trim();
      const businessName = String(req.body.businessName || '').trim();
      const businessAddress = String(req.body.businessAddress || '').trim();
      const category = String(req.body.serviceCategory || req.body.category || 'General').trim();
      const yearsExperience = Number(req.body.yearsExperience || req.body.experience || 0);

      if (userType === 'PROVIDER' && (!businessName || !businessAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Business name and business address are required for providers'
        });
      }

      const existingUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or phone'
        });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const now = new Date();

      const createdUserId = await prisma.$transaction(async (tx) => {
        const user = await tx.users.create({
          data: {
            id: randomUUID(),
            email,
            phone,
            userType,
            isVerified: false,
            isActive: true,
            isBlocked: false,
            updatedAt: now
          }
        });

        await tx.profiles.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName,
            lastName,
            address: userType === 'PROVIDER' ? businessAddress : null,
            passwordHash,
            createdAt: now,
            updatedAt: now
          }
        });

        await tx.wallets.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            balance: 0,
            createdAt: now,
            updatedAt: now
          }
        });

        if (userType === 'PROVIDER') {
          await tx.providers.create({
            data: {
              id: randomUUID(),
              userId: user.id,
              businessName,
              providerType: 'FREELANCER',
              category,
              area: String(req.body.area || 'Not specified'),
              address: businessAddress,
              panNumber: encryptField(req.body.panNumber || `TEMP${randomInt(10000000, 99999999)}`),
              aadhaarNumber: encryptField(req.body.aadhaarNumber || `TEMP${randomInt(10000000, 99999999)}`),
              gstNumber: req.body.gstNumber ? encryptField(req.body.gstNumber) : null,
              bankAccount: req.body.bankAccount ? encryptField(req.body.bankAccount) : null,
              upiId: req.body.upiId ? encryptField(req.body.upiId) : null,
              isVerified: false,
              isActive: true,
              rating: 0,
              totalOrders: 0,
              isOnline: false,
              updatedAt: now
            }
          });
        }

        if (Array.isArray(req.body.paymentMethods) && req.body.paymentMethods.length > 0) {
          for (const [index, method] of req.body.paymentMethods.entries()) {
            await tx.user_payment_methods.create({
              data: {
                id: randomUUID(),
                userId: user.id,
                type: String(method.type || 'UPI').toUpperCase(),
                provider: method.provider ? String(method.provider) : null,
                upiId: method.upiId ? String(method.upiId) : null,
                cardNumber: method.cardNumber ? String(method.cardNumber) : null,
                cardName: method.cardName ? String(method.cardName) : null,
                expiryMonth: method.expiryMonth ? String(method.expiryMonth) : null,
                expiryYear: method.expiryYear ? String(method.expiryYear) : null,
                last4: method.last4 ? String(method.last4) : null,
                isDefault: index === 0,
                isActive: true,
                updatedAt: now
              }
            });
          }
        }

        await tx.users.update({
          where: { id: user.id },
          data: {
            updatedAt: now,
            ...(userType === 'PROVIDER' && yearsExperience > 0 ? { isVerified: false } : {})
          }
        });

        return user.id;
      });

      const user = await prisma.users.findUnique({
        where: { id: createdUserId },
        include: {
          profiles: true,
          providers: true,
          wallets: true
        }
      });

      const tokens = issueTokens(user);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          ...tokens,
          user: mapUser(user)
        }
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or phone'
        });
      }
      return next(error);
    }
  }
);

router.post(
  '/login',
  loginLimiter,
  strictBody([
    body('email').optional().isEmail().isLength({ max: 254 }),
    body('phone').optional().isString().isLength({ min: 10, max: 15 }),
    body('password').isString().isLength({ min: 1, max: 128 }),
    body('userType').isIn(['CUSTOMER', 'PROVIDER', 'ADMIN'])
  ]),
  async (req, res, next) => {
    try {
      const validationResponse = validate(req, res);
      if (validationResponse) return validationResponse;

      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
      const phone = normalizePhone(req.body.phone);
      const userType = String(req.body.userType || '').toUpperCase();
      const password = String(req.body.password || '');

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      const user = await prisma.users.findFirst({
        where: {
          userType,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        },
        include: {
          profiles: true,
          providers: true,
          wallets: true
        }
      });

      if (!user || !user.profiles?.passwordHash) {
        return res.status(401).json(safeAuthError);
      }

      const isPasswordValid = await bcrypt.compare(password, user.profiles.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json(safeAuthError);
      }

      if (!user.isActive || user.isBlocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is not available'
        });
      }

      const tokens = issueTokens(user);
      
      // Create refresh session
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.connection.remoteAddress;
      await createRefreshSession(user.id, tokens.refreshToken, userAgent, ip);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          ...tokens,
          user: mapUser(user)
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: mapUser(req.user)
    }
  });
});

router.put(
  '/me',
  authenticateToken,
  strictBody([
    body('email').optional().isEmail().isLength({ max: 254 }),
    body('phone').optional().isString().isLength({ min: 10, max: 15 }),
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('address').optional({ values: 'null' }).isString().trim().isLength({ max: 240 }),
    body('pincode').optional({ values: 'null' }).isString().trim().isLength({ max: 20 }),
    body('city').optional({ values: 'null' }).isString().trim().isLength({ max: 80 }),
    body('state').optional({ values: 'null' }).isString().trim().isLength({ max: 80 }),
    body('country').optional({ values: 'null' }).isString().trim().isLength({ max: 80 })
  ]),
  async (req, res, next) => {
  try {
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;
    const phone = req.body.phone ? normalizePhone(req.body.phone) : undefined;
    const now = new Date();

    if (email || phone) {
      await prisma.users.update({
        where: { id: req.user.id },
        data: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          updatedAt: now
        }
      });
    }

    await prisma.profiles.upsert({
      where: { userId: req.user.id },
      update: {
        ...(req.body.firstName ? { firstName: String(req.body.firstName).trim() } : {}),
        ...(req.body.lastName ? { lastName: String(req.body.lastName).trim() } : {}),
        ...(req.body.address !== undefined ? { address: req.body.address ? String(req.body.address) : null } : {}),
        ...(req.body.pincode !== undefined ? { pincode: req.body.pincode ? String(req.body.pincode) : null } : {}),
        ...(req.body.city !== undefined ? { city: req.body.city ? String(req.body.city) : null } : {}),
        ...(req.body.state !== undefined ? { state: req.body.state ? String(req.body.state) : null } : {}),
        ...(req.body.country !== undefined ? { country: req.body.country ? String(req.body.country) : 'India' } : {}),
        updatedAt: now
      },
      create: {
        id: randomUUID(),
        userId: req.user.id,
        firstName: String(req.body.firstName || 'User'),
        lastName: String(req.body.lastName || ''),
        address: req.body.address ? String(req.body.address) : null,
        pincode: req.body.pincode ? String(req.body.pincode) : null,
        city: req.body.city ? String(req.body.city) : null,
        state: req.body.state ? String(req.body.state) : null,
        country: req.body.country ? String(req.body.country) : 'India',
        updatedAt: now
      }
    });

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        profiles: true,
        providers: true,
        wallets: true
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: mapUser(user) }
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Email or phone already in use'
      });
    }
    return next(error);
  }
});

router.put(
  '/me/avatar',
  authenticateToken,
  strictBody([body('avatar').isString().trim().isLength({ min: 1, max: 200000 })]),
  async (req, res, next) => {
  try {
    const avatar = String(req.body.avatar || '').trim();
    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar is required'
      });
    }

    await prisma.profiles.upsert({
      where: { userId: req.user.id },
      update: { avatar, updatedAt: new Date() },
      create: {
        id: randomUUID(),
        userId: req.user.id,
        firstName: req.user.profile?.firstName || 'User',
        lastName: req.user.profile?.lastName || '',
        avatar,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar }
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/me/avatar', authenticateToken, async (req, res, next) => {
  try {
    await prisma.profiles.update({
      where: { userId: req.user.id },
      data: {
        avatar: null,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me/security', authenticateToken, async (req, res) => {
  const ipAddress = req.headers['x-forwarded-for']
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
    : req.socket?.remoteAddress || 'unknown';

  return res.json({
    success: true,
    data: {
      security: {
        accountVerified: !!req.user.isVerified,
        accountBlocked: !!req.user.isBlocked,
        passwordLastChangedAt: req.user.profile?.updatedAt || null,
        activeSessions: [
          {
            id: 'current-session',
            label: 'Current session',
            ipAddress,
            userAgent: String(req.headers['user-agent'] || 'unknown'),
            lastActiveAt: new Date().toISOString(),
            isCurrent: true
          }
        ]
      }
    }
  });
});

router.post(
  '/change-password',
  strictBody([
    authenticateToken,
    body('currentPassword').isString().isLength({ min: 1, max: 128 }),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[a-z]/)
      .matches(/[0-9]/)
      .matches(/[^A-Za-z0-9]/)
      .isLength({ max: 128 })
  ]),
  async (req, res, next) => {
    try {
      const validationResponse = validate(req, res);
      if (validationResponse) return validationResponse;

      const currentPassword = String(req.body.currentPassword || '');
      const newPassword = String(req.body.newPassword || '');

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }

      const profile = await prisma.profiles.findUnique({
        where: { userId: req.user.id }
      });

      if (!profile?.passwordHash) {
        return res.status(400).json({
          success: false,
          message: 'Password is not configured for this account'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, profile.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await prisma.profiles.update({
        where: { userId: req.user.id },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      });

      await prisma.users.update({
        where: { id: req.user.id },
        data: { updatedAt: new Date() }
      });

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/forgot-password',
  otpVerifyLimiter,
  strictBody([
    body('phone').isString().isLength({ min: 10, max: 15 }),
    body('userType').isIn(['CUSTOMER', 'PROVIDER', 'ADMIN'])
  ]),
  async (req, res, next) => {
    try {
      const validationResponse = validate(req, res);
      if (validationResponse) return validationResponse;

      const phone = normalizePhone(req.body.phone);
      const userType = String(req.body.userType || '').toUpperCase();

      const user = await prisma.users.findFirst({
        where: {
          phone,
          userType
        }
      });

      // Always return same response to prevent enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this phone number, an OTP will be sent'
        });
      }

      const code = String(randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otps.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          code,
          type: 'PASSWORD_RESET',
          isUsed: false,
          expiresAt,
          createdAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'OTP generated successfully',
        data: {
          phone,
          otpExpiresIn: '10 minutes',
          ...(process.env.NODE_ENV !== 'production' ? { otp: code } : {})
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/reset-password',
  otpVerifyLimiter,
  strictBody([
    body('phone').isString().isLength({ min: 10, max: 15 }),
    body('otp').isString().isLength({ min: 6, max: 6 }),
    body('newPassword').isString().isLength({ min: 8, max: 128 }),
    body('confirmPassword').isString().isLength({ min: 8, max: 128 }),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword)
  ]),
  async (req, res, next) => {
    try {
      const validationResponse = validate(req, res);
      if (validationResponse) return validationResponse;

      const phone = normalizePhone(req.body.phone);
      const otp = String(req.body.otp || '');
      const newPassword = String(req.body.newPassword || '');

      const user = await prisma.users.findFirst({
        where: {
          phone
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Invalid OTP or phone number'
        });
      }

      const validOtp = await prisma.otps.findFirst({
        where: {
          userId: user.id,
          code: otp,
          type: 'PASSWORD_RESET',
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!validOtp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      await prisma.$transaction([
        prisma.otps.update({
          where: { id: validOtp.id },
          data: { isUsed: true }
        }),
        prisma.profiles.update({
          where: { userId: user.id },
          data: {
            passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
            updatedAt: new Date()
          }
        }),
        prisma.users.update({
          where: { id: user.id },
          data: { updatedAt: new Date() }
        })
      ]);

      return res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', authenticateToken, strictBody([
  body('refreshToken').optional().isString().isLength({ min: 20, max: 4096 })
]), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Revoke specific refresh session
      const session = await validateRefreshSession(refreshToken);
      if (session && session.user_id === req.user.id) {
        await revokeSession(session.id);
      }
    } else {
      // Revoke all user sessions
      await revokeUserSessions(req.user.id);
    }
    
    // Optionally increment token version to invalidate all access tokens
    await prisma.users.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } }
    });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;
