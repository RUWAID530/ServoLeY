const { prisma } = require('../config/database');

// Generate user analytics report
const generateUserAnalytics = async (startDate = null, endDate = null) => {
  try {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get user statistics
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    const newUsers = await prisma.user.count({
      where: {
        isActive: true,
        ...whereClause
      }
    });

    const userTypeBreakdown = await prisma.user.groupBy({
      by: ['userType'],
      where: { isActive: true },
      _count: { userType: true }
    });

    const verifiedUsers = await prisma.user.count({
      where: {
        isActive: true,
        isVerified: true
      }
    });

    const blockedUsers = await prisma.user.count({
      where: {
        isActive: true,
        isBlocked: true
      }
    });

    // Get provider statistics
    const totalProviders = await prisma.provider.count({
      where: { isActive: true }
    });

    const verifiedProviders = await prisma.provider.count({
      where: {
        isActive: true,
        isVerified: true
      }
    });

    const providerCategoryBreakdown = await prisma.provider.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true }
    });

    return {
      overview: {
        totalUsers,
        newUsers,
        verifiedUsers,
        blockedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0
      },
      userTypes: userTypeBreakdown,
      providers: {
        total: totalProviders,
        verified: verifiedProviders,
        verificationRate: totalProviders > 0 ? (verifiedProviders / totalProviders) * 100 : 0,
        categories: providerCategoryBreakdown
      }
    };

  } catch (error) {
    console.error('Generate user analytics error:', error);
    throw new Error('Failed to generate user analytics');
  }
};

// Generate order analytics report
const generateOrderAnalytics = async (startDate = null, endDate = null) => {
  try {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get order statistics
    const totalOrders = await prisma.order.count({
      where: whereClause
    });

    const completedOrders = await prisma.order.count({
      where: {
        ...whereClause,
        status: 'COMPLETED'
      }
    });

    const cancelledOrders = await prisma.order.count({
      where: {
        ...whereClause,
        status: 'CANCELLED'
      }
    });

    const rejectedOrders = await prisma.order.count({
      where: {
        ...whereClause,
        status: 'REJECTED'
      }
    });

    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    // Get revenue statistics
    const revenueStats = await prisma.order.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    });

    const commissionStats = await prisma.order.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED'
      },
      _sum: { commission: true }
    });

    // Get service category breakdown
    const categoryBreakdown = await prisma.order.groupBy({
      by: ['service'],
      where: whereClause,
      _count: { service: true },
      _sum: { totalAmount: true }
    });

    const serviceIds = categoryBreakdown.map(item => item.service);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, category: true }
    });

    const categoryStats = categoryBreakdown.map(item => {
      const service = services.find(s => s.id === item.service);
      return {
        category: service?.category || 'Unknown',
        orderCount: item._count.service,
        totalRevenue: item._sum.totalAmount || 0
      };
    });

    return {
      overview: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        rejectedOrders,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
      },
      revenue: {
        totalRevenue: revenueStats._sum.totalAmount || 0,
        averageOrderValue: revenueStats._avg.totalAmount || 0,
        totalCommission: commissionStats._sum.commission || 0
      },
      statusBreakdown,
      categoryBreakdown: categoryStats
    };

  } catch (error) {
    console.error('Generate order analytics error:', error);
    throw new Error('Failed to generate order analytics');
  }
};

