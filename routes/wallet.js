const express = require('express');
const { body, validationResult } = require('express-validator');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { paymentMethodLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { randomUUID } = require('crypto');
const { requireIdempotency } = require('../middleware/idempotency');
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
const round2 = (value) => Math.round(Number(value) * 100) / 100;
const isMockPaymentEnabled = () => ['true', '1', 'yes'].includes(String(process.env.MOCK_PAYMENT || '').trim().toLowerCase());
const mockPaymentMethodsByUser = new Map();

const getMockPaymentMethods = (userId) => {
  const key = String(userId || '').trim();
  if (!mockPaymentMethodsByUser.has(key)) {
    mockPaymentMethodsByUser.set(key, []);
  }
  return mockPaymentMethodsByUser.get(key);
};

const mapPaymentMethodForClient = (method) => ({
  id: method.id,
  type: method.type,
  provider: method.provider || '',
  upiId: method.upiId || '',
  cardName: method.cardName || '',
  cardNumber: method.cardNumber || '',
  expiryMonth: method.expiryMonth || '',
  expiryYear: method.expiryYear || '',
  last4: method.last4 || '',
  isDefault: Boolean(method.isDefault),
  isActive: Boolean(method.isActive),
  createdAt: method.createdAt,
  updatedAt: method.updatedAt
});

const normalizeCardYear = (year) => {
  const value = String(year || '').trim();
  if (!value) return '';
  if (/^\d{2}$/.test(value)) {
    return `20${value}`;
  }
  if (/^\d{4}$/.test(value)) {
    return value;
  }
  return '';
};

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

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

// Get user's saved payment methods
router.get('/payment-methods', authenticateToken, paymentMethodLimiter, async (req, res) => {
  try {
    if (isMockPaymentEnabled()) {
      const methods = getMockPaymentMethods(req.user.id)
        .filter((method) => method.isActive)
        .sort((a, b) => {
          if (Boolean(a.isDefault) !== Boolean(b.isDefault)) {
            return a.isDefault ? -1 : 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      return res.json({
        success: true,
        data: {
          paymentMethods: methods.map(mapPaymentMethodForClient)
        }
      });
    }

    const methods = await prisma.user_payment_methods.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return res.json({
      success: true,
      data: {
        paymentMethods: methods.map(mapPaymentMethodForClient)
      }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    // MVP-safe fallback: don't block wallet screen if payment methods store is unavailable.
    return res.json({
      success: true,
      data: {
        paymentMethods: []
      }
    });
  }
});

// Add a payment method
router.post('/payment-methods', strictBody([
  authenticateToken,
  paymentMethodLimiter,
  body('type').isIn(['UPI', 'CARD', 'NET_BANKING']).withMessage('Invalid payment method type'),
  body('isDefault').optional().isBoolean(),
  body('upiId').optional().isString().trim().isLength({ max: 100 }),
  body('provider').optional().isString().trim().isLength({ max: 100 }),
  body('cardNumber').optional().isString().trim().isLength({ max: 32 }),
  body('cardName').optional().isString().trim().isLength({ max: 80 }),
  body('expiryMonth').optional().isString().trim().isLength({ max: 2 }),
  body('expiryYear').optional().isString().trim().isLength({ max: 4 }),
  body('bankName').optional().isString().trim().isLength({ max: 120 }),
  body('accountHolderName').optional().isString().trim().isLength({ max: 80 }),
  body('accountNumber').optional().isString().trim().isLength({ max: 24 }),
  body('ifsc').optional().isString().trim().isLength({ max: 16 })
]), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const type = String(req.body.type || '').toUpperCase();
    const isDefaultRequested = Boolean(req.body.isDefault);
    const now = new Date();

    let provider = null;
    let upiId = null;
    let cardNumber = null;
    let cardName = null;
    let expiryMonth = null;
    let expiryYear = null;
    let last4 = null;

    if (type === 'UPI') {
      const rawUpiId = String(req.body.upiId || '').trim().toLowerCase();
      if (!rawUpiId || !rawUpiId.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid UPI ID is required'
        });
      }
      upiId = rawUpiId;
      provider = String(req.body.provider || 'UPI').trim() || 'UPI';
      last4 = rawUpiId.slice(-4);
    } else if (type === 'CARD') {
      const digits = onlyDigits(req.body.cardNumber);
      const name = String(req.body.cardName || '').trim();
      const monthRaw = String(req.body.expiryMonth || '').trim();
      const yearRaw = normalizeCardYear(req.body.expiryYear);

      if (!digits || digits.length < 12 || digits.length > 19) {
        return res.status(400).json({
          success: false,
          message: 'Valid card number is required'
        });
      }
      if (!name || name.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Card holder name is required'
        });
      }
      const month = Number(monthRaw);
      if (!monthRaw || !Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Valid expiry month is required'
        });
      }
      if (!yearRaw) {
        return res.status(400).json({
          success: false,
          message: 'Valid expiry year is required'
        });
      }

      cardName = name;
      expiryMonth = String(month).padStart(2, '0');
      expiryYear = yearRaw;
      last4 = digits.slice(-4);
      cardNumber = `**** **** **** ${last4}`;
      provider = String(req.body.provider || 'Card').trim() || 'Card';
    } else if (type === 'NET_BANKING') {
      const bankName = String(req.body.bankName || '').trim();
      const accountHolderName = String(req.body.accountHolderName || '').trim();
      const accountDigits = onlyDigits(req.body.accountNumber);
      const ifsc = String(req.body.ifsc || '').trim().toUpperCase();

      if (!bankName) {
        return res.status(400).json({
          success: false,
          message: 'Bank name is required'
        });
      }
      if (!accountHolderName || accountHolderName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Account holder name is required'
        });
      }
      if (!accountDigits || accountDigits.length < 6 || accountDigits.length > 18) {
        return res.status(400).json({
          success: false,
          message: 'Valid account number is required'
        });
      }

      provider = ifsc ? `${bankName} (${ifsc})` : bankName;
      cardName = accountHolderName;
      last4 = accountDigits.slice(-4);
      cardNumber = `A/C ****${last4}`;
    }

    if (isMockPaymentEnabled()) {
      const methods = getMockPaymentMethods(req.user.id);
      const activeMethods = methods.filter((method) => method.isActive);
      const shouldSetDefault = isDefaultRequested || activeMethods.length === 0;

      if (shouldSetDefault) {
        activeMethods.forEach((method) => {
          method.isDefault = false;
          method.updatedAt = now;
        });
      }

      const created = {
        id: randomUUID(),
        userId: req.user.id,
        type,
        provider,
        upiId,
        cardNumber,
        cardName,
        expiryMonth,
        expiryYear,
        last4,
        isDefault: shouldSetDefault,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      methods.unshift(created);

      return res.status(201).json({
        success: true,
        message: 'Payment method added successfully',
        data: mapPaymentMethodForClient(created)
      });
    }

    const existingActiveMethodsCount = await prisma.user_payment_methods.count({
      where: {
        userId: req.user.id,
        isActive: true
      }
    });

    const shouldSetDefault = isDefaultRequested || existingActiveMethodsCount === 0;
    if (shouldSetDefault) {
      await prisma.user_payment_methods.updateMany({
        where: {
          userId: req.user.id,
          isActive: true
        },
        data: {
          isDefault: false,
          updatedAt: now
        }
      });
    }

    const created = await prisma.user_payment_methods.create({
      data: {
        id: randomUUID(),
        userId: req.user.id,
        type,
        provider,
        upiId,
        cardNumber,
        cardName,
        expiryMonth,
        expiryYear,
        last4,
        isDefault: shouldSetDefault,
        isActive: true,
        updatedAt: now
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: mapPaymentMethodForClient(created)
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add payment method'
    });
  }
});

