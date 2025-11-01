const { sendOrderNotification, sendMessageNotification } = require('./notifications');

// Trigger order notifications
const triggerOrderNotification = async (orderId, status) => {
  try {
    await sendOrderNotification(orderId, status);
    console.log(`Order notification triggered: ${orderId} - ${status}`);
  } catch (error) {
    console.error('Trigger order notification error:', error);
  }
};

// Trigger message notifications
const triggerMessageNotification = async (senderId, receiverId, message) => {
  try {
    await sendMessageNotification(senderId, receiverId, message);
    console.log(`Message notification triggered: ${senderId} -> ${receiverId}`);
  } catch (error) {
    console.error('Trigger message notification error:', error);
  }
};

// Trigger wallet notifications
const triggerWalletNotification = async (userId, type, amount, balance) => {
  try {
    const { sendNotification } = require('./notifications');
    
    let title, body;
    
    switch (type) {
      case 'TOPUP':
        title = 'Wallet Top-up Successful';
        body = `₹${amount} has been added to your wallet. New balance: ₹${balance}`;
        break;
      case 'PAYMENT':
        title = 'Payment Processed';
        body = `₹${amount} has been deducted from your wallet. New balance: ₹${balance}`;
        break;
      case 'REFUND':
        title = 'Refund Processed';
        body = `₹${amount} has been refunded to your wallet. New balance: ₹${balance}`;
        break;
      case 'WITHDRAWAL':
        title = 'Withdrawal Request';
        body = `Withdrawal request of ₹${amount} has been submitted`;
        break;
    }

    await sendNotification({
      userId,
      type: 'WALLET',
      title,
      body,
      data: { type, amount, balance },
      channels: ['PUSH', 'EMAIL']
    });

    console.log(`Wallet notification triggered: ${userId} - ${type}`);
  } catch (error) {
    console.error('Trigger wallet notification error:', error);
  }
};

// Trigger service notifications
const triggerServiceNotification = async (providerId, type, serviceName) => {
  try {
    const { sendNotification } = require('./notifications');
    
    let title, body;
    
    switch (type) {
      case 'NEW_ORDER':
        title = 'New Order Received';
        body = `You have a new order for ${serviceName}`;
        break;
      case 'ORDER_CANCELLED':
        title = 'Order Cancelled';
        body = `Order for ${serviceName} has been cancelled`;
        break;
      case 'SERVICE_REVIEWED':
        title = 'Service Reviewed';
        body = `Your service ${serviceName} has been reviewed`;
        break;
    }

    await sendNotification({
      userId: providerId,
      type: 'SERVICE',
      title,
      body,
      data: { type, serviceName },
      channels: ['PUSH', 'EMAIL']
    });

    console.log(`Service notification triggered: ${providerId} - ${type}`);
  } catch (error) {
    console.error('Trigger service notification error:', error);
  }
};

// Trigger system notifications
const triggerSystemNotification = async (userId, title, body, data = {}) => {
  try {
    const { sendNotification } = require('./notifications');
    
    await sendNotification({
      userId,
      type: 'SYSTEM',
      title,
      body,
      data,
      channels: ['PUSH', 'EMAIL']
    });

    console.log(`System notification triggered: ${userId}`);
  } catch (error) {
    console.error('Trigger system notification error:', error);
  }
};

// Trigger bulk notifications
const triggerBulkNotification = async (userIds, title, body, data = {}) => {
  try {
    const { sendNotification } = require('./notifications');
    
    const promises = userIds.map(userId => 
      sendNotification({
        userId,
        type: 'BULK',
        title,
        body,
        data,
        channels: ['PUSH', 'EMAIL']
      })
    );

    await Promise.all(promises);
    console.log(`Bulk notification triggered: ${userIds.length} users`);
  } catch (error) {
    console.error('Trigger bulk notification error:', error);
  }
};

// Trigger promotional notifications
const triggerPromotionalNotification = async (userIds, title, body, data = {}) => {
  try {
    const { prisma } = require('../config/database');
    
    // Get users who have promotional notifications enabled
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        notificationPreferences: {
          promotions: true
        }
      }
    });

    if (users.length === 0) {
      console.log('No users with promotional notifications enabled');
      return;
    }

    const { sendNotification } = require('./notifications');
    
    const promises = users.map(user => 
      sendNotification({
        userId: user.id,
        type: 'PROMOTION',
        title,
        body,
        data,
        channels: ['PUSH', 'EMAIL']
      })
    );

    await Promise.all(promises);
    console.log(`Promotional notification triggered: ${users.length} users`);
  } catch (error) {
    console.error('Trigger promotional notification error:', error);
  }
};

// Trigger location-based notifications
const triggerLocationNotification = async (area, title, body, data = {}) => {
  try {
    const { prisma } = require('../config/database');
    
    // Get users in the specified area
    const users = await prisma.user.findMany({
      where: {
        profile: {
          city: area
        },
        isActive: true
      },
      select: { id: true }
    });

    if (users.length === 0) {
      console.log(`No users found in area: ${area}`);
      return;
    }

    const userIds = users.map(user => user.id);
    await triggerBulkNotification(userIds, title, body, data);
    
    console.log(`Location notification triggered: ${area} - ${users.length} users`);
  } catch (error) {
    console.error('Trigger location notification error:', error);
  }
};

// Trigger category-based notifications
const triggerCategoryNotification = async (category, title, body, data = {}) => {
  try {
    const { prisma } = require('../config/database');
    
    // Get providers in the specified category
    const providers = await prisma.provider.findMany({
      where: {
        category,
        isActive: true
      },
      select: { userId: true }
    });

    if (providers.length === 0) {
      console.log(`No providers found in category: ${category}`);
      return;
    }

    const userIds = providers.map(provider => provider.userId);
    await triggerBulkNotification(userIds, title, body, data);
    
    console.log(`Category notification triggered: ${category} - ${providers.length} providers`);
  } catch (error) {
    console.error('Trigger category notification error:', error);
  }
};

module.exports = {
  triggerOrderNotification,
  triggerMessageNotification,
  triggerWalletNotification,
  triggerServiceNotification,
  triggerSystemNotification,
  triggerBulkNotification,
  triggerPromotionalNotification,
  triggerLocationNotification,
  triggerCategoryNotification
};


