const express = require('express');
const { body, validationResult } = require('express-validator');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { paymentMethodLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { randomUUID } = require('crypto');
const { requireIdempotency } = require('../middleware/idempotency');
const { assertTransition } = require('../utils/stateMachine');
const encryptionService = require('../utils/encryption');

const router = express.Router();

const providerPayoutScheduleStore = new Map();
const providerPaymentMethodsStore = new Map();
const isMockPaymentEnabled = () => ['true', '1', 'yes'].includes(String(process.env.MOCK_PAYMENT || '').trim().toLowerCase());
const isServiceAutoApproveEnabled = () => ['true', '1', 'yes'].includes(String(process.env.AUTO_APPROVE_PROVIDER_SERVICES || 'true').trim().toLowerCase());

const getMockProviderPaymentMethods = (userId) => {
  const key = String(userId || '').trim();
  if (!providerPaymentMethodsStore.has(key)) {
    providerPaymentMethodsStore.set(key, []);
  }
  return providerPaymentMethodsStore.get(key);
};

const ORDER_STATUS_TO_DB = {
  pending: 'PENDING',
  confirmed: 'ACCEPTED',
  accepted: 'ACCEPTED',
  processing: 'IN_PROGRESS',
  in_progress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
  rejected: 'REJECTED'
};

const mapOrderStatusForClient = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'PENDING') return 'pending';
  if (key === 'ACCEPTED') return 'accepted';
  if (key === 'IN_PROGRESS') return 'in_progress';
  if (key === 'COMPLETED') return 'completed';
  if (key === 'CANCELLED') return 'cancelled';
  if (key === 'REJECTED') return 'rejected';
  return 'pending';
};

const mapPaymentMethodTypeFromDb = (type) => {
  const key = String(type || '').toUpperCase();
  if (key === 'NET_BANKING') return 'bank';
  if (key === 'CARD') return 'card';
  return 'upi';
};

const mapPaymentMethodTypeToDb = (type) => {
  const key = String(type || '').toLowerCase();
  if (key === 'bank') return 'NET_BANKING';
  if (key === 'card') return 'CARD';
  return 'UPI';
};

const getProviderScope = async (userId) => {
  const provider = await prisma.providers.findUnique({
    where: { userId }
  });

  const providerIdWhere = [{ providerId: userId }];
  if (provider?.id) {
    providerIdWhere.push({ providerId: provider.id });
  }

  return {
    provider,
    where: { OR: providerIdWhere }
  };
};

const getCustomerName = (customerUser) => {
  const profile = customerUser?.profiles || null;
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  return fullName || customerUser?.email || customerUser?.phone || 'Customer';
};

const extractIssueDetails = (notes) => {
  const raw = String(notes || '').trim();
  if (!raw) {
    return {
      issueDescription: '',
      issuePhotos: []
    };
  }

  const issuePhotoLines = raw.match(/(?:^|\n)-\s*(\/uploads\/issues\/[^\s]+)/g) || [];
  const issuePhotos = issuePhotoLines
    .map((line) => String(line).replace(/(?:^|\n)-\s*/, '').trim())
    .filter(Boolean);

  const markerRegex = /\n?Issue photos:\s*\n?/i;
  const issueDescription = markerRegex.test(raw)
    ? raw.split(markerRegex)[0].trim()
    : raw;

  return {
    issueDescription,
    issuePhotos: Array.from(new Set(issuePhotos))
  };
};

