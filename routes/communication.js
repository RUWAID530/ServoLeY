const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { 
  createMaskedCall, 
  getCallHistory, 
  getCallStatistics, 
  endCall 
} = require('../utils/maskedCalling');
const { 
  sendMessage, 
  getConversation, 
  getUserConversations, 
  markMessagesAsRead, 
  getUnreadMessageCount,
  deleteMessage,
  getMessageStatistics,
  searchMessages
} = require('../utils/chat');
const { 
  sendNotification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../utils/notifications');

const router = express.Router();

// ==================== MASKED CALLING ====================

// Create masked call
router.post('/call', [
  authenticateToken,
  requireVerification,
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('orderId').optional().isString().withMessage('Order ID must be a string')
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

    const { providerId, orderId } = req.body;

    // Check if user is authorized to call this provider
    if (req.user.userType === 'CUSTOMER') {
      // Customer can only call if they have an order with this provider
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            customerId: req.user.id,
            providerId
          }
        });

        if (!order) {
          return res.status(403).json({
            success: false,
            message: 'No order found with this provider'
          });
        }
      }
    }

    const result = await createMaskedCall(req.user.id, providerId, orderId);

    res.json({
      success: true,
      message: 'Call initiated successfully',
      data: result
    });

  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create call'
    });
  }
});

// Get call history
router.get('/calls', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await getCallHistory(req.user.id, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history'
    });
  }
});

// Get call statistics
router.get('/calls/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getCallStatistics(req.user.id, startDate, endDate);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get call statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call statistics'
    });
  }
});

// End call
router.post('/calls/:callSessionId/end', authenticateToken, async (req, res) => {
  try {
    const { callSessionId } = req.params;

    const result = await endCall(callSessionId);

    res.json({
      success: true,
      message: 'Call ended successfully',
      data: result
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end call'
    });
  }
});

// Handle call status webhook
router.post('/call-status', express.raw({ type: 'application/x-www-form-urlencoded' }), async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;

    const { handleCallStatusUpdate } = require('../utils/maskedCalling');
    await handleCallStatusUpdate(CallSid, CallStatus, CallDuration);

    res.json({ success: true });

  } catch (error) {
    console.error('Call status webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// ==================== CHAT MESSAGES ====================

// Send message
router.post('/messages', [
  authenticateToken,
  requireVerification,
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('orderId').optional().isString().withMessage('Order ID must be a string')
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

    const { receiverId, content, orderId } = req.body;

    // Check if users can communicate
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { customerId: req.user.id, providerId: receiverId },
            { customerId: receiverId, providerId: req.user.id }
          ]
        }
      });

      if (!order) {
        return res.status(403).json({
          success: false,
          message: 'No order found between these users'
        });
      }
    }

    const message = await sendMessage(req.user.id, receiverId, content, orderId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
});

// Get conversation
router.get('/messages/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, orderId } = req.query;

    const result = await getConversation(req.user.id, userId, orderId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
});

// Get user conversations
router.get('/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await getUserConversations(req.user.id, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
});

// Mark messages as read
router.post('/messages/read', [
  authenticateToken,
  body('senderId').notEmpty().withMessage('Sender ID is required'),
  body('orderId').optional().isString().withMessage('Order ID must be a string')
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

    const { senderId, orderId } = req.body;

    const result = await markMessagesAsRead(req.user.id, senderId, orderId);

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: result
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
});

// Get unread message count
router.get('/messages/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await getUnreadMessageCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread message count'
    });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await deleteMessage(messageId, req.user.id);

    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
});

// Search messages
router.get('/messages/search', authenticateToken, async (req, res) => {
  try {
    const { query, orderId } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const messages = await searchMessages(req.user.id, query, orderId);

    res.json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

// Get message statistics
router.get('/messages/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getMessageStatistics(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get message statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message statistics'
    });
  }
});

// ==================== NOTIFICATIONS ====================

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await getUserNotifications(req.user.id, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await markNotificationAsRead(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.post('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: result
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread notification count'
    });
  }
});

// Delete notification
router.delete('/notifications/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await deleteNotification(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
});

// Get notification preferences
router.get('/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await getNotificationPreferences(req.user.id);

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences'
    });
  }
});

// Update notification preferences
router.put('/notifications/preferences', [
  authenticateToken,
  body('pushEnabled').optional().isBoolean().withMessage('Push enabled must be boolean'),
  body('emailEnabled').optional().isBoolean().withMessage('Email enabled must be boolean'),
  body('smsEnabled').optional().isBoolean().withMessage('SMS enabled must be boolean'),
  body('orderUpdates').optional().isBoolean().withMessage('Order updates must be boolean'),
  body('messages').optional().isBoolean().withMessage('Messages must be boolean'),
  body('promotions').optional().isBoolean().withMessage('Promotions must be boolean'),
  body('systemAlerts').optional().isBoolean().withMessage('System alerts must be boolean')
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

    const preferences = await updateNotificationPreferences(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

// Send test notification
router.post('/notifications/test', [
  authenticateToken,
  body('type').isIn(['PUSH', 'EMAIL', 'SMS']).withMessage('Invalid notification type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
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

    const { type, title, body } = req.body;

    const channels = [type];
    const result = await sendNotification({
      userId: req.user.id,
      type: 'TEST',
      title,
      body,
      channels
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: { result }
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router;


