const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// List notifications
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.notification.count({ where: { userId: req.user.id } });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to list notifications' });
  }
});

// Mark notifications as read
router.post('/mark-read', [
  authenticateToken,
  body('ids').isArray({ min: 1 }).withMessage('ids array required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { ids } = req.body;
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: req.user.id },
      data: { status: 'READ', readAt: new Date() }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// Store FCM token (placeholder)
router.post('/token', [
  authenticateToken,
  body('token').notEmpty().withMessage('token is required'),
  body('platform').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { token, platform } = req.body;
    await prisma.notificationToken.upsert({
      where: { token },
      update: { userId: req.user.id, platform },
      create: { userId: req.user.id, token, platform }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save token' });
  }
});

module.exports = router;