// Generate financial report
const generateFinancialReport = async (startDate = null, endDate = null) => {
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
    const topProviders = await prisma.order.groupBy({
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

    const providerIds = topProviders.map(item => item.providerId);
    const providers = await prisma.provider.findMany({
      where: { userId: { in: providerIds } },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    const topEarningProviders = topProviders.map(item => {
      const provider = providers.find(p => p.userId === item.providerId);
      return {
        providerId: item.providerId,
        providerName: provider?.businessName || 'Unknown',
        totalEarnings: item._sum.totalAmount || 0,
        orderCount: item._count.id,
        averageOrderValue: item._count.id > 0 ? (item._sum.totalAmount || 0) / item._count.id : 0
      };
    });

    return {
      revenue: {
        totalRevenue: revenueStats._sum.totalAmount || 0,
        averageOrderValue: revenueStats._avg.totalAmount || 0,
        totalOrders: revenueStats._count.id,
        totalCommission: commissionStats._sum.commission || 0,
        commissionRate: revenueStats._sum.totalAmount > 0 ? 
          ((commissionStats._sum.commission || 0) / revenueStats._sum.totalAmount) * 100 : 0
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
      topProviders: topEarningProviders
    };

  } catch (error) {
    console.error('Generate financial report error:', error);
    throw new Error('Failed to generate financial report');
  }
};

// Generate support analytics
const generateSupportAnalytics = async (startDate = null, endDate = null) => {
  try {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get ticket statistics
    const totalTickets = await prisma.ticket.count({
      where: whereClause
    });

    const statusBreakdown = await prisma.ticket.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    const priorityBreakdown = await prisma.ticket.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { priority: true }
    });

    // Get resolution time statistics
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        ...whereClause
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const resolutionTimes = resolvedTickets.map(ticket => {
      return new Date(ticket.updatedAt) - new Date(ticket.createdAt);
    });

    const averageResolutionTime = resolutionTimes.length > 0 ? 
      resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0;

    const medianResolutionTime = resolutionTimes.length > 0 ? 
      resolutionTimes.sort((a, b) => a - b)[Math.floor(resolutionTimes.length / 2)] : 0;

    return {
      overview: {
        totalTickets,
        resolvedTickets: resolvedTickets.length,
        resolutionRate: totalTickets > 0 ? (resolvedTickets.length / totalTickets) * 100 : 0
      },
      statusBreakdown,
      priorityBreakdown,
      resolution: {
        averageTime: Math.round(averageResolutionTime / (1000 * 60 * 60)), // in hours
        medianTime: Math.round(medianResolutionTime / (1000 * 60 * 60)), // in hours
        totalResolved: resolvedTickets.length
      }
    };

  } catch (error) {
    console.error('Generate support analytics error:', error);
    throw new Error('Failed to generate support analytics');
  }
};

// Generate comprehensive admin report
const generateAdminReport = async (startDate = null, endDate = null) => {
  try {
    const userAnalytics = await generateUserAnalytics(startDate, endDate);
    const orderAnalytics = await generateOrderAnalytics(startDate, endDate);
    const financialReport = await generateFinancialReport(startDate, endDate);
    const supportAnalytics = await generateSupportAnalytics(startDate, endDate);

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      users: userAnalytics,
      orders: orderAnalytics,
      financial: financialReport,
      support: supportAnalytics,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Generate admin report error:', error);
    throw new Error('Failed to generate admin report');
  }
};

// Export report to CSV
const exportReportToCSV = async (reportType, startDate = null, endDate = null) => {
  try {
    let data = [];
    let filename = '';

    switch (reportType) {
      case 'users':
        const users = await prisma.user.findMany({
          where: {
            ...(startDate && endDate && {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          },
          include: {
            profile: true,
            provider: true
          }
        });

        data = users.map(user => ({
          id: user.id,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          isVerified: user.isVerified,
          isActive: user.isActive,
          isBlocked: user.isBlocked,
          businessName: user.provider?.businessName || '',
          category: user.provider?.category || '',
          createdAt: user.createdAt
        }));
        filename = `users_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'orders':
        const orders = await prisma.order.findMany({
          where: {
            ...(startDate && endDate && {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          },
          include: {
            customer: {
              include: { profile: true }
            },
            provider: {
              include: {
                user: { include: { profile: true } }
              }
            },
            service: true
          }
        });

        data = orders.map(order => ({
          id: order.id,
          customerName: `${order.customer.profile?.firstName || ''} ${order.customer.profile?.lastName || ''}`,
          providerName: order.provider?.businessName || '',
          serviceName: order.service?.name || '',
          status: order.status,
          totalAmount: order.totalAmount,
          commission: order.commission,
          createdAt: order.createdAt,
          completedAt: order.completedAt
        }));
        filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'transactions':
        const transactions = await prisma.transaction.findMany({
          where: {
            ...(startDate && endDate && {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            })
          },
          include: {
            wallet: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        });

        data = transactions.map(transaction => ({
          id: transaction.id,
          userId: transaction.wallet.userId,
          userName: `${transaction.wallet.user.profile?.firstName || ''} ${transaction.wallet.user.profile?.lastName || ''}`,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt
        }));
        filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    // Convert to CSV format
    if (data.length === 0) {
      return { csv: '', filename };
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    const csv = [csvHeaders, ...csvRows].join('\n');

    return { csv, filename };

  } catch (error) {
    console.error('Export report to CSV error:', error);
    throw new Error('Failed to export report to CSV');
  }
};

module.exports = {
  generateUserAnalytics,
  generateOrderAnalytics,
  generateFinancialReport,
  generateSupportAnalytics,
  generateAdminReport,
  exportReportToCSV
};


