const crypto = require('crypto');
const express = require('express');
const { randomUUID } = require('crypto');
const { body, validationResult } = require('express-validator');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { requireIdempotency } = require('../middleware/idempotency');
const { assertTransition } = require('../utils/stateMachine');
const {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  validateWebhookSignature
} = require('../utils/razorpay');
const {
  processOrderPayment,
  processRefund,
  checkWalletBalance
} = require('../utils/wallet');

const router = express.Router();

const round2 = (value) => Math.round(Number(value) * 100) / 100;
const isMockPaymentEnabled = () => ['true', '1', 'yes'].includes(String(process.env.MOCK_PAYMENT || '').trim().toLowerCase());

const validate = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
};

const resolveServiceForCheckout = async (serviceId) => {
  const service = await prisma.services.findUnique({
    where: { id: serviceId },
    include: { providers: true }
  });

  if (!service) return { error: 'Service not found', statusCode: 404 };

  const isActiveService =
    service.isActive === true &&
    String(service.status || '').toUpperCase() === 'ACTIVE';

  if (!isActiveService) {
    return { error: 'Service is not available', statusCode: 400 };
  }

  const providerUserId = service.providers?.userId;
  if (!providerUserId) {
    return { error: 'Provider is not available for this service', statusCode: 400 };
  }

  const amount = round2(service.price);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Invalid service pricing', statusCode: 400 };
  }

  return {
    service,
    providerUserId,
    amount
  };
};

