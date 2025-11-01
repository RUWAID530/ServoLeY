const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { processOrderPayment, processRefund } = require('../utils/wallet');
const { checkWalletBalance } = require('../utils/wallet');
const { triggerOrderNotification } = require('../utils/notificationTriggers');
const { assignVirtualNumberToOrder, releaseVirtualNumberForOrder } = require('../utils/virtualNumbers');

const router = express.Router();
// Spec aliases
router.post('/create', authenticateToken, requireVerification, async (req, res, next) => {
  // forward to main create with same validation by calling next route handler
  req.url = '/';
  next();
});

router.post('/cancel', authenticateToken, async (req, res, next) => {
  const { id, reason } = req.body || {};
  if (!id || !reason) {
    return res.status(400).json({ success: false, message: 'id and reason are required' });
  }
  req.params.id = id;
  req.body = { reason };
  req.url = `/${id}/cancel`;
  next();
});

router.post('/accept', authenticateToken, requireRole('PROVIDER'), async (req, res, next) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ success: false, message: 'id is required' });
  req.params.id = id;
  req.url = `/${id}/accept`;
  next();
});

router.post('/complete', authenticateToken, requireRole('PROVIDER'), async (req, res, next) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ success: false, message: 'id is required' });
  req.params.id = id;
  req.body = { status: 'COMPLETED' };
  req.url = `/${id}/status`;
  next();
});

// Create order
router.post('/', [
  authenticateToken,
  requireVerification,
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('serviceDate').isISO8601().withMessage('Service date must be a valid date'),
  body('address').notEmpty().withMessage('Address is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    const { serviceId, serviceDate, address, notes } = req.body;

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

    if (!service.provider.isActive || !service.provider.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Service provider is not available'
      });
    }

    // Check if service date is in the future
    const serviceDateTime = new Date(serviceDate);
    if (serviceDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Service date must be in the future'
      });
    }

    // Check wallet balance
    const balanceCheck = await checkWalletBalance(req.user.id, service.price);
    if (!balanceCheck.hasSufficientBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        shortfall: balanceCheck.shortfall
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        providerId: service.provider.userId,
        serviceId: service.id,
        totalAmount: service.price,
        serviceDate: serviceDateTime,
        address,
        notes
      }
    });

    // Process payment
    const paymentResult = await processOrderPayment(
      req.user.id,
      service.provider.userId,
      service.price,
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

    // Update order with commission details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ACCEPTED',
        commission: paymentResult.commission
      }
    });

    // Trigger order notification
    await triggerOrderNotification(order.id, 'ORDER_CREATED');

    res.status(201).json({
      success: true,
      message: 'Order created and payment processed successfully',
      data: {
        order: {
          id: order.id,
          status: 'ACCEPTED',
          totalAmount: order.totalAmount,
          commission: paymentResult.commission,
          providerAmount: paymentResult.providerAmount,
          serviceDate: order.serviceDate,
          address: order.address
        }
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
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

    // Check if user is authorized to view this order
    const isAuthorized = 
      order.customerId === req.user.id || 
      order.providerId === req.user.id || 
      req.user.userType === 'ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order'
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order'
    });
  }
});

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type = 'all' // all, customer, provider
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

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
      orderBy: { createdAt: 'desc' },
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
});

// Provider: Accept order
router.post('/:id/accept', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        providerId: req.user.id,
        status: 'PENDING'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    });

  // Assign virtual number on accept
  try {
    await assignVirtualNumberToOrder(id);
  } catch (e) {
    console.error('Virtual number assign failed:', e.message);
  }

    // Trigger order notification
    await triggerOrderNotification(id, 'ORDER_ACCEPTED');

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order'
    });
  }
});

