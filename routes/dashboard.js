const express = require('express');
const { prisma } = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/customer', requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const [bookingsCount, activeBookings] = await Promise.all([
      prisma.orders.count({
        where: { customerId: req.user.id }
      }),
      prisma.orders.count({
        where: {
          customerId: req.user.id,
          status: {
            in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
          }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        userId: req.user.id,
        role: 'CUSTOMER',
        stats: {
          bookingsCount,
          activeBookings
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/provider', requireRole('PROVIDER'), async (req, res, next) => {
  try {
    const provider = await prisma.providers.findUnique({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const [servicesCount, pendingOrders] = await Promise.all([
      prisma.services.count({
        where: { providerId: provider.id, isActive: true }
      }),
      prisma.orders.count({
        where: {
          providerId: req.user.id,
          status: {
            in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
          }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        userId: req.user.id,
        role: 'PROVIDER',
        providerId: provider.id,
        stats: {
          servicesCount,
          pendingOrders
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const [totalUsers, totalProviders, totalBookings] = await Promise.all([
      prisma.users.count(),
      prisma.providers.count(),
      prisma.orders.count()
    ]);

    return res.json({
      success: true,
      data: {
        userId: req.user.id,
        role: 'ADMIN',
        stats: {
          totalUsers,
          totalProviders,
          totalBookings
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
