const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { 
  createPaymentOrder, 
  verifyPaymentSignature, 
  capturePayment,
  createRefund,
  getPaymentDetails,
  validateWebhookSignature
} = require('../utils/razorpay');
const { 
  processOrderPayment,
  processRefund,
  checkWalletBalance
} = require('../utils/wallet');

const router = express.Router();

// Create payment order for service booking
router.post('/create-order', [
  authenticateToken,
  requireVerification,
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('paymentMethod').isIn(['WALLET', 'UPI', 'CARD', 'NET_BANKING']).withMessage('Invalid payment method')
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

    const { serviceId, amount, paymentMethod } = req.body;

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is not available'
      });
    }

    // Check if payment method is wallet
    if (paymentMethod === 'WALLET') {
      // Check wallet balance
      const balanceCheck = await checkWalletBalance(req.user.id, amount);
      if (!balanceCheck.hasSufficientBalance) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          shortfall: balanceCheck.shortfall
        });
      }

      // Create order directly with wallet payment
      const order = await prisma.order.create({
        data: {
          customerId: req.user.id,
          providerId: service.provider.userId,
          serviceId: service.id,
          totalAmount: amount,
          status: 'PENDING',
          serviceDate: new Date(),
          address: req.user.profile?.address || 'Address not provided'
        }
      });

      // Process payment
      const paymentResult = await processOrderPayment(
        req.user.id,
        service.provider.userId,
        amount,
        order.id
      );

      if (!paymentResult.success) {
        // Delete order if payment failed
        await prisma.order.delete({
          where: { id: order.id }
        });

        return res.status(400).json({
          success: false,
          message: paymentResult.message
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'ACCEPTED',
          commission: paymentResult.commission
        }
      });

      return res.json({
        success: true,
        message: 'Order created and payment processed',
        data: {
          orderId: order.id,
          amount: amount,
          commission: paymentResult.commission,
          providerAmount: paymentResult.providerAmount,
          paymentMethod: 'WALLET'
        }
      });
    }

    // For other payment methods, create Razorpay order
    const orderResult = await createPaymentOrder(
      amount,
      'INR',
      `service_booking_${req.user.id}_${Date.now()}`
    );

    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }

    // Store payment order in database
    await prisma.paymentOrder.create({
      data: {
        userId: req.user.id,
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        paymentMethod,
        status: 'PENDING',
        type: 'SERVICE_BOOKING',
        metadata: {
          serviceId,
          providerId: service.provider.userId
        }
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
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment and create order
router.post('/verify', [
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

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        providerId: paymentOrder.metadata.providerId,
        serviceId: paymentOrder.metadata.serviceId,
        totalAmount: paymentDetails.amount,
        status: 'PENDING',
        serviceDate: new Date(),
        address: req.user.profile?.address || 'Address not provided'
      }
    });

    // Process payment
    const paymentResult = await processOrderPayment(
      req.user.id,
      paymentOrder.metadata.providerId,
      paymentDetails.amount,
      order.id
    );

    if (!paymentResult.success) {
      // Delete order if payment failed
      await prisma.order.delete({
        where: { id: order.id }
      });

      return res.status(400).json({
        success: false,
        message: paymentResult.message
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ACCEPTED',
        commission: paymentResult.commission
      }
    });

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
      message: 'Payment verified and order created',
      data: {
        orderId: order.id,
        amount: paymentDetails.amount,
        commission: paymentResult.commission,
        providerAmount: paymentResult.providerAmount,
        paymentId
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Process refund
router.post('/refund', [
  authenticateToken,
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
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

    const { orderId, amount, reason = 'Order cancellation' } = req.body;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        provider: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customerId !== req.user.id && req.user.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to process refund for this order'
      });
    }

    // Process refund
    const refundResult = await processRefund(
      order.customerId,
      amount,
      orderId,
      reason
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user.id,
        cancelReason: reason,
        cancelledAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId,
        refundAmount: refundResult.amount,
        newBalance: refundResult.newBalance
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const paymentOrders = await prisma.paymentOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.paymentOrder.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: {
        payments: paymentOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// Razorpay webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const isValidSignature = validateWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
      
      case 'refund.created':
        console.log('Refund created:', event.payload.refund.entity.id);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook'
    });
  }
});

// Admin: Get all payments
router.get('/admin/payments', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const payments = await prisma.paymentOrder.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.paymentOrder.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get admin payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

module.exports = router;


