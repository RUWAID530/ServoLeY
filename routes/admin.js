const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  getOrderStatistics, 
  getTopProviders, 
  getTopServices 
} = require('../utils/orderManagement');

const router = express.Router();

// ==================== DASHBOARD OVERVIEW ====================

// Get dashboard overview
router.get('/dashboard', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get platform statistics
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    const totalProviders = await prisma.provider.count({
      where: { 
        isActive: true,
        isVerified: true
      }
    });

    const totalServices = await prisma.service.count({
      where: { isActive: true }
    });

    const totalOrders = await prisma.order.count({
      where: {
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      }
    });

    const completedOrders = await prisma.order.count({
      where: {
        status: 'COMPLETED',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      }
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      _sum: { totalAmount: true }
    });

    const totalCommission = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      _sum: { commission: true }
    });

    // Get order statistics
    const orderStats = await getOrderStatistics(startDate, endDate);
    
    // Get top providers
    const topProviders = await getTopProviders(10, startDate, endDate);
    
    // Get top services
    const topServices = await getTopServices(10, startDate, endDate);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        service: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get pending support tickets
    const pendingTickets = await prisma.ticket.count({
      where: { status: 'OPEN' }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProviders,
          totalServices,
          totalOrders,
          completedOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalCommission: totalCommission._sum.commission || 0,
          pendingTickets
        },
        orderStats,
        topProviders,
        topServices,
        recentOrders
      }
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview'
    });
  }
});

// ==================== ORDER REASSIGNMENT (ADMIN) ====================

router.post('/orders/:orderId/reassign', [
  authenticateToken,
  requireRole('ADMIN'),
  body('newProviderId').notEmpty().withMessage('newProviderId is required'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId } = req.params;
    const { newProviderId, reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reassign completed/cancelled/rejected order' });
    }

    // Validate new provider exists and is active/verified
    const providerUser = await prisma.user.findUnique({ where: { id: newProviderId } });
    if (!providerUser || providerUser.userType !== 'PROVIDER' || !providerUser.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid target provider' });
    }

    // Release previous virtual assignment if any
    try {
      const { releaseVirtualNumberForOrder } = require('../utils/virtualNumbers');
      await releaseVirtualNumberForOrder(orderId);
    } catch (e) {
      console.error('Virtual release on reassign failed:', e.message);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        providerId: newProviderId,
        status: 'PENDING',
        notes: reason ? `${order.notes || ''}\n[ADMIN REASSIGN]: ${reason}` : order.notes
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        action: 'REASSIGN_ORDER',
        targetId: orderId,
        details: { fromProviderId: order.providerId, toProviderId: newProviderId, reason }
      }
    });

    return res.json({ success: true, message: 'Order reassigned', data: { order: updated } });
  } catch (e) {
    console.error('Reassign order error:', e);
    res.status(500).json({ success: false, message: 'Failed to reassign order' });
  }
});

// ==================== WALLETS & TRANSACTIONS (ADMIN) ====================

router.get('/wallets', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereWallet = userId ? { userId } : {};
    const wallets = await prisma.wallet.findMany({
      where: whereWallet,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: { user: { include: { profile: true } } }
    });

    const totalWallets = await prisma.wallet.count({ where: whereWallet });

    // Recent transactions (global)
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { wallet: { include: { user: { include: { profile: true } } } } }
    });

    // Aggregates
    const agg = await prisma.wallet.aggregate({ _sum: { balance: true }, _avg: { balance: true }, _count: { id: true } });

    res.json({
      success: true,
      data: {
        summary: {
          totalWallets: agg._count.id,
          totalBalance: agg._sum.balance || 0,
          averageBalance: agg._avg.balance || 0
        },
        wallets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalWallets,
          pages: Math.ceil(totalWallets / parseInt(limit))
        },
        recentTransactions: transactions
      }
    });
  } catch (e) {
    console.error('Admin wallets error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch wallets' });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with filters
