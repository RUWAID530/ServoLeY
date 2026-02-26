const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get provider profile by user ID
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify that the authenticated user is requesting their own profile or is an admin
    if (req.user.id !== userId && req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own profile'
      });
    }

    // Find the user with provider data
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (user.userType !== 'PROVIDER') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is for provider profiles only'
      });
    }

    // If provider doesn't exist, return a specific error
    if (!user.provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found. Please complete your provider registration.'
      });
    }

    res.json({
      success: true,
      data: {
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
    console.error('Error fetching provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider profile'
    });
  }
});

// Get current provider profile
router.get('/me', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    // First check if user exists with all related data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    // If provider doesn't exist, create one
    if (!user.provider) {
      const newProvider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: `${user.profile.firstName}'s Business`,
          providerType: 'FREELANCER',
          category: 'General',
          area: 'Not specified',
          address: user.profile.address || '',
          panNumber: 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          aadhaarNumber: 'TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          upiId: user.profile.upiId || null,
          isVerified: false,
          isActive: true,
          rating: 0,
          totalOrders: 0,
          isOnline: false
        },
        include: {
          user: {
            include: {
              profile: true,
              wallet: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: {
          provider: {
            ...newProvider,
            user: {
              id: newProvider.user.id,
              email: newProvider.user.email,
              phone: newProvider.user.phone,
              userType: newProvider.user.userType,
              profile: newProvider.user.profile,
              wallet: newProvider.user.wallet
            }
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        provider: {
          ...user.provider,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            profile: user.profile,
            wallet: user.wallet
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider profile'
    });
  }
});

module.exports = router;
