const { Prisma } = require('@prisma/client');
const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const normalizeAmount = (amount) => {
  const parsed = round2(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error('Invalid amount');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }
  return parsed;
};

const withSerializableTx = async (maybeTx, fn) => {
  if (maybeTx) return fn(maybeTx);
  return prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
};

const ensureWallet = async (tx, userId) =>
  tx.wallets.upsert({
    where: { userId },
    update: { updatedAt: new Date() },
    create: {
      id: randomUUID(),
      userId,
      balance: 0,
      updatedAt: new Date()
    }
  });

const createWalletTransaction = async (tx, payload) =>
  tx.transactions.create({
    data: {
      id: randomUUID(),
      walletId: payload.walletId,
      amount: round2(payload.amount),
      type: payload.type,
      description: payload.description,
      paymentMethod: payload.paymentMethod || null,
      orderId: payload.orderId || null
    }
  });

const getPlatformWallet = async (tx) => {
  const configuredAdminId = String(process.env.PLATFORM_WALLET_USER_ID || '').trim();
  let adminUser = null;

  if (configuredAdminId) {
    adminUser = await tx.users.findUnique({ where: { id: configuredAdminId } });
  }

  if (!adminUser) {
    adminUser = await tx.users.findFirst({
      where: { userType: 'ADMIN', isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  if (!adminUser) {
    const error = new Error('No active admin user configured for platform wallet');
    error.statusCode = 500;
    error.isOperational = true;
    throw error;
  }

  return ensureWallet(tx, adminUser.id);
};

const getUserWallet = async (userId) => {
  const wallet = await ensureWallet(prisma, userId);
  const transactions = await prisma.transactions.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return {
    ...wallet,
    transactions
  };
};

const addMoneyToWallet = async (userId, amount, paymentMethod, paymentId = null, options = {}) => {
  const safeAmount = normalizeAmount(amount);
  return withSerializableTx(options.tx, async (tx) => {
    const wallet = await ensureWallet(tx, userId);
    const updated = await tx.wallets.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: safeAmount },
        updatedAt: new Date()
      }
    });

    await createWalletTransaction(tx, {
      walletId: wallet.id,
      amount: safeAmount,
      type: 'CREDIT',
      paymentMethod: paymentMethod || 'WALLET',
      description: options.description || `Wallet credit via ${paymentMethod || 'WALLET'}${paymentId ? ` (${paymentId})` : ''}`,
      orderId: options.orderId || null
    });

    return {
      success: true,
      amount: safeAmount,
      newBalance: round2(updated.balance)
    };
  });
};

const deductMoneyFromWallet = async (userId, amount, description, orderId = null, options = {}) => {
  const safeAmount = normalizeAmount(amount);
  return withSerializableTx(options.tx, async (tx) => {
    const wallet = await ensureWallet(tx, userId);
    const deducted = await tx.wallets.updateMany({
      where: {
        id: wallet.id,
        balance: { gte: safeAmount }
      },
      data: {
        balance: { decrement: safeAmount },
        updatedAt: new Date()
      }
    });

    if (deducted.count !== 1) {
      const fresh = await tx.wallets.findUnique({ where: { id: wallet.id } });
      return {
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: round2(Number(fresh?.balance || 0)),
        required: safeAmount,
        shortfall: round2(Math.max(0, safeAmount - Number(fresh?.balance || 0)))
      };
    }

    const updated = await tx.wallets.findUnique({ where: { id: wallet.id } });
    await createWalletTransaction(tx, {
      walletId: wallet.id,
      amount: safeAmount,
      type: 'DEBIT',
      description: description || 'Wallet debit',
      orderId
    });

    return {
      success: true,
      amount: safeAmount,
      newBalance: round2(Number(updated?.balance || 0))
    };
  });
};

