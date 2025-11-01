const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  getOrderStatistics, 
  getProviderOrderStatistics, 
  getCustomerOrderStatistics,
  getTopProviders,
  getTopServices
} = require('../utils/orderManagement');

const router = express.Router();

// Get platform analytics (Admin only)
router.get('/platform', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getOrderStatistics(startDate, endDate);
    const topProviders = await getTopProviders(10, startDate, endDate);
    const topServices = await getTopServices(10, startDate, endDate);

    // Get additional platform metrics
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

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProviders,
          totalServices,
          totalOrders: stats.totalOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalCommission: totalCommission._sum.commission || 0,
          averageOrderValue: stats.averageOrderValue,
          completionRate: stats.completionRate
        },
        orderStats: stats,
        topProviders,
        topServices
      }
    });

  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform analytics'
    });
  }
});

// Get provider analytics
router.get('/provider', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const stats = await getProviderOrderStatistics(provider.id, startDate, endDate);

    // Get provider services
    const services = await prisma.service.findMany({
      where: { providerId: provider.id },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          select: {
            totalAmount: true,
            createdAt: true
          }
        }
      }
    });

    const serviceStats = services.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      price: service.price,
      totalOrders: service.orders.length,
      totalRevenue: service.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: service.orders.length > 0 ? 
        service.orders.reduce((sum, order) => sum + order.totalAmount, 0) / service.orders.length : 0
    }));

    res.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          businessName: provider.businessName,
          category: provider.category,
          area: provider.area,
          rating: provider.rating,
          totalOrders: provider.totalOrders
        },
        stats,
        services: serviceStats
      }
    });

  } catch (error) {
    console.error('Get provider analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider analytics'
    });
  }
});

// Get customer analytics
router.get('/customer', authenticateToken, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getCustomerOrderStatistics(req.user.id, startDate, endDate);

    // Get customer's favorite categories
    const categoryStats = await prisma.order.groupBy({
      by: ['service'],
      where: {
        customerId: req.user.id,
        status: 'COMPLETED',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      _count: { service: true },
      _sum: { totalAmount: true }
    });

    const services = await prisma.service.findMany({
      where: {
        id: {
          in: categoryStats.map(item => item.service)
        }
      },
      select: {
        id: true,
        category: true,
        name: true
      }
    });

    const favoriteCategories = categoryStats.map(item => {
      const service = services.find(s => s.id === item.service);
      return {
        category: service?.category || 'Unknown',
        serviceName: service?.name || 'Unknown',
        totalOrders: item._count.service,
        totalSpent: item._sum.totalAmount || 0
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        favoriteCategories
      }
    });

  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer analytics'
    });
  }
});

// Get order analytics
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      type = 'all' // all, customer, provider
    } = req.query;

    let whereClause = {};

    if (type === 'customer') {
      whereClause.customerId = req.user.id;
    } else if (type === 'provider') {
      whereClause.providerId = req.user.id;
    } else {
      whereClause.OR = [
        { customerId: req.user.id },
        { providerId: req.user.id }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

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
        service: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const categoryBreakdown = orders.reduce((acc, order) => {
      const category = order.service?.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        statusBreakdown,
        categoryBreakdown,
        orders: orders.slice(0, 10) // Return latest 10 orders
      }
    });

  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order analytics'
    });
  }
});

// Get revenue analytics
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get revenue by date
    const revenueData = await prisma.order.findMany({
      where: whereClause,
      select: {
        totalAmount: true,
        commission: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const groupedRevenue = revenueData.reduce((acc, order) => {
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
          totalRevenue: 0,
          totalCommission: 0,
          orderCount: 0
        };
      }

      acc[key].totalRevenue += order.totalAmount;
      acc[key].totalCommission += order.commission || 0;
      acc[key].orderCount += 1;

      return acc;
    }, {});

    const revenueChart = Object.values(groupedRevenue);

    // Calculate totals
    const totalRevenue = revenueData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalCommission = revenueData.reduce((sum, order) => sum + (order.commission || 0), 0);
    const totalOrders = revenueData.length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCommission,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenueChart
      }
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics'
    });
  }
});

// Get service analytics
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get service performance
    const serviceStats = await prisma.order.groupBy({
      by: ['serviceId'],
      where: whereClause,
      _count: { serviceId: true },
      _sum: { totalAmount: true },
      orderBy: {
        _count: {
          serviceId: 'desc'
        }
      },
      take: 20
    });

    // Get service details
    const serviceIds = serviceStats.map(item => item.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      },
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
      }
    });

    const serviceAnalytics = serviceStats.map(item => {
      const service = services.find(s => s.id === item.serviceId);
      return {
        serviceId: item.serviceId,
        serviceName: service?.name || 'Unknown',
        category: service?.category || 'Unknown',
        providerName: service?.provider?.businessName || 'Unknown',
        totalOrders: item._count.serviceId,
        totalRevenue: item._sum.totalAmount || 0,
        averageOrderValue: item._count.serviceId > 0 ? 
          (item._sum.totalAmount || 0) / item._count.serviceId : 0,
        price: service?.price || 0
      };
    });

    // Get category breakdown
    const categoryStats = await prisma.order.groupBy({
      by: ['service'],
      where: whereClause,
      _count: { service: true },
      _sum: { totalAmount: true }
    });

    const categoryServices = await prisma.service.findMany({
      where: {
        id: {
          in: categoryStats.map(item => item.service)
        }
      },
      select: {
        id: true,
        category: true
      }
    });

    const categoryBreakdown = categoryStats.map(item => {
      const service = categoryServices.find(s => s.id === item.service);
      return {
        category: service?.category || 'Unknown',
        totalOrders: item._count.service,
        totalRevenue: item._sum.totalAmount || 0
      };
    });

    res.json({
      success: true,
      data: {
        serviceAnalytics,
        categoryBreakdown
      }
    });

  } catch (error) {
    console.error('Get service analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service analytics'
    });
  }
});

module.exports = router;


