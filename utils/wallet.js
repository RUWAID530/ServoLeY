const { prisma } = require('../config/database');
const { createTransaction } = require('./transactions');

// Get user wallet
const getUserWallet = async (userId) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        }
      });
      return newWallet;
    }

    return wallet;
  } catch (error) {
    console.error('Get wallet error:', error);
    throw new Error('Failed to get wallet');
  }
};

// Add money to wallet
const addMoneyToWallet = async (userId, amount, paymentMethod, paymentId = null) => {
  try {
    const wallet = await getUserWallet(userId);
    
    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Create transaction record
    await createTransaction({
      walletId: wallet.id,
      amount,
      type: 'CREDIT',
      description: `Wallet top-up via ${paymentMethod}`,
      paymentMethod,
      paymentId
    });

    console.log(`Added ₹${amount} to wallet for user ${userId}`);
    return {
      success: true,
      newBalance: updatedWallet.balance,
      amount
    };
  } catch (error) {
    console.error('Add money to wallet error:', error);
    throw new Error('Failed to add money to wallet');
  }
};

// Deduct money from wallet
const deductMoneyFromWallet = async (userId, amount, description, orderId = null) => {
  try {
    const wallet = await getUserWallet(userId);
    
    // Check if sufficient balance
    if (wallet.balance < amount) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: wallet.balance,
        required: amount
      };
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // Create transaction record
    await createTransaction({
      walletId: wallet.id,
      amount,
      type: 'DEBIT',
      description,
      orderId
    });

    console.log(`Deducted ₹${amount} from wallet for user ${userId}`);
    return {
      success: true,
      newBalance: updatedWallet.balance,
      amount
    };
  } catch (error) {
    console.error('Deduct money from wallet error:', error);
    throw new Error('Failed to deduct money from wallet');
  }
};

// Transfer money between wallets
const transferMoney = async (fromUserId, toUserId, amount, description, orderId = null) => {
  try {
    // Deduct from sender
    const deductResult = await deductMoneyFromWallet(
      fromUserId, 
      amount, 
      `Transfer to user ${toUserId}`,
      orderId
    );

    if (!deductResult.success) {
      return deductResult;
    }

    // Add to receiver
    const addResult = await addMoneyToWallet(
      toUserId,
      amount,
      'WALLET',
      null
    );

    if (!addResult.success) {
      // Refund the deduction if add failed
      await addMoneyToWallet(
        fromUserId,
        amount,
        'WALLET',
        null
      );
      return {
        success: false,
        message: 'Transfer failed, amount refunded'
      };
    }

    console.log(`Transferred ₹${amount} from user ${fromUserId} to user ${toUserId}`);
    return {
      success: true,
      amount,
      fromBalance: deductResult.newBalance,
      toBalance: addResult.newBalance
    };
  } catch (error) {
    console.error('Transfer money error:', error);
    throw new Error('Failed to transfer money');
  }
};

// Check wallet balance
const checkWalletBalance = async (userId, requiredAmount) => {
  try {
    const wallet = await getUserWallet(userId);
    
    return {
      hasSufficientBalance: wallet.balance >= requiredAmount,
      currentBalance: wallet.balance,
      required: requiredAmount,
      shortfall: Math.max(0, requiredAmount - wallet.balance)
    };
  } catch (error) {
    console.error('Check wallet balance error:', error);
    throw new Error('Failed to check wallet balance');
  }
};

// Get wallet transactions
const getWalletTransactions = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const wallet = await getUserWallet(userId);

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.transaction.count({
      where: { walletId: wallet.id }
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
    console.error('Get wallet transactions error:', error);
    throw new Error('Failed to get wallet transactions');
  }
};

// Calculate commission
const calculateCommission = (amount, commissionRate = 0.02) => {
  const commission = amount * commissionRate;
  const providerAmount = amount - commission;
  
  return {
    originalAmount: amount,
    commission: Math.round(commission * 100) / 100, // Round to 2 decimal places
    providerAmount: Math.round(providerAmount * 100) / 100,
    commissionRate
  };
};

// Process order payment
const processOrderPayment = async (customerId, providerId, orderAmount, orderId) => {
  try {
    // Check customer balance
    const balanceCheck = await checkWalletBalance(customerId, orderAmount);
    if (!balanceCheck.hasSufficientBalance) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
        shortfall: balanceCheck.shortfall
      };
    }

    // Calculate commission
    const commission = calculateCommission(orderAmount);
    
    // Deduct from customer
    const deductResult = await deductMoneyFromWallet(
      customerId,
      orderAmount,
      `Payment for order ${orderId}`,
      orderId
    );

    if (!deductResult.success) {
      return deductResult;
    }

    // Add to provider (after commission)
    const addResult = await addMoneyToWallet(
      providerId,
      commission.providerAmount,
      'WALLET',
      null
    );

    if (!addResult.success) {
      // Refund customer if provider payment failed
      await addMoneyToWallet(
        customerId,
        orderAmount,
        'WALLET',
        null
      );
      return {
        success: false,
        message: 'Payment processing failed, amount refunded'
      };
    }

    // Record commission transaction
    await createTransaction({
      walletId: null, // Platform wallet
      amount: commission.commission,
      type: 'COMMISSION',
      description: `Platform commission for order ${orderId}`,
      orderId
    });

    console.log(`Processed order payment: ₹${orderAmount}, Commission: ₹${commission.commission}`);
    return {
      success: true,
      orderAmount,
      commission: commission.commission,
      providerAmount: commission.providerAmount,
      customerBalance: deductResult.newBalance,
      providerBalance: addResult.newBalance
    };
  } catch (error) {
    console.error('Process order payment error:', error);
    throw new Error('Failed to process order payment');
  }
};

// Process refund
const processRefund = async (customerId, amount, orderId, reason = 'Order cancellation') => {
  try {
    // Add money back to customer wallet
    const refundResult = await addMoneyToWallet(
      customerId,
      amount,
      'WALLET',
      null
    );

    if (!refundResult.success) {
      return refundResult;
    }

    // Create refund transaction
    await createTransaction({
      walletId: null, // Platform wallet
      amount,
      type: 'REFUND',
      description: `Refund for order ${orderId}: ${reason}`,
      orderId
    });

    console.log(`Processed refund: ₹${amount} to customer ${customerId}`);
    return {
      success: true,
      amount,
      newBalance: refundResult.newBalance
    };
  } catch (error) {
    console.error('Process refund error:', error);
    throw new Error('Failed to process refund');
  }
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