const transferMoney = async (fromUserId, toUserId, amount, description, orderId = null, options = {}) => {
  const safeAmount = normalizeAmount(amount);
  return withSerializableTx(options.tx, async (tx) => {
    const fromWallet = await ensureWallet(tx, fromUserId);
    const toWallet = await ensureWallet(tx, toUserId);

    const deducted = await tx.wallets.updateMany({
      where: { id: fromWallet.id, balance: { gte: safeAmount } },
      data: {
        balance: { decrement: safeAmount },
        updatedAt: new Date()
      }
    });

    if (deducted.count !== 1) {
      const current = await tx.wallets.findUnique({ where: { id: fromWallet.id } });
      return {
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: round2(Number(current?.balance || 0)),
        required: safeAmount,
        shortfall: round2(Math.max(0, safeAmount - Number(current?.balance || 0)))
      };
    }

    await tx.wallets.update({
      where: { id: toWallet.id },
      data: {
        balance: { increment: safeAmount },
        updatedAt: new Date()
      }
    });

    await Promise.all([
      createWalletTransaction(tx, {
        walletId: fromWallet.id,
        amount: safeAmount,
        type: 'DEBIT',
        description: description || `Transfer to user ${toUserId}`,
        orderId
      }),
      createWalletTransaction(tx, {
        walletId: toWallet.id,
        amount: safeAmount,
        type: 'CREDIT',
        description: description || `Transfer from user ${fromUserId}`,
        orderId
      })
    ]);

    const [fromAfter, toAfter] = await Promise.all([
      tx.wallets.findUnique({ where: { id: fromWallet.id } }),
      tx.wallets.findUnique({ where: { id: toWallet.id } })
    ]);

    return {
      success: true,
      amount: safeAmount,
      fromBalance: round2(Number(fromAfter?.balance || 0)),
      toBalance: round2(Number(toAfter?.balance || 0))
    };
  });
};

const checkWalletBalance = async (userId, requiredAmount) => {
  const safeAmount = normalizeAmount(requiredAmount);
  const wallet = await ensureWallet(prisma, userId);
  return {
    hasSufficientBalance: Number(wallet.balance) >= safeAmount,
    currentBalance: round2(Number(wallet.balance || 0)),
    required: safeAmount,
    shortfall: round2(Math.max(0, safeAmount - Number(wallet.balance || 0)))
  };
};

const getWalletTransactions = async (userId, page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (safePage - 1) * safeLimit;
  const wallet = await ensureWallet(prisma, userId);

  const [transactions, total] = await Promise.all([
    prisma.transactions.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit
    }),
    prisma.transactions.count({
      where: { walletId: wallet.id }
    })
  ]);

  return {
    transactions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  };
};

const calculateCommission = (amount, commissionRate = null) => {
  const safeAmount = normalizeAmount(amount);
  const configuredRate = commissionRate !== null ? Number(commissionRate) : Number(process.env.COMMISSION_RATE || 0.02);
  const rate = Number.isFinite(configuredRate) && configuredRate >= 0 && configuredRate <= 0.3 ? configuredRate : 0.02;
  const commission = round2(safeAmount * rate);
  const providerAmount = round2(safeAmount - commission);
  return {
    originalAmount: safeAmount,
    commission,
    providerAmount,
    commissionRate: rate
  };
};

