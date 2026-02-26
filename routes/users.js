const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { fileOwnershipManager } = require('../utils/fileOwnershipManager');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        provider: true,
        wallet: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('pincode').optional().isPostalCode('IN').withMessage('Invalid pincode'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string')
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

    const { firstName, lastName, phone, email, address, pincode, city, state } = req.body;

    // Update user profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(address && { address }),
        ...(pincode && { pincode }),
        ...(city && { city }),
        ...(state && { state })
      }
    });

    // Update user email/phone if provided
    if (email || phone) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(email && { email }),
          ...(phone && { phone })
        }
      });
    }

    // Get updated user with all relations
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        provider: true,
        wallet: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Upload profile picture
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileRecord = await fileOwnershipManager.storeFileOwnership({
      filename: req.file.filename,
      originalName: req.file.originalname,
      userId: req.user.id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
    const avatarUrl = fileRecord.url;

    // Update user profile with avatar URL
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { avatar: avatarUrl }
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: avatarUrl,
        profile: updatedProfile
      }
    });
  } catch (error) {
    console.error('Avatar upload failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
});

// Get user wallet
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Get wallet failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet'
    });
  }
});

// Get user transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          userId: req.user.id
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({
      where: {
        wallet: {
          userId: req.user.id
        }
      }
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

// Get user orders (for customers)
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      customerId: req.user.id
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        service: true,
        provider: {
          include: {
            profile: true
          }
        },
        review: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.order.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get orders failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
});

// Get user reviews
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { reviewerId: req.user.id },
          { revieweeId: req.user.id }
        ]
      },
      include: {
        reviewer: {
          include: {
            profile: true
          }
        },
        reviewee: {
          include: {
            profile: true
          }
        },
        order: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({
      where: {
        OR: [
          { reviewerId: req.user.id },
          { revieweeId: req.user.id }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get reviews failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews'
    });
  }
});

// Deactivate account
router.post('/deactivate', authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

// Admin: Get all users
router.get('/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, userType, isActive, isBlocked } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (userType) whereClause.userType = userType;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (isBlocked !== undefined) whereClause.isBlocked = isBlocked === 'true';

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        provider: true,
        wallet: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.user.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users failed for admin:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Admin: Block/Unblock user
router.post('/admin/users/:userId/block', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked }
    });

    res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Block user failed for admin:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

module.exports = router;


