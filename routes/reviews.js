const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');

const router = express.Router();

// Create review
router.post('/', [
  authenticateToken,
  requireVerification,
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string')
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

    const { orderId, rating, comment } = req.body;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        provider: true,
        service: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the customer
    if (order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer can review this order'
      });
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed orders'
      });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { orderId }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this order'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId,
        reviewerId: req.user.id,
        revieweeId: order.providerId,
        providerId: order.provider.id,
        rating,
        comment
      }
    });

    // Update provider rating
    const providerReviews = await prisma.review.findMany({
      where: { providerId: order.provider.id }
    });

    const averageRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length;

    await prisma.provider.update({
      where: { id: order.provider.id },
      data: { rating: Math.round(averageRating * 10) / 10 }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// Get reviews for a service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await prisma.review.findMany({
      where: {
        order: {
          serviceId
        }
      },
      include: {
        reviewer: {
          include: {
            profile: true
          }
        },
        order: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({
      where: {
        order: {
          serviceId
        }
      }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get service reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service reviews'
    });
  }
});

// Get reviews for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await prisma.review.findMany({
      where: { providerId },
      include: {
        reviewer: {
          include: {
            profile: true
          }
        },
        order: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({
      where: { providerId }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider reviews'
    });
  }
});

// Get user reviews
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};

    if (type === 'given') {
      whereClause.reviewerId = req.user.id;
    } else if (type === 'received') {
      whereClause.revieweeId = req.user.id;
    } else {
      whereClause.OR = [
        { reviewerId: req.user.id },
        { revieweeId: req.user.id }
      ];
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
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
        order: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({
      where: whereClause
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
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reviews'
    });
  }
});

// Update review
router.put('/:id', [
  authenticateToken,
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string')
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

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if review exists and user is the reviewer
    const review = await prisma.review.findFirst({
      where: {
        id,
        reviewerId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(comment !== undefined && { comment })
      }
    });

    // Update provider rating if rating changed
    if (rating) {
      const providerReviews = await prisma.review.findMany({
        where: { providerId: review.providerId }
      });

      const averageRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length;

      await prisma.provider.update({
        where: { id: review.providerId },
        data: { rating: Math.round(averageRating * 10) / 10 }
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists and user is the reviewer
    const review = await prisma.review.findFirst({
      where: {
        id,
        reviewerId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Delete review
    await prisma.review.delete({
      where: { id }
    });

    // Update provider rating
    const providerReviews = await prisma.review.findMany({
      where: { providerId: review.providerId }
    });

    const averageRating = providerReviews.length > 0 ? 
      providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length : 0;

    await prisma.provider.update({
      where: { id: review.providerId },
      data: { rating: Math.round(averageRating * 10) / 10 }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// Get review statistics
router.get('/stats/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { providerId },
      select: {
        rating: true,
        createdAt: true
      }
    });

    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingBreakdown: {},
          recentReviews: []
        }
      });
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    // Rating breakdown
    const ratingBreakdown = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    // Recent reviews
    const recentReviews = await prisma.review.findMany({
      where: { providerId },
      include: {
        reviewer: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review statistics'
    });
  }
});

module.exports = router;


