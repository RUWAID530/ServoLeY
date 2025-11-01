const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification, requireProviderVerification } = require('../middleware/auth');

const router = express.Router();

// Get all services (public)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      area, 
      minPrice, 
      maxPrice, 
      rating,
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {
      isActive: true,
      provider: {
        isActive: true,
        isVerified: true
      }
    };

    // Apply filters
    if (category) whereClause.category = category;
    if (area) whereClause.provider.area = area;
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }
    if (rating) {
      whereClause.provider.rating = {
        gte: parseFloat(rating)
      };
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.service.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services'
    });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        orders: {
          include: {
            customer: {
              include: {
                profile: true
              }
            },
            review: true
          },
          where: {
            status: 'COMPLETED'
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is not available'
      });
    }

    res.json({
      success: true,
      data: { service }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service'
    });
  }
});

// Get service categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(item => item.category);

    res.json({
      success: true,
      data: { categories: categoryList }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// Get service areas
router.get('/areas/list', async (req, res) => {
  try {
    const areas = await prisma.provider.findMany({
      where: { 
        isActive: true,
        isVerified: true
      },
      select: { area: true },
      distinct: ['area']
    });

    const areaList = areas.map(item => item.area);

    res.json({
      success: true,
      data: { areas: areaList }
    });

  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get areas'
    });
  }
});

// Provider: Create service
router.post('/', [
  authenticateToken,
  requireRole('PROVIDER'),
  requireProviderVerification,
  body('name').notEmpty().withMessage('Service name is required'),
  body('description').notEmpty().withMessage('Service description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 1 }).withMessage('Price must be at least ₹1'),
  body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
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

    const { name, description, category, price, duration } = req.body;

    // Get provider
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        name,
        description,
        category,
        price,
        duration
      }
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// Provider: Update service
router.put('/:id', [
  authenticateToken,
  requireRole('PROVIDER'),
  requireProviderVerification,
  body('name').optional().notEmpty().withMessage('Service name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Service description cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('price').optional().isFloat({ min: 1 }).withMessage('Price must be at least ₹1'),
  body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
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
    const { name, description, category, price, duration, isActive } = req.body;

    // Check if service belongs to provider
    const service = await prisma.service.findFirst({
      where: {
        id,
        provider: {
          userId: req.user.id
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized'
      });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price && { price }),
        ...(duration && { duration }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service: updatedService }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// Provider: Delete service
router.delete('/:id', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service belongs to provider
    const service = await prisma.service.findFirst({
      where: {
        id,
        provider: {
          userId: req.user.id
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized'
      });
    }

    // Check if service has active orders
    const activeOrders = await prisma.order.count({
      where: {
        serviceId: id,
        status: {
          in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
        }
      }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service with active orders'
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

// Provider: Get my services
router.get('/provider/my-services', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      provider: {
        userId: req.user.id
      }
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.service.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services'
    });
  }
});

// Get service statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider
    const isProvider = service.provider.userId === req.user.id;

    if (!isProvider && req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view service statistics'
      });
    }

    // Get order statistics
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { serviceId: id },
      _count: { status: true },
      _sum: { totalAmount: true }
    });

    const totalOrders = await prisma.order.count({
      where: { serviceId: id }
    });

    const completedOrders = await prisma.order.count({
      where: {
        serviceId: id,
        status: 'COMPLETED'
      }
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        serviceId: id,
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true }
    });

    const averageRating = await prisma.review.aggregate({
      where: {
        order: {
          serviceId: id
        }
      },
      _avg: { rating: true }
    });

    res.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          price: service.price
        },
        statistics: {
          totalOrders,
          completedOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          averageRating: averageRating._avg.rating || 0,
          orderStatusBreakdown: orderStats
        }
      }
    });

  } catch (error) {
    console.error('Get service stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service statistics'
    });
  }
});

module.exports = router;


