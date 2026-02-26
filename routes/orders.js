const express = require('express');
const { body, validationResult } = require('express-validator');
const { createSafeErrorResponse } = require('../utils/safeErrorResponses');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Prisma } = require('@prisma/client');

const router = express.Router();
const ISSUE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'issues');

if (!fs.existsSync(ISSUE_UPLOAD_DIR)) {
  fs.mkdirSync(ISSUE_UPLOAD_DIR, { recursive: true });
}

const issuePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ISSUE_UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `issue-${Date.now()}-${randomUUID()}${ext}`);
    }
  }),
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB per image
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  }
});

const ensureOrderAccess = (order, user) => {
  if (!order || !user) return false;
  if (user.userType === 'ADMIN') return true;
  return order.customerId === user.id || order.providerId === user.id;
};

// Create booking (Customer)
router.post(
  '/',
  [
    authenticateToken,
    requireRole('CUSTOMER'),
    issuePhotoUpload.array('issuePhotos', 6)
  ],
  async (req, res) => {
    try {
      const pickSingle = (value) => (Array.isArray(value) ? value[0] : value);
      const rawServiceId = pickSingle(
        req.body.serviceId ??
        req.body.serviceID ??
        req.body.service_id ??
        req.body.service
      );
      const rawServiceDate = pickSingle(
        req.body.serviceDate ??
        req.body.date ??
        req.body.scheduledAt
      );
      const rawAddress = pickSingle(
        req.body.address ??
        req.body.location ??
        req.body.serviceAddress
      );
      const rawNotes = pickSingle(
        req.body.notes ??
        req.body.problem ??
        req.body.description ??
        ''
      );

      const serviceId = String(rawServiceId || '').trim();
      const serviceDateInput = String(rawServiceDate || '').trim();
      const address = String(rawAddress || '').trim();
      const notes = String(rawNotes || '');

      const errors = [];
      if (!serviceId) {
        errors.push({
          type: 'field',
          msg: 'Service ID is required',
          path: 'serviceId',
          location: 'body'
        });
      }
      if (!serviceDateInput) {
        errors.push({
          type: 'field',
          msg: 'Service date is required',
          path: 'serviceDate',
          location: 'body'
        });
      }
      if (!address) {
        errors.push({
          type: 'field',
          msg: 'Address is required',
          path: 'address',
          location: 'body'
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      const uploadedIssuePhotos = Array.isArray(req.files)
        ? req.files.map((file) => `/uploads/issues/${file.filename}`)
        : [];

      const scheduledAt = new Date(serviceDateInput);
      if (Number.isNaN(scheduledAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service date/time'
        });
      }

      const service = await prisma.services.findUnique({
        where: { id: serviceId },
        include: {
          providers: true
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const status = String(service.status || '').toUpperCase();
      if (!service.isActive || (status && status !== 'ACTIVE')) {
        return res.status(400).json({
          success: false,
          message: 'Service is not available for booking'
        });
      }

      const providerUserId = service.providers?.userId;
      if (!providerUserId) {
        return res.status(400).json({
          success: false,
          message: 'Provider not available for this service'
        });
      }

      const cleanNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : '';
      const notesWithIssuePhotos = uploadedIssuePhotos.length
        ? `${cleanNotes}${cleanNotes ? '\n\n' : ''}Issue photos:\n${uploadedIssuePhotos.map((url) => `- ${url}`).join('\n')}`
        : cleanNotes;

      const order = await prisma.$transaction(
        async (tx) => {
          const existingBooking = await tx.orders.findFirst({
            where: {
              providerId: providerUserId,
              serviceDate: scheduledAt,
              status: {
                in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
              }
            },
            select: { id: true }
          });

          if (existingBooking) {
            const conflictError = new Error('Selected timeslot is already booked. Please choose another slot.');
            conflictError.statusCode = 409;
            conflictError.isOperational = true;
            throw conflictError;
          }

          return tx.orders.create({
            data: {
              id: randomUUID(),
              customerId: req.user.id,
              providerId: providerUserId,
              serviceId: service.id,
              status: 'PENDING',
              totalAmount: Number(service.price) || 0,
              serviceDate: scheduledAt,
              address,
              notes: notesWithIssuePhotos || null,
              updatedAt: new Date()
            }
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          order,
          issuePhotos: uploadedIssuePhotos
        }
      });
    } catch (error) {
      if (error?.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      console.error('Create booking error:', error);
      const isPrismaKnown = error instanceof Prisma.PrismaClientKnownRequestError;
      const isPrismaValidation = error instanceof Prisma.PrismaClientValidationError;

      if (isPrismaKnown) {
        return createSafeErrorResponse(res, error, 'Failed to create booking');
      }

      if (isPrismaValidation) {
        return createSafeErrorResponse(res, error, 'Failed to create booking');
      }

      return createSafeErrorResponse(res, error, 'Failed to create booking');
    }
  }
);

// List orders for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const where = {};
    if (req.user.userType === 'CUSTOMER') {
      where.customerId = req.user.id;
    } else if (req.user.userType === 'PROVIDER') {
      where.providerId = req.user.id;
    }

    const orders = await prisma.orders.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get order chat messages
router.get('/:orderId/messages', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.orders.findUnique({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const messages = await prisma.messages.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });

    const data = messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isFromCustomer: message.senderId === order.customerId
    }));

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get order messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send order chat message
router.post(
  '/:orderId/messages',
  [
    authenticateToken,
    body('content').notEmpty().withMessage('Message content is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { orderId } = req.params;
      const { content } = req.body;
      const order = await prisma.orders.findUnique({ where: { id: orderId } });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (!ensureOrderAccess(order, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const receiverId = req.user.id === order.customerId ? order.providerId : order.customerId;

      const message = await prisma.messages.create({
        data: {
          id: randomUUID(),
          senderId: req.user.id,
          receiverId,
          orderId,
          content: String(content).trim()
        }
      });

      return res.status(201).json({
        success: true,
        data: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          isFromCustomer: message.senderId === order.customerId
        }
      });
    } catch (error) {
      console.error('Send order message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  }
);

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

module.exports = router;
