const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// List provider services
router.get('/services', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const services = await prisma.service.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: { services } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Create service
router.post('/services', [
  authenticateToken,
  requireRole('PROVIDER'),
  body('name').notEmpty(),
  body('category').notEmpty(),
  body('description').notEmpty(),
  body('price').isFloat({ gt: 0 }),
  body('basePrice').optional().isFloat({ gt: 0 }),
  body('offerPercent').optional().isInt({ min: 0, max: 100 }),
  body('estimatedTime').optional().isInt({ min: 1 }),
  body('warrantyMonths').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        price: req.body.price,
        basePrice: req.body.basePrice || null,
        offerPercent: req.body.offerPercent ?? 0,
        estimatedTime: req.body.estimatedTime || null,
        warrantyMonths: req.body.warrantyMonths || null
      }
    });
    res.status(201).json({ success: true, data: { service } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create service' });
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
  body('basePrice').optional().isFloat({ gt: 0 }),
  body('offerPercent').optional().isInt({ min: 0, max: 100 }),
  body('estimatedTime').optional().isInt({ min: 1 }),
  body('warrantyMonths').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const service = await prisma.service.findFirst({ where: { id: req.params.id, providerId: provider.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    const updated = await prisma.service.update({
      where: { id: service.id },
      data: {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.category && { category: req.body.category }),
        ...(req.body.description && { description: req.body.description }),
        ...(req.body.price && { price: req.body.price }),
        ...(req.body.basePrice && { basePrice: req.body.basePrice }),
        ...(req.body.offerPercent !== undefined && { offerPercent: req.body.offerPercent }),
        ...(req.body.estimatedTime !== undefined && { estimatedTime: req.body.estimatedTime }),
        ...(req.body.warrantyMonths !== undefined && { warrantyMonths: req.body.warrantyMonths })
      }
    });
    res.json({ success: true, data: { service: updated } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

// Delete service
router.delete('/services/:id', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const service = await prisma.service.findFirst({ where: { id: req.params.id, providerId: provider.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    await prisma.service.delete({ where: { id: service.id } });
    res.json({ success: true, message: 'Service deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// Provider stats
router.get('/stats', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const [counts, wallet, ratings] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], where: { providerId: req.user.id }, _count: { status: true } }),
      prisma.wallet.findUnique({ where: { userId: req.user.id } }),
      prisma.review.aggregate({ where: { providerId: provider.id }, _avg: { rating: true }, _count: { id: true } })
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

// Toggle availability
router.post('/toggle-availability', authenticateToken, requireRole('PROVIDER'), async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    const updated = await prisma.provider.update({ where: { id: provider.id }, data: { isOnline: !provider.isOnline } });
    res.json({ success: true, data: { isOnline: updated.isOnline } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
});

module.exports = router;



