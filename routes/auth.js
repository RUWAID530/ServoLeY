const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { createOTP, verifyOTP } = require('../utils/otp');
const { sendSMSOTP, validatePhoneNumber } = require('../utils/sms');
const { sendEmailOTP, sendWelcomeEmail } = require('../utils/email');

// Development OTP utilities
const { createDevOTP, verifyDevOTP, sendDevSMSOTP, sendDevEmailOTP } = require('../utils/dev-otp');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register user
router.post('/register', [
  body('userType').isIn(['CUSTOMER', 'PROVIDER', 'ADMIN']).withMessage('Invalid user type'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  // Provider-specific validation
  body('businessName').if(body('userType').equals('PROVIDER')).notEmpty().withMessage('Business name is required for providers'),
  body('businessAddress').if(body('userType').equals('PROVIDER')).notEmpty().withMessage('Business address is required for providers'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      userType, 
      email, 
      phone, 
      firstName, 
      lastName,
      // Provider-specific fields
      businessName,
      businessAddress,
      providerType = 'FREELANCER', // Default to FREELANCER
      category,
      area,
      panNumber,
      aadhaarNumber,
      gstNumber,
      bankAccount,
      upiId,
      experience
    } = req.body;

    // Check if email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

    // Prepare user creation data
    const userData = {
      email,
      phone,
      userType,
      profile: {
        create: {
          firstName,
          lastName,
          address: userType === 'PROVIDER' ? businessAddress : undefined
        }
      },
      wallet: {
        create: {
          balance: 0
        }
      }
    };

    // Add provider data if registering as a provider
    if (userType === 'PROVIDER') {
      userData.provider = {
        create: {
          businessName,
          providerType,
          category: category || 'General',
          area: area || 'Not specified',
          address: businessAddress,
          panNumber: panNumber || 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          aadhaarNumber: aadhaarNumber || 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          gstNumber,
          bankAccount,
          upiId,
          isVerified: false,
          isActive: true,
          rating: 0,
          totalOrders: 0,
          isOnline: false
        }
      };
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      include: {
        profile: true,
        wallet: true,
        provider: true
      }
    });

    // Generate OTP and handle sending
    let code;
    
    // In development mode with bypass, generate a simple OTP
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
      code = '123456'; // Fixed OTP for development
      console.log(`🔓 Development mode: Using fixed OTP 123456 for user ${user.id}`);
    } else {
      // Production mode - generate and send OTP
      const { code: generatedCode, otp } = await createOTP(user.id, email ? 'EMAIL' : 'SMS');
      code = generatedCode;
      
      // Send OTP
      try {
        if (email) {
          await sendEmailOTP(email, code);
        } else if (phone) {
          const formattedPhone = validatePhoneNumber(phone);
          if (formattedPhone) {
            await sendSMSOTP(formattedPhone, code);
          }
        }
      } catch (error) {
        console.error('OTP sending failed:', error);
        // Continue with registration even if OTP sending fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your account with the OTP sent.',
      data: {
        userId: user.id,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Try to extract more specific error information
    let errorMessage = 'Registration failed';
    if (error.code === 'P2002') {
      errorMessage = 'A user with this email or phone already exists';
    } else if (error.code === 'P2025') {
      errorMessage = 'Record not found';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error,
        details: JSON.stringify(error, null, 2)
      })
    });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, code } = req.body;

    // Bypass OTP verification in development mode
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
      console.log(`🔓 Development mode: Bypassing OTP verification for user ${userId}`);
      // Any 6-digit code will work in development mode
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit code'
        });
      }
    } else {
      try {
        // Verify OTP in production mode
        const verification = await verifyOTP(userId, code);
    
        if (process.env.NODE_ENV !== 'development' || process.env.BYPASS_OTP !== 'true') {
          if (!verification.valid) {
            return res.status(400).json({
              success: false,
              message: verification.message
            });
          }
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
          success: false,
          message: 'OTP verification failed'
        });
      }
    }

    // Update user verification status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      include: {
        profile: true,
        provider: true,
        wallet: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Send welcome email if email is provided
    if (user.email && user.profile) {
      try {
        await sendWelcomeEmail(user.email, user.profile.firstName);
      } catch (error) {
        console.error('Welcome email failed:', error);
        // Continue even if welcome email fails
      }
    }

    res.json({
      success: true,
      message: 'Account verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          isVerified: user.isVerified,
          profile: user.profile,
          provider: user.provider,
          wallet: user.wallet
        }
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    let code;
    
    // In development mode with bypass, generate a simple OTP
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
      code = '123456'; // Fixed OTP for development
      console.log(`🔓 Development mode: Using fixed OTP 123456 for user ${user.id}`);
    } else {
      // Production mode - generate and send OTP
      const { code: generatedCode } = await createOTP(user.id, user.email ? 'EMAIL' : 'SMS');
      code = generatedCode;
      
      // Send OTP
      try {
        if (user.email) {
          await sendEmailOTP(user.email, code);
        } else if (user.phone) {
          const formattedPhone = validatePhoneNumber(user.phone);
          if (formattedPhone) {
            await sendSMSOTP(formattedPhone, code);
          }
        }
      } catch (error) {
        console.error('OTP sending failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP'
        });
      }
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// Login
router.post('/login', [
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      },
      include: {
        profile: true,
        provider: true,
        wallet: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    // Generate OTP for login
    let code;
    
    // In development mode with bypass, generate a simple OTP
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OTP === 'true') {
      code = '123456'; // Fixed OTP for development
      console.log(`🔓 Development mode: Using fixed OTP 123456 for user ${user.id}`);
    } else {
      // Production mode - generate and send OTP
      const { code: generatedCode } = await createOTP(user.id, email ? 'EMAIL' : 'SMS');
      code = generatedCode;
      
      // Send OTP
      try {
        if (email) {
          await sendEmailOTP(email, code);
        } else if (phone) {
          const formattedPhone = validatePhoneNumber(phone);
          if (formattedPhone) {
            await sendSMSOTP(formattedPhone, code);
          }
        }
      } catch (error) {
        console.error('OTP sending failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP'
        });
      }
    }

    res.json({
      success: true,
      message: 'OTP sent for login verification',
      data: {
        userId: user.id,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;


