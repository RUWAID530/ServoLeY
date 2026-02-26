const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();


router.use((req, res, next) => {
  console.log('🔥 profiles route hit:', req.method, req.originalUrl);
  next();
});

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update profile
router.put('/', [
  authenticateToken,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('pincode').optional().isPostalCode('IN').withMessage('Invalid pincode'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('country').optional().isString().withMessage('Country must be a string')
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

    const { firstName, lastName, address, pincode, city, state, country } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(address && { address }),
        ...(pincode && { pincode }),
        ...(city && { city }),
        ...(state && { state }),
        ...(country && { country })
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Upload avatar
// Note: for now we accept a string (URL or data URL) and store it in `Profile.avatar`.
// This makes avatar updates work end-to-end without requiring a full file storage integration.
router.post('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Avatar is required'
      });
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { avatar }
    });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { profile }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar'
    });
  }
});

// Provider: Get provider profile
router.get('/provider', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    res.json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider profile'
    });
  }
});

// Provider: Create/Update provider profile
router.post('/provider', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('providerType').isIn(['FREELANCER', 'STORE']).withMessage('Invalid provider type'),
  body('category').notEmpty().withMessage('Category is required'),
  body('area').notEmpty().withMessage('Area is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('panNumber').isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters'),
  body('aadhaarNumber').isLength({ min: 12, max: 12 }).withMessage('Aadhaar number must be 12 digits'),
  body('gstNumber').optional().isLength({ min: 15, max: 15 }).withMessage('GST number must be 15 characters'),
  body('bankAccount').optional().isString().withMessage('Bank account must be a string'),
  body('upiId').optional().isString().withMessage('UPI ID must be a string')
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
      businessName,
      providerType,
      category,
      area,
      address,
      panNumber,
      aadhaarNumber,
      gstNumber,
      bankAccount,
      upiId
    } = req.body;

    // Check if provider profile already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { userId: req.user.id }
    });

    let provider;
    if (existingProvider) {
      // Update existing provider
      provider = await prisma.provider.update({
        where: { userId: req.user.id },
        data: {
          businessName,
          providerType,
          category,
          area,
          address,
          panNumber,
          aadhaarNumber,
          gstNumber,
          bankAccount,
          upiId
        }
      });
    } else {
      // Create new provider
      provider = await prisma.provider.create({
        data: {
          userId: req.user.id,
          businessName,
          providerType,
          category,
          area,
          address,
          panNumber,
          aadhaarNumber,
          gstNumber,
          bankAccount,
          upiId
        }
      });
    }

    res.json({
      success: true,
      message: 'Provider profile updated successfully',
      data: { provider }
    });

  } catch (error) {
    console.error('Provider profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider profile'
    });
  }
});

// Admin: Get all provider profiles
router.get('/admin/providers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, area, isVerified } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (category) whereClause.category = category;
    if (area) whereClause.area = area;
    if (isVerified !== undefined) whereClause.isVerified = isVerified === 'true';

    const providers = await prisma.provider.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.provider.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get providers'
    });
  }
});

// Admin: Verify provider
router.post('/admin/providers/:providerId/verify', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { providerId } = req.params;
    const { isVerified } = req.body;

    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: { isVerified }
    });

    res.json({
      success: true,
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { provider }
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider verification'
    });
  }
});

module.exports = router;