// Set a payment method as default
router.put('/payment-methods/:methodId/set-default', authenticateToken, paymentMethodLimiter, async (req, res) => {
  try {
    const { methodId } = req.params;
    const now = new Date();

    if (isMockPaymentEnabled()) {
      const methods = getMockPaymentMethods(req.user.id);
      const method = methods.find((item) => item.id === methodId && item.isActive);

      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      methods.forEach((item) => {
        if (item.isActive) {
          item.isDefault = false;
          item.updatedAt = now;
        }
      });

      method.isDefault = true;
      method.updatedAt = now;

      return res.json({
        success: true,
        message: 'Default payment method updated',
        data: mapPaymentMethodForClient(method)
      });
    }

    const method = await prisma.user_payment_methods.findFirst({
      where: {
        id: methodId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await prisma.user_payment_methods.updateMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      data: {
        isDefault: false,
        updatedAt: now
      }
    });

    const updated = await prisma.user_payment_methods.update({
      where: { id: methodId },
      data: {
        isDefault: true,
        updatedAt: now
      }
    });

    return res.json({
      success: true,
      message: 'Default payment method updated',
      data: mapPaymentMethodForClient(updated)
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update default payment method'
    });
  }
});

// Remove a payment method
router.delete('/payment-methods/:methodId', authenticateToken, paymentMethodLimiter, async (req, res) => {
  try {
    const { methodId } = req.params;
    const now = new Date();

    if (isMockPaymentEnabled()) {
      const methods = getMockPaymentMethods(req.user.id);
      const index = methods.findIndex((item) => item.id === methodId && item.isActive);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      const removed = methods[index];
      methods.splice(index, 1);

      if (removed.isDefault) {
        const fallback = methods.find((item) => item.isActive);
        if (fallback) {
          fallback.isDefault = true;
          fallback.updatedAt = now;
        }
      }

      return res.json({
        success: true,
        message: 'Payment method removed'
      });
    }

    const method = await prisma.user_payment_methods.findFirst({
      where: {
        id: methodId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await prisma.user_payment_methods.update({
      where: { id: method.id },
      data: {
        isActive: false,
        isDefault: false,
        updatedAt: now
      }
    });

    if (method.isDefault) {
      const fallbackMethod = await prisma.user_payment_methods.findFirst({
        where: {
          userId: req.user.id,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (fallbackMethod) {
        await prisma.user_payment_methods.update({
          where: { id: fallbackMethod.id },
          data: {
            isDefault: true,
            updatedAt: now
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Payment method removed'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove payment method'
    });
  }
});

// Create payment order for wallet top-up
router.post('/topup/create-order', strictBody([
  authenticateToken,
  requireIdempotency('wallet_topup_create_order'),
  body('amount').isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be at least Rs 1'),
  body('paymentMethod').isIn(['UPI', 'CARD', 'NET_BANKING']).withMessage('Invalid payment method')
]), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentMethod } = req.body;
    const amount = round2(req.body.amount);

    // Create Razorpay order (or mock order in local/dev fallback mode)
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

    if (orderResult.isMock) {
      const paymentId = `mock_payment_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const result = await prisma.$transaction(async (tx) => {
        await tx.payment_orders.create({
          data: {
            id: randomUUID(),
            userId: req.user.id,
            orderId: orderResult.orderId,
            paymentId,
            amount: round2(orderResult.amount),
            currency: orderResult.currency,
            paymentMethod,
            status: 'COMPLETED',
            type: 'WALLET_TOPUP',
            signature: 'mock_signature',
            metadata: { mode: 'mock' },
            updatedAt: new Date()
          }
        });

        return addMoneyToWallet(
          req.user.id,
          amount,
          paymentMethod,
          paymentId,
          {
            tx,
            description: `Wallet top-up ${orderResult.orderId}`
          }
        );
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      return res.json({
        success: true,
        message: 'Wallet top-up completed (mock mode)',
        data: {
          orderId: orderResult.orderId,
          amount: round2(orderResult.amount),
          currency: orderResult.currency,
          credited: true,
          newBalance: result.newBalance,
          mock: true,
          key: null
        }
      });
    }

    // Real gateway flow: store payment order in pending state for later verification.
    await prisma.payment_orders.create({
      data: {
        id: randomUUID(),
        userId: req.user.id,
        orderId: orderResult.orderId,
        amount: round2(orderResult.amount),
        currency: orderResult.currency,
        paymentMethod,
        status: 'PENDING',
        type: 'WALLET_TOPUP',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.orderId,
        amount: round2(orderResult.amount),
        currency: orderResult.currency,
        key: process.env.RAZORPAY_KEY_ID || null,
        credited: false,
        mock: false
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
router.post('/topup/verify', strictBody([
  authenticateToken,
  requireIdempotency('wallet_topup_verify'),
  body('orderId').isString().trim().isLength({ min: 1, max: 128 }).withMessage('Order ID is required'),
  body('paymentId').isString().trim().isLength({ min: 1, max: 128 }).withMessage('Payment ID is required'),
  body('signature').isString().trim().isLength({ min: 1, max: 512 }).withMessage('Signature is required')
]), async (req, res) => {
  let claimedPaymentOrderId = null;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const orderId = String(req.body.orderId || '').trim();
    const paymentId = String(req.body.paymentId || '').trim();
    const signature = String(req.body.signature || '').trim();

    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const paymentDetails = await getPaymentDetails(paymentId);
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get payment details'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const paymentOrder = await tx.payment_orders.findFirst({
        where: {
          orderId,
          userId: req.user.id,
          type: 'WALLET_TOPUP'
        }
      });

      if (!paymentOrder) {
        const error = new Error('Payment order not found');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
      }

      if (paymentOrder.status === 'COMPLETED') {
        const wallet = await tx.wallets.findUnique({ where: { userId: req.user.id } });
        return {
          idempotent: true,
          amount: round2(paymentOrder.amount),
          newBalance: round2(Number(wallet?.balance || 0)),
          paymentId: paymentOrder.paymentId || paymentId
        };
      }

      const claim = await tx.payment_orders.updateMany({
        where: {
          id: paymentOrder.id,
          status: 'PENDING'
        },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date()
        }
      });

      if (claim.count !== 1) {
        const error = new Error('Payment is being processed already');
        error.statusCode = 409;
        error.isOperational = true;
        throw error;
      }
      claimedPaymentOrderId = paymentOrder.id;

      const expectedAmount = round2(paymentOrder.amount);
      const capturedAmount = paymentDetails.amount == null
        ? expectedAmount
        : round2(paymentDetails.amount);
      if (expectedAmount !== capturedAmount) {
        const error = new Error('Captured amount mismatch');
        error.statusCode = 409;
        error.isOperational = true;
        throw error;
      }

      const addResult = await addMoneyToWallet(
        req.user.id,
        expectedAmount,
        paymentOrder.paymentMethod,
        paymentId,
        {
          tx,
          description: `Wallet top-up ${orderId}`
        }
      );

      await tx.payment_orders.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'COMPLETED',
          paymentId,
          signature,
          updatedAt: new Date()
        }
      });

      return {
        idempotent: false,
        amount: addResult.amount,
        newBalance: addResult.newBalance,
        paymentId
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return res.json({
      success: true,
      message: result.idempotent ? 'Payment already verified' : 'Payment verified and money added to wallet',
      data: result
    });
  } catch (error) {
    if (claimedPaymentOrderId) {
      await prisma.payment_orders.updateMany({
        where: {
          id: claimedPaymentOrderId,
          status: 'PROCESSING'
        },
        data: {
          status: 'FAILED',
          updatedAt: new Date()
        }
      }).catch(() => {});
    }

    return res.status(Number(error.statusCode || 500)).json({
      success: false,
      message: error.isOperational ? error.message : 'Failed to verify payment'
    });
  }
});

// Check balance before booking
router.post('/check-balance', strictBody([
  authenticateToken,
  body('amount').isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be at least Rs 1')
]), async (req, res) => {
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
    const provider = await prisma.providers.findUnique({
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

    const transactions = await prisma.transactions.findMany({
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

    const total = await prisma.transactions.count({
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

// Aliases per spec
// Add money placeholder (Razorpay intent)
router.post(
  '/add-money',
  authenticateToken,
  requireIdempotency('wallet_add_money_intent'),
  strictBody([body('amount').isFloat({ min: 1, max: 1000000 })]),
  async (req, res) => {
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
router.post(
  '/withdraw',
  authenticateToken,
  requireIdempotency('wallet_withdraw'),
  strictBody([body('amount').isFloat({ min: 1, max: 1000000 })]),
  async (req, res) => {
  try {
    const amount = round2(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallets.upsert({
        where: { userId: req.user.id },
        update: { updatedAt: new Date() },
        create: {
          id: randomUUID(),
          userId: req.user.id,
          balance: 0,
          updatedAt: new Date()
        }
      });

      const deducted = await tx.wallets.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount },
          updatedAt: new Date()
        }
      });

      if (deducted.count !== 1) {
        const error = new Error('Insufficient balance');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
      }

      await tx.transactions.create({
        data: {
          id: randomUUID(),
          walletId: wallet.id,
          amount,
          type: 'WITHDRAWAL',
          description: 'User withdrawal request'
        }
      });

      const updated = await tx.wallets.findUnique({ where: { id: wallet.id } });
      return {
        amount,
        newBalance: round2(Number(updated?.balance || 0))
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return res.json({
      success: true,
      message: 'Withdrawal requested',
      data: result
    });
  } catch (e) {
    return res.status(Number(e.statusCode || 500)).json({
      success: false,
      message: e.isOperational ? e.message : 'Failed to withdraw'
    });
  }
});

module.exports = router;
