const { prisma } = require('../config/database');
const { processRefund } = require('./wallet');

// Auto-reassign order to another provider
const autoReassignOrder = async (orderId, reason = 'Provider rejected') => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        services: {
          include: {
            providers: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Find alternative providers in the same area and category
    const currentService = order.services;
    const currentProvider = currentService?.providers;

    if (!currentService || !currentProvider) {
      throw new Error('Order service/provider details not found');
    }

    const alternativeProviders = await prisma.providers.findMany({
      where: {
        area: currentProvider.area,
        category: currentProvider.category,
        isActive: true,
        isVerified: true,
        id: {
          not: currentService.providerId
        }
      },
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 3
    });

    if (alternativeProviders.length === 0) {
      // No alternative providers found, cancel order and refund
      await processRefund(
        order.customerId,
        order.totalAmount,
        orderId,
        'No alternative providers available'
      );

      await prisma.orders.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledBy: null,
          cancelReason: 'No alternative providers available',
          cancelledAt: new Date()
        }
      });

      return {
        success: false,
        message: 'No alternative providers available, order cancelled and refunded'
      };
    }

    // Reassign to the best alternative provider
    const newProvider = alternativeProviders[0];
    
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        providerId: newProvider.userId,
        status: 'PENDING'
      }
    });

    console.log(`Order ${orderId} reassigned to provider ${newProvider.userId}`);
    return {
      success: true,
      message: 'Order reassigned to alternative provider',
      newProviderId: newProvider.userId,
      newProviderName: newProvider.businessName
    };

  } catch (error) {
    console.error('Auto-reassign order error:', error);
    throw new Error('Failed to auto-reassign order');
  }
};

// Check for orders that need auto-reassignment
const checkPendingOrders = async () => {
  try {
    const pendingOrders = await prisma.orders.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      },
      include: {
        services: {
          include: {
            providers: true
          }
        }
      }
    });

    for (const order of pendingOrders) {
      console.log(`Auto-reassigning order ${order.id} - pending for too long`);
      try {
        await autoReassignOrder(order.id, 'Provider did not respond within 30 minutes');
      } catch (reassignError) {
        console.error(`Auto-reassign failed for order ${order.id}:`, reassignError);
      }
    }

    return {
      success: true,
      processedOrders: pendingOrders.length
    };

  } catch (error) {
    console.error('Check pending orders error:', error);
    return {
      success: false,
      processedOrders: 0
    };
  }
};

// Get order statistics
const getOrderStatistics = async (startDate = null, endDate = null) => {
  try {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      select: {
        status: true,
        totalAmount: true,
        commission: true,
        createdAt: true
      }
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalCommission: orders.reduce((sum, order) => sum + (order.commission || 0), 0),
      statusBreakdown: {},
      averageOrderValue: 0,
      completionRate: 0
    };

    // Calculate status breakdown
    orders.forEach(order => {
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
    });

    // Calculate average order value
    if (orders.length > 0) {
      stats.averageOrderValue = stats.totalRevenue / orders.length;
    }

    // Calculate completion rate
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    if (orders.length > 0) {
      stats.completionRate = (completedOrders / orders.length) * 100;
    }

    return stats;

  } catch (error) {
    console.error('Get order statistics error:', error);
    throw new Error('Failed to get order statistics');
  }
};

// Get provider order statistics
const getProviderOrderStatistics = async (providerId, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      providerId
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      select: {
        status: true,
        totalAmount: true,
        commission: true,
        createdAt: true
      }
    });

    const stats = {
      totalOrders: orders.length,
      totalEarnings: orders
        .filter(order => order.status === 'COMPLETED')
        .reduce((sum, order) => sum + (order.totalAmount - (order.commission || 0)), 0),
      totalCommission: orders.reduce((sum, order) => sum + (order.commission || 0), 0),
      statusBreakdown: {},
      averageOrderValue: 0,
      completionRate: 0
    };

    // Calculate status breakdown
    orders.forEach(order => {
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
    });

    // Calculate average order value
    if (orders.length > 0) {
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      stats.averageOrderValue = totalRevenue / orders.length;
    }

    // Calculate completion rate
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    if (orders.length > 0) {
      stats.completionRate = (completedOrders / orders.length) * 100;
    }

    return stats;

  } catch (error) {
    console.error('Get provider order statistics error:', error);
    throw new Error('Failed to get provider order statistics');
  }
};

