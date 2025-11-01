const { prisma } = require('../config/database');

// Create transaction
const createTransaction = async (transactionData) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        walletId: transactionData.walletId,
        amount: transactionData.amount,
        type: transactionData.type,
        description: transactionData.description,
        paymentMethod: transactionData.paymentMethod,
        orderId: transactionData.orderId
      }
    });

    console.log(`Transaction created: ${transaction.type} - ₹${transaction.amount}`);
    return transaction;
  } catch (error) {
    console.error('Create transaction error:', error);
    throw new Error('Failed to create transaction');
  }
};

// Get transaction by ID
const getTransactionById = async (transactionId) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
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

    return transaction;
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    throw new Error('Failed to get transaction');
  }
};

// Get transactions by wallet
const getTransactionsByWallet = async (walletId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.transaction.count({
      where: { walletId }
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get transactions by wallet error:', error);
    throw new Error('Failed to get transactions');
  }
};

// Get transactions by user
const getTransactionsByUser = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          userId
        }
      },
      include: {
        wallet: {
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
      take: limit
    });

    const total = await prisma.transaction.count({
      where: {
        wallet: {
          userId
        }
      }
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get transactions by user error:', error);
    throw new Error('Failed to get transactions');
  }
};

// Get transactions by type
const getTransactionsByType = async (type, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: { type },
      include: {
        wallet: {
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
      take: limit
    });

    const total = await prisma.transaction.count({
      where: { type }
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get transactions by type error:', error);
    throw new Error('Failed to get transactions');
  }
};

// Get transactions by date range
const getTransactionsByDateRange = async (startDate, endDate, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        wallet: {
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
      take: limit
    });

    const total = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get transactions by date range error:', error);
    throw new Error('Failed to get transactions');
  }
};

// Get transaction summary
const getTransactionSummary = async (userId, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      wallet: {
        userId
      }
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        amount: true,
        type: true,
        createdAt: true
      }
    });

    const summary = {
      totalTransactions: transactions.length,
      totalCredits: 0,
      totalDebits: 0,
      totalRefunds: 0,
      totalCommission: 0,
      totalWithdrawals: 0,
      creditCount: 0,
      debitCount: 0,
      refundCount: 0,
      commissionCount: 0,
      withdrawalCount: 0
    };

    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'CREDIT':
          summary.totalCredits += transaction.amount;
          summary.creditCount++;
          break;
        case 'DEBIT':
          summary.totalDebits += transaction.amount;
          summary.debitCount++;
          break;
        case 'REFUND':
          summary.totalRefunds += transaction.amount;
          summary.refundCount++;
          break;
        case 'COMMISSION':
          summary.totalCommission += transaction.amount;
          summary.commissionCount++;
          break;
        case 'WITHDRAWAL':
          summary.totalWithdrawals += transaction.amount;
          summary.withdrawalCount++;
          break;
      }
    });

    return summary;
  } catch (error) {
    console.error('Get transaction summary error:', error);
    throw new Error('Failed to get transaction summary');
  }
};

// Get platform revenue summary
const getPlatformRevenueSummary = async (startDate = null, endDate = null) => {
  try {
    const whereClause = {
      type: 'COMMISSION'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        amount: true,
        createdAt: true,
        orderId: true
      }
    });

    const totalCommission = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalOrders = new Set(transactions.map(t => t.orderId)).size;

    return {
      totalCommission,
      totalOrders,
      averageCommissionPerOrder: totalOrders > 0 ? totalCommission / totalOrders : 0,
      transactionCount: transactions.length
    };
  } catch (error) {
    console.error('Get platform revenue summary error:', error);
    throw new Error('Failed to get platform revenue summary');
  }
};

// Get provider earnings summary
const getProviderEarningsSummary = async (providerId, startDate = null, endDate = null) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    const whereClause = {
      wallet: {
        userId: provider.userId
      },
      type: 'CREDIT'
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        amount: true,
        createdAt: true,
        description: true
      }
    });

    const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const currentBalance = provider.user.wallet?.balance || 0;

    return {
      providerId,
      providerName: provider.businessName,
      totalEarnings,
      currentBalance,
      transactionCount: transactions.length,
      averageEarningPerTransaction: transactions.length > 0 ? totalEarnings / transactions.length : 0
    };
  } catch (error) {
    console.error('Get provider earnings summary error:', error);
    throw new Error('Failed to get provider earnings summary');
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByWallet,
  getTransactionsByUser,
  getTransactionsByType,
  getTransactionsByDateRange,
  getTransactionSummary,
  getPlatformRevenueSummary,
  getProviderEarningsSummary
};