// Provider: Reject order
router.post('/:id/reject', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('reason').notEmpty().withMessage('Rejection reason is required')
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

    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        providerId: req.user.id,
        status: 'PENDING'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already processed'
      });
    }

    // Process refund
    const refundResult = await processRefund(
      order.customerId,
      order.totalAmount,
      order.id,
      `Order rejected: ${reason}`
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'REJECTED',
        cancelledBy: req.user.id,
        cancelReason: reason,
        cancelledAt: new Date()
      }
    });

    // Increment provider cancellation count and flag suspect if needed
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        cancellationsCount: { increment: 1 },
        isSuspect: undefined
      }
    });
    const updatedProvider = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (updatedProvider && updatedProvider.cancellationsCount > 3 && !updatedProvider.isSuspect) {
      await prisma.user.update({ where: { id: req.user.id }, data: { isSuspect: true } });
    }

    res.json({
      success: true,
      message: 'Order rejected and refund processed',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order'
    });
  }
});

// Provider: Update order status
router.put('/:id/status', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('status').isIn(['IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status')
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

    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        providerId: req.user.id,
        status: {
          in: ['ACCEPTED', 'IN_PROGRESS']
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or invalid status transition'
      });
    }

    const updateData = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Trigger order notification
    await triggerOrderNotification(id, status === 'IN_PROGRESS' ? 'ORDER_IN_PROGRESS' : 'ORDER_COMPLETED');

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });

  // Release virtual number on completion
  if (status === 'COMPLETED') {
    try {
      await releaseVirtualNumberForOrder(id);
    } catch (e) {
      console.error('Virtual number release failed:', e.message);
    }
  }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Customer: Cancel order
router.post('/:id/cancel', [
  authenticateToken,
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

    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: req.user.id,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    // Process refund
    const refundResult = await processRefund(
      order.customerId,
      order.totalAmount,
      order.id,
      `Order cancelled: ${reason}`
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user.id,
        cancelReason: reason,
        cancelledAt: new Date()
      }
    });

    // Increment cancellation count and flag suspect if needed
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        cancellationsCount: { increment: 1 },
        isSuspect: undefined
      }
    });
    // Fetch updated user to compute suspect flag
    const updatedUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (updatedUser && updatedUser.cancellationsCount > 3 && !updatedUser.isSuspect) {
      await prisma.user.update({ where: { id: req.user.id }, data: { isSuspect: true } });
    }

    res.json({
      success: true,
      message: 'Order cancelled and refund processed',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// Get order timeline
router.get('/:id/timeline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
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
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    const isAuthorized = 
      order.customerId === req.user.id || 
      order.providerId === req.user.id || 
      req.user.userType === 'ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order'
      });
    }

    // Create timeline
    const timeline = [
      {
        status: 'PENDING',
        title: 'Order Placed',
        description: 'Order has been placed and is waiting for provider acceptance',
        timestamp: order.createdAt,
        completed: true
      }
    ];

    if (order.status !== 'PENDING') {
      timeline.push({
        status: 'ACCEPTED',
        title: 'Order Accepted',
        description: 'Provider has accepted the order',
        timestamp: order.updatedAt,
        completed: true
      });
    }

    if (order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') {
      timeline.push({
        status: 'IN_PROGRESS',
        title: 'Service In Progress',
        description: 'Provider has started the service',
        timestamp: order.updatedAt,
        completed: order.status === 'COMPLETED'
      });
    }

    if (order.status === 'COMPLETED') {
      timeline.push({
        status: 'COMPLETED',
        title: 'Service Completed',
        description: 'Service has been completed successfully',
        timestamp: order.completedAt,
        completed: true
      });
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      timeline.push({
        status: order.status,
        title: order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Rejected',
        description: order.cancelReason || 'Order was cancelled/rejected',
        timestamp: order.cancelledAt,
        completed: true
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

// Admin: Get all orders
router.get('/admin/all', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      customerId, 
      providerId,
      startDate,
      endDate
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
      orderBy: { createdAt: 'desc' },
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

// Admin: Cancel order
router.post('/:id/admin/cancel', [
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

    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
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
      const refundResult = await processRefund(
        order.customerId,
        order.totalAmount,
        order.id,
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
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user.id,
        cancelReason: reason,
        cancelledAt: new Date()
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

module.exports = router;
