const express = require('express');
const { body, validationResult } = require('express-validator');
const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  getOrderStatistics, 
  getTopProviders, 
  getTopServices 
} = require('../utils/orderManagement');

const router = express.Router();

const getAdminSettingsPayload = async (adminId) => {
  const admin = await prisma.users.findUnique({
    where: { id: adminId },
    include: {
      profiles: true,
      notification_preferences: true
    }
  });

  if (!admin) {
    return null;
  }

  return {
    account: {
      id: admin.id,
      email: admin.email || '',
      phone: admin.phone || '',
      firstName: admin.profiles?.firstName || '',
      lastName: admin.profiles?.lastName || ''
    },
    preferences: {
      pushEnabled: admin.notification_preferences?.pushEnabled ?? true,
      emailEnabled: admin.notification_preferences?.emailEnabled ?? true,
      smsEnabled: admin.notification_preferences?.smsEnabled ?? true,
      orderUpdates: admin.notification_preferences?.orderUpdates ?? true,
      messages: admin.notification_preferences?.messages ?? true,
      promotions: admin.notification_preferences?.promotions ?? false,
      systemAlerts: admin.notification_preferences?.systemAlerts ?? true
    },
    platform: {
      name: process.env.VITE_PLATFORM_NAME || 'Servoley',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@servoley.com',
      timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata'
    }
  };
};

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

// Admin analytics summary for admin dashboard
router.get('/analytics', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      totalUsers,
      totalAdmins,
      totalProvidersUsers,
      totalCustomers,
      totalProviders,
      pendingProviders,
      approvedProviders,
      suspendedProviders,
      totalServices,
      pendingServices,
      approvedServices,
      rejectedServices,
      suspendedServices,
      recentRevenue,
      recentBookings
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { userType: 'ADMIN' } }),
      prisma.users.count({ where: { userType: 'PROVIDER' } }),
      prisma.users.count({ where: { userType: 'CUSTOMER' } }),
      prisma.providers.count(),
      prisma.providers.count({ where: { isVerified: false } }),
      prisma.providers.count({ where: { isVerified: true, isActive: true } }),
      prisma.providers.count({ where: { isActive: false } }),
      prisma.services.count(),
      prisma.services.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.services.count({ where: { status: 'ACTIVE' } }),
      prisma.services.count({ where: { status: 'REJECTED' } }),
      prisma.services.count({ where: { isActive: false } }),
      prisma.orders.aggregate({
        where: {
          createdAt: { gte: last30Days },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      prisma.orders.count({
        where: {
          createdAt: { gte: last30Days }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: {
            admin: totalAdmins,
            provider: totalProvidersUsers,
            customer: totalCustomers
          }
        },
        providers: {
          total: totalProviders,
          byStatus: {
            pending: pendingProviders,
            approved: approvedProviders,
            rejected: 0,
            suspended: suspendedProviders
          }
        },
        services: {
          total: totalServices,
          byStatus: {
            pending: pendingServices,
            approved: approvedServices,
            rejected: rejectedServices,
            suspended: suspendedServices
          }
        },
        revenue: {
          last30Days: recentRevenue?._sum?.totalAmount || 0,
          totalBookings: recentBookings
        },
        recentActivity: [
          { action_type: 'PENDING_PROVIDERS', count: pendingProviders },
          { action_type: 'PENDING_SERVICES', count: pendingServices },
          { action_type: 'BOOKINGS_30D', count: recentBookings }
        ]
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get admin analytics'
    });
  }
});

// ==================== PROVIDER VERIFICATION ====================

