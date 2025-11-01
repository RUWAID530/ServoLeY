const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// List messages for an order
router.get('/:orderId/messages', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const isAuthorized = order.customerId === req.user.id || order.providerId === req.user.id || req.user.userType === 'ADMIN';
    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const messages = await prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: { messages } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send message for an order
router.post('/:orderId/send', [
  authenticateToken,
  body('content').notEmpty().withMessage('content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const isAuthorized = order.customerId === req.user.id || order.providerId === req.user.id;
    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const receiverId = req.user.id === order.customerId ? order.providerId : order.customerId;
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content: req.body.content,
        orderId
      }
    });

    // Emit socket event if Socket.IO is present
    req.app.get('io')?.to(orderId).emit('chat:message', { orderId, message });

    res.status(201).json({ success: true, data: { message } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;