const mapOrderForProvider = (order) => {
  const customerUser = order?.users_orders_customerIdTousers || null;
  const service = order?.services || null;
  const review = order?.reviews || null;
  const customerName = getCustomerName(customerUser);
  const serviceDate = order?.serviceDate ? new Date(order.serviceDate) : null;
  const issueDetails = extractIssueDetails(order?.notes);

  return {
    id: order.id,
    orderNumber: `ORD-${String(order.id || '').slice(0, 8).toUpperCase()}`,
    status: mapOrderStatusForClient(order.status),
    totalAmount: Number(order.totalAmount || 0),
    bookingDate: serviceDate ? serviceDate.toISOString().slice(0, 10) : null,
    bookingTime: serviceDate
      ? serviceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : null,
    serviceDate: order.serviceDate,
    address: order.address || '',
    location: order.address || '',
    notes: order.notes || '',
    issueDescription: issueDetails.issueDescription,
    issuePhotos: issueDetails.issuePhotos,
    createdAt: order.createdAt,
    customer: {
      id: customerUser?.id || order.customerId,
      full_name: customerName,
      email: customerUser?.email || '',
      phone: customerUser?.phone || ''
    },
    service: service
      ? {
          id: service.id,
          name: service.name,
          price: Number(service.price || 0),
          category: service.category || ''
        }
      : {
          id: order.serviceId,
          name: 'Service',
          price: Number(order.totalAmount || 0),
          category: ''
        },
    review: review
      ? {
          id: review.id,
          rating: review.rating,
          comment: review.comment || '',
          createdAt: review.createdAt
        }
      : null
  };
};

const ensureWallet = async (userId) => {
  let wallet = await prisma.wallets.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prisma.wallets.create({
      data: {
        id: randomUUID(),
        userId,
        balance: 0,
        updatedAt: new Date()
      }
    });
  }

  return wallet;
};

const mapProviderPaymentMethod = (method) => ({
  id: method.id,
  type: mapPaymentMethodTypeFromDb(method.type),
  last4: method.last4 || '',
  name: method.cardName || method.provider || 'Payment method',
  isDefault: Boolean(method.isDefault),
  bankName: method.type === 'NET_BANKING' ? method.provider || '' : '',
  expiryDate:
    method.type === 'CARD' && method.expiryMonth && method.expiryYear
      ? `${method.expiryMonth}/${String(method.expiryYear).slice(-2)}`
      : '',
  upiId: method.type === 'UPI' ? method.upiId || '' : '',
  verified: true,
  addedDate: method.createdAt
});

const mapUserShape = (user) => {
  if (!user) return null;
  return {
    ...user,
    profile: user.profiles || null,
    provider: user.providers || null,
    wallet: user.wallets || null,
    notificationPreferences: user.notification_preferences || null
  };
};

// List provider services

router.get('/me', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    // First check if user exists with all related data
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        profiles: true,
        providers: true,
        wallets: true,
        notification_preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If provider doesn't exist, create one
    if (!user.providers) {
      await prisma.providers.create({
        data: {
          userId: user.id,
          businessName: `${user.profiles?.firstName || 'Provider'}'s Business`,
          providerType: 'FREELANCER',
          category: 'General',
          area: 'Not specified',
          address: '',
          panNumber: encryptionService.encryptField('TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase()),
          aadhaarNumber: encryptionService.encryptField('TEMP' + Math.random().toString(36).substring(2, 10).toUpperCase()),
          isVerified: false,
          isActive: true,
          rating: 0,
          totalOrders: 0,
          isOnline: false,
          updatedAt: new Date()
        },
      });
    }

    const freshUser = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        profiles: true,
        providers: true,
        wallets: true,
        notification_preferences: true
      }
    });
    const normalized = mapUserShape(freshUser);

    res.json({
      success: true,
      data: {
        provider: {
          ...normalized.provider,
          user: {
            id: normalized.id,
            email: normalized.email,
            phone: normalized.phone,
            userType: normalized.userType,
            profile: normalized.profile,
            wallet: normalized.wallet,
            notificationPreferences: normalized.notificationPreferences
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider profile'
    });
  }
});

