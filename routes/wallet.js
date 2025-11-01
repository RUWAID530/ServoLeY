const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { 
  getUserWallet, 
  addMoneyToWallet, 
  deductMoneyFromWallet, 
  checkWalletBalance,
  getWalletTransactions,
  calculateCommission
} = require('../utils/wallet');
const { 
  createPaymentOrder, 
  verifyPaymentSignature, 
  capturePayment,
  createRefund,
  getPaymentDetails
} = require('../utils/razorpay');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await getUserWallet(req.user.id);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: 'INR'
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance'
    });
  }
});

// Get wallet transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await getWalletTransactions(req.user.id, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet transactions'
    });
  }
});

// Create payment order for wallet top-up
router.post('/topup/create-order', [
  authenticateToken,
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('paymentMethod').isIn(['UPI', 'CARD', 'NET_BANKING']).withMessage('Invalid payment method')
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

    const { amount, paymentMethod } = req.body;

    // Create Razorpay order
    const orderResult = await createPaymentOrder(
      amount,
      'INR',
      `wallet_topup_${req.user.id}_${Date.now()}`
    );

    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }

    // Store payment order in database for verification
    await prisma.paymentOrder.create({
      data: {
        userId: req.user.id,
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        paymentMethod,
        status: 'PENDING',
        type: 'WALLET_TOPUP'
      }
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create top-up order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment and add money to wallet
router.post('/topup/verify', [
  authenticateToken,
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required')
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

    const { orderId, paymentId, signature } = req.body;

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment order from database
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        orderId,
        userId: req.user.id,
        status: 'PENDING'
      }
    });

    if (!paymentOrder) {
      return res.status(404).json({
        success: false,
        message: 'Payment order not found'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get payment details'
      });
    }

    // Add money to wallet
    const addResult = await addMoneyToWallet(
      req.user.id,
      paymentDetails.amount,
      paymentOrder.paymentMethod,
      paymentId
    );

    if (!addResult.success) {
      return res.status(400).json({
        success: false,
        message: addResult.message
      });
    }

    // Update payment order status
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: 'COMPLETED',
        paymentId,
        signature
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and money added to wallet',
      data: {
        amount: addResult.amount,
        newBalance: addResult.newBalance,
        paymentId
      }
    });

  } catch (error) {
    console.error('Verify top-up payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Check balance before booking
router.post('/check-balance', [
  authenticateToken,
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
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

    const { amount } = req.body;

    const balanceCheck = await checkWalletBalance(req.user.id, amount);
    
    res.json({
      success: true,
      data: {
        hasSufficientBalance: balanceCheck.hasSufficientBalance,
        currentBalance: balanceCheck.currentBalance,
        required: balanceCheck.required,
        shortfall: balanceCheck.shortfall
      }
    });

  } catch (error) {
    console.error('Check balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check balance'
    });
  }
});

// Calculate commission (for admin/provider)
router.get('/commission/calculate', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be a number'
      });
    }

    const commission = calculateCommission(parseFloat(amount));
    
    res.json({
      success: true,
      data: commission
    });

  } catch (error) {
    console.error('Calculate commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission'
    });
  }
});

// Get transaction summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { getTransactionSummary } = require('../utils/transactions');
    const summary = await getTransactionSummary(req.user.id, startDate, endDate);
    
    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction summary'
    });
  }
});

// Provider: Get earnings summary
router.get('/earnings', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { getProviderEarningsSummary } = require('../utils/transactions');
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const earnings = await getProviderEarningsSummary(provider.id, startDate, endDate);
    
    res.json({
      success: true,
      data: earnings
    });

  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings summary'
    });
  }
});

// Admin: Get platform revenue
router.get('/admin/revenue', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { getPlatformRevenueSummary } = require('../utils/transactions');
    const revenue = await getPlatformRevenueSummary(startDate, endDate);
    
    res.json({
      success: true,
      data: revenue
    });

  } catch (error) {
    console.error('Get platform revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform revenue'
    });
  }
});

// Admin: Get all transactions
router.get('/admin/transactions', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (type) whereClause.type = type;
    if (userId) {
      whereClause.wallet = {
        userId
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
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
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

module.exports = router;

// Aliases per spec
// Add money placeholder (Razorpay intent)
router.post('/add-money', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    // Placeholder: return a fake order id to simulate intent
    return res.json({ success: true, data: { orderId: `rzp_test_${Date.now()}`, amount } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create top-up intent' });
  }
});

// Withdraw
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    // Deduct and create transaction
    await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { decrement: amount } }
    });
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'WITHDRAWAL',
        description: 'User withdrawal request'
      }
    });
    res.json({ success: true, message: 'Withdrawal requested' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to withdraw' });
  }
});