router.get('/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      isActive, 
      isBlocked, 
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (userType) whereClause.userType = userType;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (isBlocked !== undefined) whereClause.isBlocked = isBlocked === 'true';
    if (isVerified !== undefined) whereClause.isVerified = isVerified === 'true';
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { profile: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        provider: true,
        wallet: true,
        _count: {
          select: {
            customerOrders: true,
            providerOrders: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get user details
router.get('/users/:userId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        provider: true,
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        customerOrders: {
          include: {
            service: true,
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
          take: 10
        },
        providerOrders: {
          include: {
            service: true,
            customer: {
              include: {
                profile: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reviewsGiven: {
          include: {
            order: {
              include: {
                service: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        reviewsReceived: {
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
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    });
  }
});

// Block/Unblock user
router.post('/users/:userId/block', [
  authenticateToken,
  requireRole('ADMIN'),
  body('isBlocked').isBoolean().withMessage('isBlocked must be boolean'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { userId } = req.params;
    const { isBlocked, reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
        targetId: userId,
        details: {
          reason,
          previousStatus: user.isBlocked,
          newStatus: isBlocked
        }
      }
    });

    res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Get suspect list (users with 3+ cancellations)
router.get('/users/suspects', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with 3 or more cancellations
    const suspectUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            customerOrders: {
              some: {
                status: 'CANCELLED',
                cancelledBy: { not: null }
              }
            }
          },
          {
            providerOrders: {
              some: {
                status: 'CANCELLED',
                cancelledBy: { not: null }
              }
            }
          }
        ]
      },
      include: {
        profile: true,
        provider: true,
        _count: {
          select: {
            customerOrders: {
              where: { status: 'CANCELLED' }
            },
            providerOrders: {
              where: { status: 'CANCELLED' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    // Use isSuspect flag or count >= 3
    const suspects = suspectUsers.filter(user => user.isSuspect || (user._count.customerOrders + user._count.providerOrders) >= 3);
    const total = suspects.length;

    res.json({
      success: true,
      data: {
        suspects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get suspect users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suspect users'
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders with filters
router.get('/orders', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customerId, 
      providerId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    if (providerId) whereClause.providerId = providerId;
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        service: true,
        review: true
      },
      orderBy: { [sortBy]: sortOrder },
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
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
});

// Get order timeline
router.get('/orders/:orderId/timeline', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        service: true,
        review: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create detailed timeline
    const timeline = [
      {
        status: 'PENDING',
        title: 'Order Placed',
        description: `Order placed by ${order.customer.profile?.firstName} ${order.customer.profile?.lastName}`,
        timestamp: order.createdAt,
        completed: true,
        user: order.customer
      }
    ];

    if (order.status !== 'PENDING') {
      timeline.push({
        status: 'ACCEPTED',
        title: 'Order Accepted',
        description: `Order accepted by ${order.provider.user.profile?.firstName} ${order.provider.user.profile?.lastName}`,
        timestamp: order.updatedAt,
        completed: true,
        user: order.provider.user
      });
    }

    if (order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') {
      timeline.push({
        status: 'IN_PROGRESS',
        title: 'Service In Progress',
        description: 'Service has started',
        timestamp: order.updatedAt,
        completed: order.status === 'COMPLETED',
        user: order.provider.user
      });
    }

    if (order.status === 'COMPLETED') {
      timeline.push({
        status: 'COMPLETED',
        title: 'Service Completed',
        description: 'Service has been completed successfully',
        timestamp: order.completedAt,
        completed: true,
        user: order.provider.user
      });
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      timeline.push({
        status: order.status,
        title: order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Rejected',
        description: order.cancelReason || 'Order was cancelled/rejected',
        timestamp: order.cancelledAt,
        completed: true,
        user: order.cancelledBy === order.customerId ? order.customer : order.provider.user
      });
    }

    res.json({
      success: true,
      data: {
        order,
        timeline
      }
    });

  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order timeline'
    });
  }
});

// Cancel order (Admin)
router.post('/orders/:orderId/cancel', [
  authenticateToken,
  requireRole('ADMIN'),
  body('reason').notEmpty().withMessage('Cancellation reason is required')
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

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    // Process refund if order was paid
    if (order.status !== 'PENDING') {
      const { processRefund } = require('../utils/wallet');
      const refundResult = await processRefund(
        order.customerId,
        order.totalAmount,
        orderId,
        `Admin cancellation: ${reason}`
      );

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          message: refundResult.message
        });
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user.id,
        cancelReason: reason,
        cancelledAt: new Date()
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        action: 'CANCEL_ORDER',
        targetId: orderId,
        details: {
          reason,
          orderAmount: order.totalAmount
        }
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled by admin',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Admin cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// ==================== FINANCIAL REPORTS ====================

// Get financial overview
router.get('/financial/overview', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get revenue statistics
    const revenueStats = await prisma.order.aggregate({
      where: whereClause,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: { id: true }
    });

    const commissionStats = await prisma.order.aggregate({
      where: whereClause,
      _sum: { commission: true }
    });

    // Get transaction statistics
    const transactionStats = await prisma.transaction.aggregate({
      where: {
        type: 'COMMISSION',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Get wallet statistics
    const walletStats = await prisma.wallet.aggregate({
      _sum: { balance: true },
      _avg: { balance: true },
      _count: { id: true }
    });

    // Get top earning providers
    const topEarningProviders = await prisma.order.groupBy({
      by: ['providerId'],
      where: whereClause,
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    // Get provider details
    const providerIds = topEarningProviders.map(item => item.providerId);
    const providers = await prisma.provider.findMany({
      where: {
        userId: { in: providerIds }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    const topProviders = topEarningProviders.map(item => {
      const provider = providers.find(p => p.userId === item.providerId);
      return {
        providerId: item.providerId,
        providerName: provider?.businessName || 'Unknown',
        totalEarnings: item._sum.totalAmount || 0,
        totalOrders: item._count.id,
        averageOrderValue: item._count.id > 0 ? (item._sum.totalAmount || 0) / item._count.id : 0
      };
    });

    res.json({
      success: true,
      data: {
        revenue: {
          totalRevenue: revenueStats._sum.totalAmount || 0,
          averageOrderValue: revenueStats._avg.totalAmount || 0,
          totalOrders: revenueStats._count.id,
          totalCommission: commissionStats._sum.commission || 0
        },
        transactions: {
          totalCommission: transactionStats._sum.amount || 0,
          transactionCount: transactionStats._count.id
        },
        wallets: {
          totalBalance: walletStats._sum.balance || 0,
          averageBalance: walletStats._avg.balance || 0,
          totalWallets: walletStats._count.id
        },
        topProviders
      }
    });

  } catch (error) {
    console.error('Get financial overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial overview'
    });
  }
});

// Get revenue chart data
router.get('/financial/revenue-chart', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        totalAmount: true,
        commission: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const groupedData = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          revenue: 0,
          commission: 0,
          orders: 0
        };
      }

      acc[key].revenue += order.totalAmount;
      acc[key].commission += order.commission || 0;
      acc[key].orders += 1;

      return acc;
    }, {});

    const chartData = Object.values(groupedData);

    res.json({
      success: true,
      data: { chartData }
    });

  } catch (error) {
    console.error('Get revenue chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue chart data'
    });
  }
});

module.exports = router;