// Update provider profile - Professional implementation like Instagram/Urban Company
// PATCH /api/provider/profile - Updates only provided fields
router.patch('/profile', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const {
      businessName,
      category,
      area,
      address,
      upiId,
      phoneNumber,
      avatar, // Profile photo base64 data
      notificationPreferences
    } = req.body || {};

    // Validate that at least one field is provided
    if (Object.keys(req.body || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Find existing provider
    const provider = await prisma.providers.findUnique({ 
      where: { userId: req.user.id },
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider profile not found' 
      });
    }

    // Update provider fields (only provided ones)
    const providerUpdateData = {};
    if (businessName !== undefined) providerUpdateData.businessName = businessName;
    if (category !== undefined) providerUpdateData.category = category;
    if (area !== undefined) providerUpdateData.area = area;
    if (address !== undefined) providerUpdateData.address = address;
    if (upiId !== undefined) providerUpdateData.upiId = upiId ? encryptionService.encryptField(upiId) : null;

    // Update provider if there are changes
    let updatedProvider = provider;
    if (Object.keys(providerUpdateData).length > 0) {
      updatedProvider = await prisma.providers.update({
        where: { id: provider.id },
        data: providerUpdateData
      });
    }

    // Update user phone number if provided
    let updatedUser = provider.users;
    if (phoneNumber !== undefined) {
      updatedUser = await prisma.users.update({
        where: { id: req.user.id },
        data: { phone: phoneNumber }
      });
    }

    // Update profile photo if provided (base64 data)
    let updatedProfile = provider.users.profiles;
    if (avatar !== undefined) {
      // Handle base64 avatar data
      updatedProfile = await prisma.profiles.upsert({
        where: { userId: req.user.id },
        create: {
          id: require('crypto').randomUUID(),
          userId: req.user.id,
          firstName: provider.users.profiles?.firstName || 'Provider',
          lastName: provider.users.profiles?.lastName || 'User',
          avatar,
          updatedAt: new Date()
        },
        update: { avatar, updatedAt: new Date() }
      });
    }

    // Update notification preferences if provided
    let updatedPrefs = null;
    if (notificationPreferences && typeof notificationPreferences === 'object') {
      updatedPrefs = await prisma.notification_preferences.upsert({
        where: { userId: req.user.id },
        create: {
          id: require('crypto').randomUUID(),
          userId: req.user.id,
          ...(notificationPreferences.pushEnabled !== undefined && { pushEnabled: !!notificationPreferences.pushEnabled }),
          ...(notificationPreferences.emailEnabled !== undefined && { emailEnabled: !!notificationPreferences.emailEnabled }),
          ...(notificationPreferences.smsEnabled !== undefined && { smsEnabled: !!notificationPreferences.smsEnabled }),
          updatedAt: new Date()
        },
        update: {
          ...(notificationPreferences.pushEnabled !== undefined && { pushEnabled: !!notificationPreferences.pushEnabled }),
          ...(notificationPreferences.emailEnabled !== undefined && { emailEnabled: !!notificationPreferences.emailEnabled }),
          ...(notificationPreferences.smsEnabled !== undefined && { smsEnabled: !!notificationPreferences.smsEnabled }),
          updatedAt: new Date()
        }
      });
    }

    // Fetch complete updated provider data for response
    const completeUpdatedData = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        profiles: true,
        providers: true,
        wallets: true,
        notification_preferences: true
      }
    });
    const normalizedUser = mapUserShape(completeUpdatedData);

    return res.json({
      success: true,
      message: 'Provider profile updated successfully',
      data: {
        user: normalizedUser,
        provider: updatedProvider,
        profile: updatedProfile,
        notificationPreferences: updatedPrefs
      }
    });

  } catch (error) {
    console.error('Provider profile update failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile'
    });
  }
});

