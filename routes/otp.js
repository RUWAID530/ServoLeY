const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { createOTP, verifyOTP } = require('../utils/otp');
const { sendSMSOTP, validatePhoneNumber } = require('../utils/sms');
const { sendEmailOTP } = require('../utils/email');

const router = express.Router();

// Send OTP
router.post('/send', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('type').isIn(['SMS', 'EMAIL']).withMessage('Type must be SMS or EMAIL')
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

    const { userId, type } = req.body;

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

    // Generate OTP
    const { code } = await createOTP(userId, type);

    // Send OTP
    try {
      if (type === 'EMAIL' && user.email) {
        await sendEmailOTP(user.email, code);
      } else if (type === 'SMS' && user.phone) {
        const formattedPhone = validatePhoneNumber(user.phone);
        if (formattedPhone) {
          await sendSMSOTP(formattedPhone, code);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `User does not have ${type.toLowerCase()} configured`
        });
      }
    } catch (error) {
      console.error('OTP sending failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/verify', [
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

    // Verify OTP
    const verification = await verifyOTP(userId, code);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Get OTP status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp) {
      return res.json({
        success: true,
        data: {
          hasActiveOTP: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasActiveOTP: true,
        expiresAt: otp.expiresAt,
        type: otp.type
      }
    });

  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP status'
    });
  }
});

// Clean expired OTPs (admin endpoint)
router.post('/clean', async (req, res) => {
  try {
    const { cleanExpiredOTPs } = require('../utils/otp');
    const cleanedCount = await cleanExpiredOTPs();

    res.json({
      success: true,
      message: `Cleaned ${cleanedCount} expired OTPs`
    });

  } catch (error) {
    console.error('Clean OTPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean expired OTPs'
    });
  }
});

module.exports = router;