// Get providers list for admin verification page
router.get('/providers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (status === 'pending') {
      where.isVerified = false;
      where.isActive = true;
    } else if (status === 'approved') {
      where.isVerified = true;
      where.isActive = true;
    } else if (status === 'rejected') {
      where.isVerified = false;
      where.isActive = false;
    } else if (status === 'suspended') {
      where.isVerified = true;
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        {
          users: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const [providers, total] = await Promise.all([
      prisma.providers.findMany({
        where,
        include: {
          users: {
            include: {
              profiles: true
            }
          },
          services: {
            select: {
              status: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.providers.count({ where })
    ]);

    const mapped = providers.map((provider) => {
      const totalServices = provider.services.length;
      const approvedServices = provider.services.filter(
        (service) => service.status === 'ACTIVE' && service.isActive
      ).length;

      let verificationStatus = 'pending';
      if (provider.isVerified && provider.isActive) verificationStatus = 'approved';
      else if (!provider.isVerified && !provider.isActive) verificationStatus = 'rejected';
      else if (provider.isVerified && !provider.isActive) verificationStatus = 'suspended';

      return {
        id: provider.id,
        user_id: provider.userId,
        business_name: provider.businessName,
        business_type: provider.providerType,
        category: provider.category,
        verification_status: verificationStatus,
        email: provider.users?.email || '',
        phone: provider.users?.phone || '',
        total_services: totalServices,
        approved_services: approvedServices,
        created_at: provider.createdAt
      };
    });

    return res.json({
      success: true,
      data: mapped,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.max(Math.ceil(total / limitNumber), 1)
      }
    });
  } catch (error) {
    console.error('Get admin providers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load providers'
    });
  }
});

router.put('/providers/:id/approve', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    const { id } = req.params;

    const provider = await prisma.providers.update({
      where: { id },
      data: {
        isVerified: true,
        isActive: true,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Provider approved successfully',
      data: provider
    });
  } catch (error) {
    console.error('Approve provider error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve provider'
    });
  }
});

router.put('/providers/:id/reject', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.providers.update({
      where: { id },
      data: {
        isVerified: false,
        isActive: false,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Provider rejected successfully',
      data: provider
    });
  } catch (error) {
    console.error('Reject provider error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject provider'
    });
  }
});