router.get('/services', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const services = await prisma.services.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: { services } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Create service
router.post('/services', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('name').notEmpty().withMessage('Service name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('basePrice').optional().isFloat({ gt: 0 }).withMessage('Base price must be greater than 0'),
  body('offerPercent').optional().isInt({ min: 0, max: 100 }).withMessage('Offer percent must be between 0 and 100'),
  body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Estimated time must be at least 1 minute'),
  body('warrantyMonths').optional().isInt({ min: 0 }).withMessage('Warranty months must be 0 or greater')
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
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    console.log('✅ Provider found:', provider.id);
    
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const description = String(req.body.description || '').trim();
    const price = Number(req.body.price);
    const durationValue = Number(req.body.duration ?? req.body.estimatedTime ?? 60);
    const basePrice = req.body.basePrice !== undefined ? Number(req.body.basePrice) : null;
    const offerPercent = req.body.offerPercent !== undefined ? Number(req.body.offerPercent) : 0;
    const estimatedTime = req.body.estimatedTime !== undefined ? Number(req.body.estimatedTime) : null;
    const warrantyMonths = req.body.warrantyMonths !== undefined ? Number(req.body.warrantyMonths) : null;

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }
    if (!Number.isFinite(durationValue) || durationValue < 1) {
      return res.status(400).json({ success: false, message: 'Duration must be at least 1 minute' });
    }
    if (basePrice !== null && (!Number.isFinite(basePrice) || basePrice <= 0)) {
      return res.status(400).json({ success: false, message: 'Base price must be greater than 0' });
    }
    if (!Number.isFinite(offerPercent) || offerPercent < 0 || offerPercent > 100) {
      return res.status(400).json({ success: false, message: 'Offer percent must be between 0 and 100' });
    }
    if (estimatedTime !== null && (!Number.isFinite(estimatedTime) || estimatedTime < 1)) {
      return res.status(400).json({ success: false, message: 'Estimated time must be at least 1 minute' });
    }
    if (warrantyMonths !== null && (!Number.isFinite(warrantyMonths) || warrantyMonths < 0)) {
      return res.status(400).json({ success: false, message: 'Warranty months must be 0 or greater' });
    }

    const autoApprove = isServiceAutoApproveEnabled();
    const service = await prisma.services.create({
      data: {
        id: randomUUID(),
        providerId: provider.id,
        name,
        category,
        description,
        price,
        duration: Math.max(1, Math.round(durationValue)),
        basePrice: basePrice === null ? null : basePrice,
        offerPercent: Math.round(offerPercent),
        estimatedTime: estimatedTime === null ? null : Math.max(1, Math.round(estimatedTime)),
        warrantyMonths: warrantyMonths === null ? null : Math.max(0, Math.round(warrantyMonths)),
        status: autoApprove ? 'ACTIVE' : 'PENDING_VERIFICATION',
        isActive: autoApprove,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        service,
        status: autoApprove ? 'active' : 'pending_verification',
        message: autoApprove
          ? 'Service created and published successfully'
          : 'Service created and sent for admin verification'
      } 
    });
  } catch (e) {
    console.error('Create provider service failed for user:', req.user?.id);
    console.error('Create provider service error details:', e);
    res.status(500).json({
      success: false,
      message: e?.message || 'Failed to create service'
    });
  }
});

// Update service
router.put('/services/:id', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('name').optional().notEmpty(),
  body('category').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('price').optional().isFloat({ gt: 0 }),
  body('duration').optional().isInt({ min: 1 }),
  body('basePrice').optional().isFloat({ gt: 0 }),
  body('offerPercent').optional().isInt({ min: 0, max: 100 }),
  body('estimatedTime').optional().isInt({ min: 1 }),
  body('warrantyMonths').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const service = await prisma.services.findFirst({ where: { id: req.params.id, providerId: provider.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    const updateData = {
      ...(req.body.name && { name: String(req.body.name).trim() }),
      ...(req.body.category && { category: String(req.body.category).trim() }),
      ...(req.body.description && { description: String(req.body.description).trim() }),
      ...(req.body.price !== undefined && { price: Number(req.body.price) }),
      ...(req.body.duration !== undefined && { duration: Math.max(1, Math.round(Number(req.body.duration))) }),
      ...(req.body.basePrice !== undefined && { basePrice: Number(req.body.basePrice) }),
      ...(req.body.offerPercent !== undefined && { offerPercent: Math.round(Number(req.body.offerPercent)) }),
      ...(req.body.estimatedTime !== undefined && { estimatedTime: Math.max(1, Math.round(Number(req.body.estimatedTime))) }),
      ...(req.body.warrantyMonths !== undefined && { warrantyMonths: Math.max(0, Math.round(Number(req.body.warrantyMonths))) }),
      updatedAt: new Date()
    };

    const updated = await prisma.services.update({
      where: { id: service.id },
      data: updateData
    });
    res.json({ success: true, data: { service: updated } });
  } catch (e) {
    console.error('Update provider service failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: e?.message || 'Failed to update service'
    });
  }
});