// Get customer order statistics
const getCustomerOrderStatistics = async (customerId, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      customerId
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      select: {
        status: true,
        totalAmount: true,
        createdAt: true
      }
    });

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(order => order.status === 'COMPLETED')
        .reduce((sum, order) => sum + order.totalAmount, 0),
      statusBreakdown: {},
      averageOrderValue: 0,
      completionRate: 0
    };

    // Calculate status breakdown
    orders.forEach(order => {
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
    });

    // Calculate average order value
    if (orders.length > 0) {
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      stats.averageOrderValue = totalSpent / orders.length;
    }

    // Calculate completion rate
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    if (orders.length > 0) {
      stats.completionRate = (completedOrders / orders.length) * 100;
    }

    return stats;

  } catch (error) {
    console.error('Get customer order statistics error:', error);
    throw new Error('Failed to get customer order statistics');
  }
};

// Get top providers by orders
const getTopProviders = async (limit = 10, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const topProviders = await prisma.orders.groupBy({
      by: ['providerId'],
      where: whereClause,
      _count: { providerId: true },
      _sum: { totalAmount: true },
      orderBy: {
        _count: {
          providerId: 'desc'
        }
      },
      take: limit
    });

    // Get provider details
    const providerIds = topProviders.map(item => item.providerId);
    const providers = await prisma.provider.findMany({
      where: {
        userId: {
          in: providerIds
        }
      },
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      }
    });

    const result = topProviders.map(item => {
      const provider = providers.find(p => p.userId === item.providerId);
      return {
        providerId: item.providerId,
        providerName: provider?.businessName || 'Unknown',
        totalOrders: item._count.providerId,
        totalRevenue: item._sum.totalAmount || 0,
        averageOrderValue: item._count.providerId > 0 ? (item._sum.totalAmount || 0) / item._count.providerId : 0,
        rating: provider?.rating || 0
      };
    });

    return result;

  } catch (error) {
    console.error('Get top providers error:', error);
    throw new Error('Failed to get top providers');
  }
};

// Get top services by orders
const getTopServices = async (limit = 10, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      status: 'COMPLETED'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const topServices = await prisma.orders.groupBy({
      by: ['serviceId'],
      where: whereClause,
      _count: { serviceId: true },
      _sum: { totalAmount: true },
      orderBy: {
        _count: {
          serviceId: 'desc'
        }
      },
      take: limit
    });

    // Get service details
    const serviceIds = topServices.map(item => item.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      },
      include: {
        providers: {
          include: {
            users: {
              include: {
                profiles: true
              }
            }
          }
        }
      }
    });

    const result = topServices.map(item => {
      const service = services.find(s => s.id === item.serviceId);
      return {
        serviceId: item.serviceId,
        serviceName: service?.name || 'Unknown',
        category: service?.category || 'Unknown',
        providerName: service?.providers?.businessName || 'Unknown',
        totalOrders: item._count.serviceId,
        totalRevenue: item._sum.totalAmount || 0,
        averageOrderValue: item._count.serviceId > 0 ? (item._sum.totalAmount || 0) / item._count.serviceId : 0,
        price: service?.price || 0
      };
    });

    return result;

  } catch (error) {
    console.error('Get top services error:', error);
    throw new Error('Failed to get top services');
  }
};

// Schedule auto-reassignment check (run every 5 minutes)
setInterval(() => {
  checkPendingOrders().catch((error) => {
    console.error('Scheduled pending order check failed:', error);
  });
}, 5 * 60 * 1000);

module.exports = {
  autoReassignOrder,
  checkPendingOrders,
  getOrderStatistics,
  getProviderOrderStatistics,
  getCustomerOrderStatistics,
  getTopProviders,
  getTopServices
};