router.post(
  '/create-order',
  strictBody([
    authenticateToken,
    requireVerification,
    requireIdempotency('payments_create_order'),
    body('serviceId').isString().trim().isLength({ min: 1, max: 64 }).withMessage('Service ID is required'),
    body('paymentMethod').isIn(['WALLET', 'UPI', 'CARD', 'NET_BANKING']).withMessage('Invalid payment method')
  ]),
  async (req, res) => {
    try {
      const failed = validate(req, res);
      if (failed) return failed;

      const serviceId = String(req.body.serviceId || '').trim();
      const paymentMethod = String(req.body.paymentMethod || '').trim().toUpperCase();
      const resolved = await resolveServiceForCheckout(serviceId);
      if (resolved.error) {
        return res.status(resolved.statusCode).json({
          success: false,
          message: resolved.error
        });
      }

      const { service, providerUserId, amount } = resolved;

      if (paymentMethod === 'WALLET') {
        const balanceCheck = await checkWalletBalance(req.user.id, amount);
        if (!balanceCheck.hasSufficientBalance) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance',
            shortfall: balanceCheck.shortfall
          });
        }

        const now = new Date();
        const result = await prisma.$transaction(
          async (tx) => {
            const order = await tx.orders.create({
              data: {
                id: randomUUID(),
                customerId: req.user.id,
                providerId: providerUserId,
                serviceId: service.id,
                totalAmount: amount,
                status: 'PENDING',
                serviceDate: now,
                address: String(req.user.profile?.address || 'Address not provided'),
                updatedAt: now
              }
            });

            const paymentResult = await processOrderPayment(
              req.user.id,
              providerUserId,
              amount,
              order.id,
              { tx }
            );

            await tx.orders.update({
              where: { id: order.id },
              data: {
                status: 'ACCEPTED',
                commission: paymentResult.commission,
                updatedAt: new Date()
              }
            });

            return {
              orderId: order.id,
              amount,
              commission: paymentResult.commission,
              providerAmount: paymentResult.providerAmount
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );

        return res.json({
          success: true,
          message: 'Order created and payment processed',
          data: {
            ...result,
            paymentMethod: 'WALLET'
          }
        });
      }

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

      await prisma.payment_orders.create({
        data: {
          id: randomUUID(),
          userId: req.user.id,
          orderId: orderResult.orderId,
          amount: round2(orderResult.amount),
          currency: orderResult.currency || 'INR',
          paymentMethod,
          status: 'PENDING',
          type: 'SERVICE_BOOKING',
          metadata: {
            serviceId: service.id,
            providerId: providerUserId
          },
          updatedAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          orderId: orderResult.orderId,
          amount: round2(orderResult.amount),
          currency: orderResult.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Create payment order error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }
  }
);

router.post(
  '/verify',
  strictBody([
    authenticateToken,
    requireIdempotency('payments_verify'),
    body('orderId').isString().trim().isLength({ min: 1, max: 128 }).withMessage('Order ID is required'),
    body('paymentId').isString().trim().isLength({ min: 1, max: 128 }).withMessage('Payment ID is required'),
    body('signature').isString().trim().isLength({ min: 1, max: 512 }).withMessage('Signature is required')
  ]),
  async (req, res) => {
    let claimedPaymentRowId = null;
    try {
      const failed = validate(req, res);
      if (failed) return failed;

      const orderId = String(req.body.orderId || '').trim();
      const paymentId = String(req.body.paymentId || '').trim();
      const signature = String(req.body.signature || '').trim();

      if (!verifyPaymentSignature(orderId, paymentId, signature)) {
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

      const result = await prisma.$transaction(
        async (tx) => {
          const paymentOrder = await tx.payment_orders.findFirst({
            where: {
              orderId,
              userId: req.user.id,
              type: 'SERVICE_BOOKING'
            }
          });

          if (!paymentOrder) {
            const error = new Error('Payment order not found');
            error.statusCode = 404;
            error.isOperational = true;
            throw error;
          }

          if (paymentOrder.status === 'COMPLETED') {
            return {
              idempotent: true,
              orderId: paymentOrder.metadata?.internalOrderId || null,
              amount: round2(paymentOrder.amount),
              paymentId: paymentOrder.paymentId || paymentId
            };
          }

          assertTransition('PAYMENT', paymentOrder.status, 'PROCESSING');

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

          claimedPaymentRowId = paymentOrder.id;

          const expectedAmount = round2(paymentOrder.amount);
          const capturedAmount = paymentDetails.amount == null && isMockPaymentEnabled()
            ? expectedAmount
            : round2(paymentDetails.amount);
          if (capturedAmount !== expectedAmount) {
            const error = new Error('Captured amount mismatch');
            error.statusCode = 409;
            error.isOperational = true;
            throw error;
          }

          const order = await tx.orders.create({
            data: {
              id: randomUUID(),
              customerId: req.user.id,
              providerId: String(paymentOrder.metadata?.providerId || ''),
              serviceId: String(paymentOrder.metadata?.serviceId || ''),
              totalAmount: expectedAmount,
              status: 'PENDING',
              serviceDate: new Date(),
              address: String(req.user.profile?.address || 'Address not provided'),
              updatedAt: new Date()
            }
          });

          const paymentResult = await processOrderPayment(
            req.user.id,
            String(paymentOrder.metadata?.providerId || ''),
            expectedAmount,
            order.id,
            { tx }
          );

          await tx.orders.update({
            where: { id: order.id },
            data: {
              status: 'ACCEPTED',
              commission: paymentResult.commission,
              updatedAt: new Date()
            }
          });

          await tx.payment_orders.update({
            where: { id: paymentOrder.id },
            data: {
              status: 'COMPLETED',
              paymentId,
              signature,
              metadata: {
                ...((paymentOrder.metadata && typeof paymentOrder.metadata === 'object') ? paymentOrder.metadata : {}),
                internalOrderId: order.id
              },
              updatedAt: new Date()
            }
          });

          return {
            idempotent: false,
            orderId: order.id,
            amount: expectedAmount,
            commission: paymentResult.commission,
            providerAmount: paymentResult.providerAmount,
            paymentId
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      return res.json({
        success: true,
        message: result.idempotent ? 'Payment already verified' : 'Payment verified and order created',
        data: result
      });
    } catch (error) {
      if (claimedPaymentRowId) {
        await prisma.payment_orders.updateMany({
          where: {
            id: claimedPaymentRowId,
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
  }
);

router.post(
  '/refund',
  strictBody([
    authenticateToken,
    requireIdempotency('payments_refund'),
    body('orderId').isString().trim().isLength({ min: 1, max: 64 }).withMessage('Order ID is required'),
    body('reason').optional().isString().trim().isLength({ max: 240 }).withMessage('Reason must be a string')
  ]),
  async (req, res) => {
    try {
      const failed = validate(req, res);
      if (failed) return failed;

      const orderId = String(req.body.orderId || '').trim();
      const reason = String(req.body.reason || 'Order cancellation').trim();

      const refundResult = await prisma.$transaction(
        async (tx) => {
          const order = await tx.orders.findUnique({ where: { id: orderId } });
          if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            error.isOperational = true;
            throw error;
          }

          if (order.customerId !== req.user.id && req.user.userType !== 'ADMIN') {
            const error = new Error('Unauthorized to process refund for this order');
            error.statusCode = 403;
            error.isOperational = true;
            throw error;
          }

          assertTransition('ORDER', order.status, 'CANCELLED');

          const amount = round2(order.totalAmount);
          const result = await processRefund(
            order.customerId,
            amount,
            order.id,
            reason,
            { tx }
          );

          const updateResult = await tx.orders.updateMany({
            where: {
              id: order.id,
              status: order.status
            },
            data: {
              status: 'CANCELLED',
              cancelledBy: req.user.id,
              cancelReason: reason,
              cancelledAt: new Date(),
              updatedAt: new Date()
            }
          });

          if (updateResult.count !== 1) {
            const error = new Error('Order state changed while processing refund');
            error.statusCode = 409;
            error.isOperational = true;
            throw error;
          }

          return {
            orderId: order.id,
            refundAmount: result.amount,
            newBalance: result.newBalance
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      return res.json({
        success: true,
        message: 'Refund processed successfully',
        data: refundResult
      });
    } catch (error) {
      return res.status(Number(error.statusCode || 500)).json({
        success: false,
        message: error.isOperational ? error.message : 'Failed to process refund'
      });
    }
  }
);

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [paymentOrders, total] = await Promise.all([
      prisma.payment_orders.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment_orders.count({ where: { userId: req.user.id } })
    ]);

    return res.json({
      success: true,
      data: {
        payments: paymentOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(Math.ceil(total / limit), 1)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

router.post('/webhook', webhookLimiter, async (req, res) => {
  try {
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const bodyBuffer = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})));

    const isValidSignature = validateWebhookSignature(
      bodyBuffer,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(bodyBuffer.toString('utf8'));
    const paymentEntityId = event?.payload?.payment?.entity?.id || '';
    const refundEntityId = event?.payload?.refund?.entity?.id || '';
    const eventId = String(event?.id || `${event?.event || 'unknown'}:${paymentEntityId || refundEntityId || 'na'}`);
    const payloadHash = crypto.createHash('sha256').update(bodyBuffer).digest('hex');
    const webhookRowId = randomUUID();

    const inserted = await prisma.$executeRaw`
      INSERT INTO "webhook_events" ("id", "provider", "eventId", "eventType", "payloadHash", "createdAt")
      VALUES (${webhookRowId}, 'RAZORPAY', ${eventId}, ${String(event?.event || 'UNKNOWN')}, ${payloadHash}, NOW())
      ON CONFLICT ("provider", "eventId") DO NOTHING
    `;

    if (inserted === 0) {
      return res.json({
        success: true,
        message: 'Webhook already processed'
      });
    }

    switch (event.event) {
      case 'payment.captured':
      case 'payment.failed':
      case 'refund.created':
      default:
        break;
    }

    await prisma.$executeRaw`
      UPDATE "webhook_events"
      SET "processedAt" = NOW()
      WHERE "id" = ${webhookRowId}
    `;

    return res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process webhook'
    });
  }
});

router.get('/admin/payments', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status) : null;
    const type = req.query.type ? String(req.query.type) : null;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [payments, total] = await Promise.all([
      prisma.payment_orders.findMany({
        where,
        include: {
          users: {
            include: {
              profiles: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment_orders.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(Math.ceil(total / limit), 1)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

module.exports = router;
