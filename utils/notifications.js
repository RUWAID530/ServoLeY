const { prisma } = require('../config/database');
const { sendSMSNotification } = require('./sms');
const { sendNotificationEmail } = require('./email');

// Send push notification (placeholder FCM integration)
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // This would integrate with FCM or similar service
    // For now, we'll store the notification in the database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: JSON.stringify(data),
        type: 'PUSH',
        status: 'SENT'
      }
    });

    console.log(`Push notification sent to user ${userId}: ${title}`);
    return notification;

  } catch (error) {
    console.error('Send push notification error:', error);
    throw new Error('Failed to send push notification');
  }
};

// Send email notification
const sendEmailNotification = async (userId, subject, message, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Send email
    await sendNotificationEmail(user.email, subject, message);

    // Store notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: subject,
        body: message,
        data: JSON.stringify(data),
        type: 'EMAIL',
        status: 'SENT'
      }
    });

    console.log(`Email notification sent to user ${userId}: ${subject}`);
    return notification;

  } catch (error) {
    console.error('Send email notification error:', error);
    throw new Error('Failed to send email notification');
  }
};

// Send SMS notification (local implementation)
const sendLocalSMSNotification = async (userId, message, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.phone) {
      throw new Error('User phone number not found');
    }

    // Send SMS
    await sendSMSNotification(user.phone, message);

    // Store notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: 'SMS Notification',
        body: message,
        data: JSON.stringify(data),
        type: 'SMS',
        status: 'SENT'
      }
    });

    console.log(`SMS notification sent to user ${userId}`);
    return notification;

  } catch (error) {
    console.error('Send SMS notification error:', error);
    throw new Error('Failed to send SMS notification');
  }
};

// Send notification (unified method)
const sendNotification = async ({ userId, type, title, body, data = {}, channels = ['PUSH'] }) => {
  try {
    const results = [];

    // Send to specified channels
    for (const channel of channels) {
      try {
        let notification;
        
        switch (channel) {
          case 'PUSH':
            notification = await sendPushNotification(userId, title, body, data);
            break;
          case 'EMAIL':
            notification = await sendEmailNotification(userId, title, body, data);
            break;
          case 'SMS':
            notification = await sendSMSNotification(userId, body, data);
            break;
        }
        
        results.push({ channel, success: true, notification });
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;

  } catch (error) {
    console.error('Send notification error:', error);
    throw new Error('Failed to send notification');
  }
};

// Triggers
const notifyOrderAccepted = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  await sendPushNotification(order.customerId, 'Order Accepted', 'Your order has been accepted', { orderId });
};

const notifyOrderRejected = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  await sendPushNotification(order.customerId, 'Order Rejected', 'Your order was rejected', { orderId });
};

const notifyOrderCancelled = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  await sendPushNotification(order.customerId, 'Order Cancelled', 'Your order was cancelled', { orderId });
  await sendPushNotification(order.providerId, 'Order Cancelled', 'The order was cancelled', { orderId });
};

const notifyRefundProcessed = async (userId, amount) => {
  await sendPushNotification(userId, 'Refund Processed', `₹${amount} refunded to your wallet`, {});
};

const notifyWalletUpdated = async (userId, amount) => {
  await sendPushNotification(userId, 'Wallet Updated', `Your wallet changed by ₹${amount}`, {});
};

// Get user notifications
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.notification.count({
      where: { userId }
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Get user notifications error:', error);
    throw new Error('Failed to get user notifications');
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });

    return { success: true };

  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (userId) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        readAt: null
      }
    });

    return count;

  } catch (error) {
    console.error('Get unread notification count error:', error);
    throw new Error('Failed to get unread notification count');
  }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return { success: true };

  } catch (error) {
    console.error('Delete notification error:', error);
    throw new Error('Failed to delete notification');
  }
};

// Get notification preferences
const getNotificationPreferences = async (userId) => {
  try {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: true,
          orderUpdates: true,
          messages: true,
          promotions: false,
          systemAlerts: true
        }
      });
    }

    return preferences;

  } catch (error) {
    console.error('Get notification preferences error:', error);
    throw new Error('Failed to get notification preferences');
  }
};

// Update notification preferences
const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const updatedPreferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences
      }
    });

    return updatedPreferences;

  } catch (error) {
    console.error('Update notification preferences error:', error);
    throw new Error('Failed to update notification preferences');
  }
};

// Send order notification
const sendOrderNotification = async (orderId, type, data = {}) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        provider: {
          include: {
            user: true
          }
        },
        service: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const notifications = [];

    switch (type) {
      case 'ORDER_CREATED':
        // Notify provider
        await sendNotification({
          userId: order.provider.userId,
          type: 'ORDER',
          title: 'New Order Received',
          body: `You have a new order for ${order.service.name}`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });
        break;

      case 'ORDER_ACCEPTED':
        // Notify customer
        await sendNotification({
          userId: order.customerId,
          type: 'ORDER',
          title: 'Order Accepted',
          body: `Your order for ${order.service.name} has been accepted`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });
        break;

      case 'ORDER_IN_PROGRESS':
        // Notify customer
        await sendNotification({
          userId: order.customerId,
          type: 'ORDER',
          title: 'Service Started',
          body: `Your service for ${order.service.name} has started`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });
        break;

      case 'ORDER_COMPLETED':
        // Notify customer
        await sendNotification({
          userId: order.customerId,
          type: 'ORDER',
          title: 'Service Completed',
          body: `Your service for ${order.service.name} has been completed`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });
        break;

      case 'ORDER_CANCELLED':
        // Notify both parties
        await sendNotification({
          userId: order.customerId,
          type: 'ORDER',
          title: 'Order Cancelled',
          body: `Your order for ${order.service.name} has been cancelled`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });

        await sendNotification({
          userId: order.provider.userId,
          type: 'ORDER',
          title: 'Order Cancelled',
          body: `Order for ${order.service.name} has been cancelled`,
          data: { orderId, type },
          channels: ['PUSH', 'EMAIL']
        });
        break;
    }

    return { success: true };

  } catch (error) {
    console.error('Send order notification error:', error);
    throw new Error('Failed to send order notification');
  }
};

// Send message notification
const sendMessageNotification = async (senderId, receiverId, message) => {
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { profile: true }
    });

    if (!sender) {
      throw new Error('Sender not found');
    }

    await sendNotification({
      userId: receiverId,
      type: 'MESSAGE',
      title: `New message from ${sender.profile?.firstName || 'User'}`,
      body: message,
      data: { senderId, messageId: null },
      channels: ['PUSH']
    });

    return { success: true };

  } catch (error) {
    console.error('Send message notification error:', error);
    throw new Error('Failed to send message notification');
  }
};

module.exports = {
  sendPushNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendOrderNotification,
  sendMessageNotification
};