const processOrderPayment = async (customerId, providerId, orderAmount, orderId, options = {}) => {
  const safeAmount = normalizeAmount(orderAmount);

  return withSerializableTx(options.tx, async (tx) => {
    const existingCommission = await tx.transactions.findFirst({
      where: { orderId, type: 'COMMISSION' }
    });

    if (existingCommission) {
      return {
        success: true,
        idempotent: true,
        orderAmount: safeAmount,
        commission: round2(existingCommission.amount || 0),
        providerAmount: round2(safeAmount - Number(existingCommission.amount || 0))
      };
    }

    const [customerWallet, providerWallet, platformWallet] = await Promise.all([
      ensureWallet(tx, customerId),
      ensureWallet(tx, providerId),
      getPlatformWallet(tx)
    ]);

    const commission = calculateCommission(safeAmount);

    const deducted = await tx.wallets.updateMany({
      where: {
        id: customerWallet.id,
        balance: { gte: safeAmount }
      },
      data: {
        balance: { decrement: safeAmount },
        updatedAt: new Date()
      }
    });

    if (deducted.count !== 1) {
      const error = new Error('Insufficient wallet balance');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    await tx.wallets.update({
      where: { id: providerWallet.id },
      data: {
        balance: { increment: commission.providerAmount },
        updatedAt: new Date()
      }
    });

    await tx.wallets.update({
      where: { id: platformWallet.id },
      data: {
        balance: { increment: commission.commission },
        updatedAt: new Date()
      }
    });

    await Promise.all([
      createWalletTransaction(tx, {
        walletId: customerWallet.id,
        amount: safeAmount,
        type: 'DEBIT',
        orderId,
        description: `Order payment debit ${orderId}`
      }),
      createWalletTransaction(tx, {
        walletId: providerWallet.id,
        amount: commission.providerAmount,
        type: 'CREDIT',
        orderId,
        description: `Order earnings credit ${orderId}`
      }),
      createWalletTransaction(tx, {
        walletId: platformWallet.id,
        amount: commission.commission,
        type: 'COMMISSION',
        orderId,
        description: `Platform commission ${orderId}`
      })
    ]);

    const [customerAfter, providerAfter] = await Promise.all([
      tx.wallets.findUnique({ where: { id: customerWallet.id } }),
      tx.wallets.findUnique({ where: { id: providerWallet.id } })
    ]);

    return {
      success: true,
      orderAmount: safeAmount,
      commission: commission.commission,
      providerAmount: commission.providerAmount,
      customerBalance: round2(Number(customerAfter?.balance || 0)),
      providerBalance: round2(Number(providerAfter?.balance || 0))
    };
  });
};

const processRefund = async (customerId, amount, orderId, reason = 'Order cancellation', options = {}) => {
  const safeAmount = normalizeAmount(amount);

  return withSerializableTx(options.tx, async (tx) => {
    const existingRefund = await tx.transactions.findFirst({
      where: { orderId, type: 'REFUND' }
    });

    if (existingRefund) {
      const customerWallet = await ensureWallet(tx, customerId);
      return {
        success: true,
        idempotent: true,
        amount: round2(existingRefund.amount || safeAmount),
        newBalance: round2(Number(customerWallet.balance || 0))
      };
    }

    const order = await tx.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      const error = new Error('Order not found for refund');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    if (round2(order.totalAmount) !== safeAmount) {
      const error = new Error('Refund amount must match order amount');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    const commissionAmount = round2(Number(order.commission || 0));
    const providerAmount = round2(safeAmount - commissionAmount);

    const [customerWallet, providerWallet, platformWallet] = await Promise.all([
      ensureWallet(tx, customerId),
      ensureWallet(tx, order.providerId),
      getPlatformWallet(tx)
    ]);

    const [providerDeducted, platformDeducted] = await Promise.all([
      tx.wallets.updateMany({
        where: {
          id: providerWallet.id,
          balance: { gte: providerAmount }
        },
        data: {
          balance: { decrement: providerAmount },
          updatedAt: new Date()
        }
      }),
      tx.wallets.updateMany({
        where: {
          id: platformWallet.id,
          balance: { gte: commissionAmount }
        },
        data: {
          balance: { decrement: commissionAmount },
          updatedAt: new Date()
        }
      })
    ]);

    if (providerDeducted.count !== 1 || platformDeducted.count !== 1) {
      const error = new Error('Unable to reverse settled funds for refund');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    await tx.wallets.update({
      where: { id: customerWallet.id },
      data: {
        balance: { increment: safeAmount },
        updatedAt: new Date()
      }
    });

    await Promise.all([
      createWalletTransaction(tx, {
        walletId: customerWallet.id,
        amount: safeAmount,
        type: 'REFUND',
        orderId,
        description: `Refund credit ${orderId}: ${reason}`
      }),
      createWalletTransaction(tx, {
        walletId: providerWallet.id,
        amount: providerAmount,
        type: 'DEBIT',
        orderId,
        description: `Refund reversal provider debit ${orderId}`
      }),
      createWalletTransaction(tx, {
        walletId: platformWallet.id,
        amount: commissionAmount,
        type: 'DEBIT',
        orderId,
        description: `Refund reversal commission debit ${orderId}`
      })
    ]);

    const customerAfter = await tx.wallets.findUnique({ where: { id: customerWallet.id } });

    return {
      success: true,
      amount: safeAmount,
      newBalance: round2(Number(customerAfter?.balance || 0))
    };
  });
};

module.exports = {
  getUserWallet,
  addMoneyToWallet,
  deductMoneyFromWallet,
  transferMoney,
  checkWalletBalance,
  getWalletTransactions,
  calculateCommission,
  processOrderPayment,
  processRefund
};