router.put('/providers/:id/suspend', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.providers.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Provider suspended successfully',
      data: provider
    });
  } catch (error) {
    console.error('Suspend provider error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend provider'
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
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
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

// ==================== CUSTOMERS (ADMIN) ====================

router.get('/customers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {
      userType: 'CUSTOMER'
    };

    if (status === 'active') {
      where.isActive = true;
      where.isBlocked = false;
    } else if (status === 'blocked') {
      where.isBlocked = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        {
          profiles: {
            is: {
              OR: [
                { firstName: { contains: String(search), mode: 'insensitive' } },
                { lastName: { contains: String(search), mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.users.findMany({
        where,
        include: {
          profiles: true,
          wallets: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.users.count({ where })
    ]);

    const customerIds = customers.map((customer) => customer.id);
    let bookingCounts = [];
    let completedBookingCounts = [];

    if (customerIds.length > 0) {
      [bookingCounts, completedBookingCounts] = await Promise.all([
        prisma.orders.groupBy({
          by: ['customerId'],
          where: {
            customerId: { in: customerIds }
          },
          _count: { _all: true }
        }),
        prisma.orders.groupBy({
          by: ['customerId'],
          where: {
            customerId: { in: customerIds },
            status: 'COMPLETED'
          },
          _count: { _all: true }
        })
      ]);
    }

    const totalBookingsByCustomer = Object.fromEntries(
      bookingCounts.map((entry) => [entry.customerId, entry._count._all || 0])
    );
    const completedBookingsByCustomer = Object.fromEntries(
      completedBookingCounts.map((entry) => [entry.customerId, entry._count._all || 0])
    );

    const data = customers.map((customer) => ({
      id: customer.id,
      name: `${customer.profiles?.firstName || ''} ${customer.profiles?.lastName || ''}`.trim() || 'Customer',
      email: customer.email || '',
      phone: customer.phone || '',
      isVerified: !!customer.isVerified,
      isActive: !!customer.isActive,
      isBlocked: !!customer.isBlocked,
      walletBalance: Number(customer.wallets?.balance || 0),
      totalBookings: totalBookingsByCustomer[customer.id] || 0,
      completedBookings: completedBookingsByCustomer[customer.id] || 0,
      joinedAt: customer.createdAt
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.max(Math.ceil(total / limitNumber), 1)
      }
    });
  } catch (error) {
    console.error('Get admin customers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load customers'
    });
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
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
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
    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
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

// ==================== SERVICE VERIFICATION ====================

const mapProviderStatus = (provider) => {
  if (!provider) return 'pending';
  if (provider.isVerified && provider.isActive) return 'approved';
  if (!provider.isVerified && !provider.isActive) return 'rejected';
  if (provider.isVerified && !provider.isActive) return 'suspended';
  return 'pending';
};

const mapServiceStatus = (service) => {
  if (!service) return 'pending';
  if (service.status === 'PENDING_VERIFICATION' || service.status === 'PENDING') return 'pending';
  if (service.status === 'REJECTED') return 'rejected';
  if (!service.isActive) return 'suspended';
  return 'approved';
};

const emitServiceStatusUpdate = (req, service, action) => {
  const io = req.app.get('io');
  if (!io || !service) return;

  const payload = {
    action,
    serviceId: service.id,
    providerId: service.providerId,
    status: service.status,
    isActive: service.isActive,
    updatedAt: new Date().toISOString()
  };

  io.to('services:public').emit('services:updated', payload);

  if (service.providerId) {
    io.to(`provider:${service.providerId}`).emit('services:updated', payload);
  }
};

router.get('/services', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (status === 'pending') {
      where.status = 'PENDING_VERIFICATION';
    } else if (status === 'approved') {
      where.status = 'ACTIVE';
      where.isActive = true;
    } else if (status === 'rejected') {
      where.status = 'REJECTED';
    } else if (status === 'suspended') {
      where.isActive = false;
      where.status = { not: 'REJECTED' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        {
          providers: {
            is: {
              OR: [
                { businessName: { contains: search, mode: 'insensitive' } },
                {
                  users: {
                    is: {
                      OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      ];
    }

    const [services, total] = await Promise.all([
      prisma.services.findMany({
        where,
        include: {
          providers: {
            include: {
              users: {
                select: {
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.services.count({ where })
    ]);

    const data = services.map((service) => ({
      id: service.id,
      provider_id: service.providerId,
      title: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      status: mapServiceStatus(service),
      business_name: service.providers?.businessName || 'Unknown Provider',
      provider_email: service.providers?.users?.email || '',
      provider_phone: service.providers?.users?.phone || '',
      provider_status: mapProviderStatus(service.providers),
      created_at: service.createdAt
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.max(Math.ceil(total / limitNumber), 1)
      }
    });
  } catch (error) {
    console.error('Get admin services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load services'
    });
  }
});

// Get all pending services for verification
router.get('/services/pending', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    console.log('🔍 Admin fetching pending services for verification');
    
    const pendingServices = await prisma.services.findMany({
      where: {
        status: 'PENDING_VERIFICATION'
      },
      include: {
        providers: {
          include: {
            users: {
              include: {
                profiles: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🔍 Admin fetching pending services for verification`);
    console.log(`✅ Found ${pendingServices.length} pending services`);
    console.log(`📋 Pending services:`, pendingServices.map(s => ({ id: s.id, name: s.name, status: s.status })));

    // Transform data for frontend
    const transformedServices = pendingServices.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      providerName: `${service.providers.users.profiles.firstName || ''} ${service.providers.users.profiles.lastName || ''}`.trim() || 'Unknown Provider',
      providerEmail: service.providers.users.email,
      price: service.price,
      description: service.description,
      submittedAt: service.createdAt,
      status: service.status
    }));

    res.json({
      success: true,
      data: transformedServices,
      message: `Found ${pendingServices.length} pending services`
    });

  } catch (error) {
    console.error('❌ Error fetching pending services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending services',
      error: error?.message
    });
  }
});

// Approve a service
router.put('/services/:id/approve', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Admin approving service:', id);

    const updatedService = await prisma.services.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isActive: true, // Set to active when approved
        updatedAt: new Date()
      }
    });

    console.log('✅ Service approved successfully:', updatedService.id);

    res.json({
      success: true,
      data: updatedService,
      message: 'Service approved successfully'
    });

    emitServiceStatusUpdate(req, updatedService, 'SERVICE_APPROVED');

  } catch (error) {
    console.error('❌ Error approving service:', error);
    if (error?.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to approve service',
      error: error?.message
    });
  }
});

// Reject a service
router.put('/services/:id/reject', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('❌ Admin rejecting service:', id, 'Reason:', reason);

    const updatedService = await prisma.services.update({
      where: { id },
      data: {
        status: 'REJECTED',
        isActive: false, // Keep inactive when rejected
        rejectionReason: reason,
        updatedAt: new Date()
      }
    });

    console.log('❌ Service rejected successfully:', updatedService.id);

    res.json({
      success: true,
      data: updatedService,
      message: 'Service rejected successfully'
    });

    emitServiceStatusUpdate(req, updatedService, 'SERVICE_REJECTED');

  } catch (error) {
    console.error('❌ Error rejecting service:', error);
    if (error?.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to reject service',
      error: error?.message
    });
  }
});

// ==================== ADMIN AUDIT & SETTINGS ====================

router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 100 : Math.min(Math.max(requestedLimit, 1), 200);

    const logs = await prisma.admin_actions.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        }
      }
    });

    const data = logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetId: log.targetId,
      details: log.details,
      createdAt: log.createdAt,
      admin: {
        id: log.users?.id || '',
        email: log.users?.email || '',
        phone: log.users?.phone || ''
      }
    }));

    return res.json({
      success: true,
      data: {
        logs: data
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load audit logs'
    });
  }
});

router.get('/settings', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = await getAdminSettingsPayload(req.user.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin settings'
    });
  }
});

router.put('/settings', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const payload = req.body || {};
    const profileUpdates = {};
    const notificationUpdates = {};
    const now = new Date();

    if (payload.phone !== undefined) {
      const phone = String(payload.phone || '').trim();
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone cannot be empty'
        });
      }

      await prisma.users.update({
        where: { id: req.user.id },
        data: {
          phone,
          updatedAt: now
        }
      });
    }

    if (payload.firstName !== undefined) {
      profileUpdates.firstName = String(payload.firstName || '').trim();
      if (!profileUpdates.firstName) {
        return res.status(400).json({
          success: false,
          message: 'First name cannot be empty'
        });
      }
    }

    if (payload.lastName !== undefined) {
      profileUpdates.lastName = String(payload.lastName || '').trim();
      if (!profileUpdates.lastName) {
        return res.status(400).json({
          success: false,
          message: 'Last name cannot be empty'
        });
      }
    }

    const preferenceKeys = [
      'pushEnabled',
      'emailEnabled',
      'smsEnabled',
      'orderUpdates',
      'messages',
      'promotions',
      'systemAlerts'
    ];

    for (const key of preferenceKeys) {
      if (payload.preferences && typeof payload.preferences[key] === 'boolean') {
        notificationUpdates[key] = payload.preferences[key];
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      await prisma.profiles.upsert({
        where: { userId: req.user.id },
        update: {
          ...profileUpdates,
          updatedAt: now
        },
        create: {
          id: randomUUID(),
          userId: req.user.id,
          firstName: profileUpdates.firstName || req.user.profiles?.firstName || 'Admin',
          lastName: profileUpdates.lastName || req.user.profiles?.lastName || 'User',
          updatedAt: now
        }
      });
    }

    if (Object.keys(notificationUpdates).length > 0) {
      await prisma.notification_preferences.upsert({
        where: { userId: req.user.id },
        update: {
          ...notificationUpdates,
          updatedAt: now
        },
        create: {
          id: randomUUID(),
          userId: req.user.id,
          pushEnabled: notificationUpdates.pushEnabled ?? true,
          emailEnabled: notificationUpdates.emailEnabled ?? true,
          smsEnabled: notificationUpdates.smsEnabled ?? true,
          orderUpdates: notificationUpdates.orderUpdates ?? true,
          messages: notificationUpdates.messages ?? true,
          promotions: notificationUpdates.promotions ?? false,
          systemAlerts: notificationUpdates.systemAlerts ?? true,
          updatedAt: now
        }
      });
    }

    const data = await getAdminSettingsPayload(req.user.id);
    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already in use'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update admin settings'
    });
  }
});

// Basic admin stats endpoint for dashboard cards
router.get('/stats', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [users, providers, bookings, pendingProviders] = await Promise.all([
      prisma.users.count(),
      prisma.providers.count(),
      prisma.orders.count(),
      prisma.providers.count({
        where: {
          isVerified: false,
          isActive: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        users,
        providers,
        bookings,
        pendingProviders
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats'
    });
  }
});

module.exports = router;