// Delete service
router.delete('/services/:id', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const service = await prisma.services.findFirst({ where: { id: req.params.id, providerId: provider.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    await prisma.services.delete({ where: { id: service.id } });
    res.json({ success: true, message: 'Service deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// Provider stats
router.get('/stats', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const [counts, wallet, ratings] = await Promise.all([
      prisma.orders.groupBy({ by: ['status'], where: { providerId: provider.id }, _count: { status: true } }),
      prisma.wallets.findUnique({ where: { userId: req.user.id } }),
      prisma.reviews.aggregate({ where: { providerId: provider.id }, _avg: { rating: true }, _count: { id: true } })
    ]);

    const ordersByStatus = counts.reduce((acc, r) => { acc[r.status] = r._count.status; return acc; }, {});

    res.json({ success: true, data: {
      ordersByStatus,
      wallet: { balance: wallet?.balance || 0 },
      ratings: { average: ratings._avg.rating || 0, total: ratings._count.id }
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Provider orders
router.get('/orders', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const scope = await getProviderScope(req.user.id);
    const statusFilter = String(req.query.status || '').toLowerCase();
    const where = { ...scope.where };

    if (statusFilter && ORDER_STATUS_TO_DB[statusFilter]) {
      where.status = ORDER_STATUS_TO_DB[statusFilter];
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        services: true,
        reviews: true,
        users_orders_customerIdTousers: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        orders: orders.map(mapOrderForProvider)
      }
    });
  } catch (error) {
    console.error('Provider orders fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch provider orders'
    });
  }
});

// Alias for calendar bookings
router.get('/bookings', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const scope = await getProviderScope(req.user.id);
    const orders = await prisma.orders.findMany({
      where: scope.where,
      include: {
        services: true,
        users_orders_customerIdTousers: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { serviceDate: 'asc' }
    });

    return res.json({
      success: true,
      data: {
        bookings: orders.map(mapOrderForProvider)
      }
    });
  } catch (error) {
    console.error('Provider bookings fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Update provider order status
router.put('/orders/:orderId/status', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const requestedStatus = String(req.body?.status || '').toLowerCase();
    const dbStatus = ORDER_STATUS_TO_DB[requestedStatus];

    if (!dbStatus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const scope = await getProviderScope(req.user.id);
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        ...scope.where
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    assertTransition('ORDER', order.status, dbStatus);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.orders.updateMany({
        where: {
          id: order.id,
          status: order.status
        },
        data: {
          status: dbStatus,
          ...(dbStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
          ...(dbStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
          updatedAt: new Date()
        }
      });

      if (result.count !== 1) {
        const error = new Error('Order status was updated by another request');
        error.statusCode = 409;
        error.isOperational = true;
        throw error;
      }

      return tx.orders.findUnique({ where: { id: order.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: {
          id: updated.id,
          status: mapOrderStatusForClient(updated.status)
        }
      }
    });
  } catch (error) {
    console.error('Provider order status update failed for user:', req.user?.id);
    return res.status(Number(error.statusCode || 500)).json({
      success: false,
      message: error.isOperational ? error.message : 'Failed to update order status'
    });
  }
});

// Provider reviews
router.get('/reviews', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.providers.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.json({
        success: true,
        data: {
          reviews: []
        }
      });
    }

    const reviews = await prisma.reviews.findMany({
      where: {
        providerId: provider.id
      },
      include: {
        orders: {
          include: {
            services: true
          }
        },
        users_reviews_reviewerIdTousers: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = reviews.map((review) => {
      const reviewer = review.users_reviews_reviewerIdTousers;
      const fullName = getCustomerName(reviewer);
      return {
        id: review.id,
        rating: review.rating,
        review_text: review.comment || '',
        visibility: 'public',
        featured: false,
        created_at: review.createdAt,
        customer: {
          id: reviewer?.id || review.reviewerId,
          full_name: fullName
        },
        service: {
          id: review.orders?.services?.id || '',
          name: review.orders?.services?.name || 'Service'
        }
      };
    });

    return res.json({
      success: true,
      data: {
        reviews: mapped
      }
    });
  } catch (error) {
    console.error('Provider reviews fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Provider customers
router.get('/customers', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const scope = await getProviderScope(req.user.id);
    const orders = await prisma.orders.findMany({
      where: scope.where,
      include: {
        users_orders_customerIdTousers: {
          include: {
            profiles: true
          }
        },
        services: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const grouped = new Map();
    for (const order of orders) {
      const customer = order.users_orders_customerIdTousers;
      if (!customer) continue;
      const key = customer.id;
      const existing = grouped.get(key) || {
        id: key,
        name: getCustomerName(customer),
        email: customer.email || '',
        phone: customer.phone || '',
        city: customer?.profiles?.city || 'Tirunelveli',
        totalBookings: 0,
        totalSpent: 0,
        lastBookingDate: order.createdAt,
        services: new Set()
      };

      existing.totalBookings += 1;
      existing.totalSpent += Number(order.totalAmount || 0);
      existing.lastBookingDate = order.createdAt > existing.lastBookingDate ? order.createdAt : existing.lastBookingDate;
      if (order.services?.name) {
        existing.services.add(order.services.name);
      }
      grouped.set(key, existing);
    }

    const customers = Array.from(grouped.values()).map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      city: item.city || 'Tirunelveli',
      totalBookings: item.totalBookings,
      totalSpent: item.totalSpent,
      lastBookingDate: item.lastBookingDate,
      services: Array.from(item.services)
    }));

    return res.json({
      success: true,
      data: {
        customers
      }
    });
  } catch (error) {
    console.error('Provider customers fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
});

// Provider wallet summary
router.get('/wallet', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const wallet = await ensureWallet(req.user.id);
    const payouts = await prisma.transactions.findMany({
      where: {
        walletId: wallet.id,
        type: 'WITHDRAWAL'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.json({
      success: true,
      data: {
        balance: Number(wallet.balance || 0),
        averageProcessingTime: '1-2 business days',
        payouts: payouts.map((tx) => ({
          id: tx.id,
          payout_id: `PAY-${String(tx.id).slice(0, 8).toUpperCase()}`,
          amount: Math.abs(Number(tx.amount || 0)),
          destination: tx.description || 'Bank transfer',
          status: 'paid',
          payout_date: tx.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Provider wallet fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet'
    });
  }
});

// Provider wallet transactions
router.get('/transactions', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const wallet = await ensureWallet(req.user.id);
    const transactions = await prisma.transactions.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const mapped = transactions.map((tx) => {
      const debitTypes = ['DEBIT', 'WITHDRAWAL', 'COMMISSION'];
      const amount = debitTypes.includes(String(tx.type)) ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0));
      return {
        id: tx.id,
        description: tx.description || tx.type,
        amount,
        fees: 0,
        status: 'completed',
        created_at: tx.createdAt
      };
    });

    return res.json({
      success: true,
      data: {
        transactions: mapped
      }
    });
  } catch (error) {
    console.error('Provider transactions fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Provider payment methods
router.get('/payment-methods', authenticateToken, requireRole('PROVIDER'), paymentMethodLimiter, async (req, res) => {
  try {
    if (isMockPaymentEnabled()) {
      const methods = getMockProviderPaymentMethods(req.user.id)
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
          paymentMethods: methods.map(mapProviderPaymentMethod)
        }
      });
    }

    const methods = await prisma.user_payment_methods.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json({
      success: true,
      data: {
        paymentMethods: methods.map(mapProviderPaymentMethod)
      }
    });
  } catch (error) {
    console.error('Provider payment methods fetch failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods'
    });
  }
});

router.post(
  '/payment-methods',
  authenticateToken,
  requireRole('PROVIDER'),
  paymentMethodLimiter,
  strictBody([
    body('type').isIn(['upi', 'card', 'bank', 'UPI', 'CARD', 'NET_BANKING']),
    body('name').optional().isString().trim().isLength({ max: 80 }),
    body('isDefault').optional().isBoolean(),
    body('upiId').optional().isString().trim().isLength({ max: 100 }),
    body('cardNumber').optional().isString().trim().isLength({ max: 32 }),
    body('expiryDate').optional().isString().trim().isLength({ max: 7 }),
    body('accountNumber').optional().isString().trim().isLength({ max: 24 }),
    body('accountHolderName').optional().isString().trim().isLength({ max: 80 }),
    body('bankName').optional().isString().trim().isLength({ max: 120 }),
    body('last4').optional().isString().trim().isLength({ max: 8 })
  ]),
  async (req, res) => {
  try {
    const requestedType = String(req.body?.type || '').toLowerCase();
    const type = mapPaymentMethodTypeToDb(requestedType);
    const now = new Date();
    const isDefaultRequested = Boolean(req.body?.isDefault);

    let provider = '';
    let cardName = '';
    let cardNumber = null;
    let upiId = null;
    let last4 = '';
    let expiryMonth = null;
    let expiryYear = null;

    if (type === 'UPI') {
      upiId = String(req.body?.upiId || req.body?.last4 || '').trim().toLowerCase();
      if (!upiId || !upiId.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid UPI ID is required'
        });
      }
      provider = 'UPI';
      cardName = String(req.body?.name || 'UPI').trim();
      last4 = upiId.slice(-4);
    } else if (type === 'CARD') {
      const rawCard = String(req.body?.cardNumber || req.body?.last4 || '').replace(/\s+/g, '');
      if (!rawCard || rawCard.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Card number is required'
        });
      }
      const cleanDigits = rawCard.replace(/\D/g, '');
      const lastDigits = cleanDigits.slice(-4) || rawCard.slice(-4);
      last4 = lastDigits;
      cardNumber = `**** **** **** ${lastDigits}`;
      cardName = String(req.body?.name || req.body?.cardName || 'Card').trim();
      provider = 'Card';

      const expiryRaw = String(req.body?.expiryDate || '').trim();
      if (expiryRaw.includes('/')) {
        const [month, year] = expiryRaw.split('/');
        if (month) expiryMonth = month.padStart(2, '0');
        if (year) expiryYear = year.length === 2 ? `20${year}` : year;
      }
    } else {
      const accountNumber = String(req.body?.accountNumber || req.body?.last4 || '').replace(/\s+/g, '');
      if (!accountNumber || accountNumber.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Account number is required'
        });
      }
      last4 = accountNumber.replace(/\D/g, '').slice(-4) || accountNumber.slice(-4);
      cardNumber = `A/C ****${last4}`;
      cardName = String(req.body?.name || req.body?.accountHolderName || 'Bank account').trim();
      provider = String(req.body?.bankName || 'Bank').trim();
    }

    if (isMockPaymentEnabled()) {
      const methods = getMockProviderPaymentMethods(req.user.id);
      const shouldSetDefault = isDefaultRequested || methods.filter((method) => method.isActive).length === 0;
      if (shouldSetDefault) {
        methods.forEach((method) => {
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
        data: mapProviderPaymentMethod(created)
      });
    }

    const activeCount = await prisma.user_payment_methods.count({
      where: {
        userId: req.user.id,
        isActive: true
      }
    });
    const shouldSetDefault = isDefaultRequested || activeCount === 0;

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
      data: mapProviderPaymentMethod(created)
    });
  } catch (error) {
    console.error('Provider add payment method failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to add payment method'
    });
  }
});

router.delete('/payment-methods/:id', authenticateToken, requireRole('PROVIDER'), paymentMethodLimiter, async (req, res) => {
  try {
    if (isMockPaymentEnabled()) {
      const methods = getMockProviderPaymentMethods(req.user.id);
      const index = methods.findIndex((method) => method.id === req.params.id && method.isActive);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      const now = new Date();
      const removed = methods[index];
      methods.splice(index, 1);

      if (removed.isDefault) {
        const fallback = methods.find((method) => method.isActive);
        if (fallback) {
          fallback.isDefault = true;
          fallback.updatedAt = now;
        }
      }

      return res.json({
        success: true,
        message: 'Payment method removed successfully'
      });
    }

    const method = await prisma.user_payment_methods.findFirst({
      where: {
        id: req.params.id,
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
        updatedAt: new Date()
      }
    });

    if (method.isDefault) {
      const fallback = await prisma.user_payment_methods.findFirst({
        where: {
          userId: req.user.id,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (fallback) {
        await prisma.user_payment_methods.update({
          where: { id: fallback.id },
          data: {
            isDefault: true,
            updatedAt: new Date()
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Provider remove payment method failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove payment method'
    });
  }
});

router.put('/payment-methods/:id/set-default', authenticateToken, requireRole('PROVIDER'), paymentMethodLimiter, async (req, res) => {
  try {
    if (isMockPaymentEnabled()) {
      const methods = getMockProviderPaymentMethods(req.user.id);
      const method = methods.find((item) => item.id === req.params.id && item.isActive);

      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      const now = new Date();
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
        message: 'Default payment method updated successfully',
        data: mapProviderPaymentMethod(method)
      });
    }

    const method = await prisma.user_payment_methods.findFirst({
      where: {
        id: req.params.id,
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

    const now = new Date();
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
      where: { id: method.id },
      data: {
        isDefault: true,
        updatedAt: now
      }
    });

    return res.json({
      success: true,
      message: 'Default payment method updated',
      data: mapProviderPaymentMethod(updated)
    });
  } catch (error) {
    console.error('Provider set default method failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to update default payment method'
    });
  }
});

// Provider withdrawal
router.post(
  '/withdraw',
  authenticateToken,
  requireRole('PROVIDER'),
  requireIdempotency('provider_withdraw'),
  strictBody([
    body('amount').isFloat({ min: 1, max: 1000000 }),
    body('paymentMethodId').optional().isString().trim().isLength({ min: 1, max: 64 })
  ]),
  async (req, res) => {
  try {
    const amount = Math.round(Number(req.body?.amount || 0) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const paymentMethodId = String(req.body?.paymentMethodId || '').trim();
    if (paymentMethodId) {
      const method = await prisma.user_payment_methods.findFirst({
        where: {
          id: paymentMethodId,
          userId: req.user.id,
          isActive: true
        }
      });
      if (!method) {
        return res.status(400).json({
          success: false,
          message: 'Selected payment method not found'
        });
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
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

      return tx.transactions.create({
        data: {
          id: randomUUID(),
          walletId: wallet.id,
          amount,
          type: 'WITHDRAWAL',
          description: paymentMethodId ? `Withdrawal to method ${paymentMethodId}` : 'Withdrawal request'
        }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        id: transaction.id,
        amount,
        fees: 0,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Provider withdrawal failed for user:', req.user?.id);
    return res.status(Number(error.statusCode || 500)).json({
      success: false,
      message: error.isOperational ? error.message : 'Failed to process withdrawal'
    });
  }
});

router.get('/payout-schedule', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  const now = new Date();
  const saved = providerPayoutScheduleStore.get(req.user.id);
  const defaultSchedule = {
    id: req.user.id,
    frequency: 'weekly',
    nextPayoutDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    minimumAmount: 1000,
    enabled: true
  };

  return res.json({
    success: true,
    data: {
      payoutSchedule: saved || defaultSchedule
    }
  });
});

router.put('/payout-schedule', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const current = providerPayoutScheduleStore.get(req.user.id) || {
      id: req.user.id,
      frequency: 'weekly',
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      minimumAmount: 1000,
      enabled: true
    };

    const nextSchedule = {
      ...current,
      ...(req.body?.frequency ? { frequency: req.body.frequency } : {}),
      ...(req.body?.minimumAmount !== undefined ? { minimumAmount: Number(req.body.minimumAmount) || current.minimumAmount } : {}),
      ...(req.body?.enabled !== undefined ? { enabled: Boolean(req.body.enabled) } : {})
    };

    providerPayoutScheduleStore.set(req.user.id, nextSchedule);

    return res.json({
      success: true,
      message: 'Payout schedule updated successfully',
      data: {
        payoutSchedule: nextSchedule
      }
    });
  } catch (error) {
    console.error('Provider payout schedule update failed for user:', req.user?.id);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payout schedule'
    });
  }
});

// Toggle availability
router.post('/toggle-availability', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.providers.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const updated = await prisma.providers.update({ where: { id: provider.id }, data: { isOnline: !provider.isOnline } });
    res.json({ success: true, data: { isOnline: updated.isOnline } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
});

module.exports = router;
