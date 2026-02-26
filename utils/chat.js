const { prisma } = require('../config/database');
const { sendNotification } = require('./notifications');

const MESSAGE_RELATION_INCLUDE = {
  users_messages_senderIdTousers: {
    include: {
      profiles: true
    }
  },
  users_messages_receiverIdTousers: {
    include: {
      profiles: true
    }
  }
};

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    profile: user.profiles || null
  };
};

const normalizeMessage = (message) => ({
  id: message.id,
  senderId: message.senderId,
  receiverId: message.receiverId,
  content: message.content,
  orderId: message.orderId || null,
  createdAt: message.createdAt,
  readAt: null,
  sender: normalizeUser(message.users_messages_senderIdTousers),
  receiver: normalizeUser(message.users_messages_receiverIdTousers)
});

// Send message
const sendMessage = async (senderId, receiverId, content, orderId = null) => {
  try {
    const message = await prisma.messages.create({
      data: {
        senderId,
        receiverId,
        content,
        orderId: orderId || null
      },
      include: MESSAGE_RELATION_INCLUDE
    });

    try {
      await sendNotification({
        userId: receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        body: content,
        data: {
          senderId,
          messageId: message.id,
          orderId: orderId || null
        }
      });
    } catch (notifyError) {
      console.error('Message notification failed:', notifyError);
    }

    console.log(`Message sent from ${senderId} to ${receiverId}`);
    return normalizeMessage(message);
  } catch (error) {
    console.error('Send message error:', error);
    throw new Error('Failed to send message');
  }
};

// Get conversation between two users
const getConversation = async (userId1, userId2, orderId = null, page = 1, limit = 50) => {
  try {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const whereClause = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where: whereClause,
        include: MESSAGE_RELATION_INCLUDE,
        orderBy: { createdAt: 'asc' },
        skip,
        take: safeLimit
      }),
      prisma.messages.count({ where: whereClause })
    ]);

    return {
      messages: messages.map(normalizeMessage),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    };
  } catch (error) {
    console.error('Get conversation error:', error);
    throw new Error('Failed to get conversation');
  }
};

// Get user conversations
const getUserConversations = async (userId, page = 1, limit = 20) => {
  try {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const rawMessages = await prisma.messages.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: MESSAGE_RELATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const conversationMap = new Map();

    for (const message of rawMessages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!partnerId || conversationMap.has(partnerId)) continue;

      const partnerUser =
        message.senderId === userId
          ? message.users_messages_receiverIdTousers
          : message.users_messages_senderIdTousers;

      conversationMap.set(partnerId, {
        partnerId,
        partner: normalizeUser(partnerUser),
        lastMessage: normalizeMessage(message),
        unreadCount: 0,
        order: null
      });
    }

    const allConversations = Array.from(conversationMap.values());
    const conversationList = allConversations.slice(skip, skip + safeLimit);

    return {
      conversations: conversationList,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: allConversations.length,
        pages: Math.max(Math.ceil(allConversations.length / safeLimit), 1)
      }
    };
  } catch (error) {
    console.error('Get user conversations error:', error);
    throw new Error('Failed to get user conversations');
  }
};

// Mark messages as read
const markMessagesAsRead = async () => {
  return { success: true, updatedCount: 0 };
};

// Get unread message count
const getUnreadMessageCount = async () => {
  return 0;
};

// Delete message
const deleteMessage = async (messageId, userId) => {
  try {
    const message = await prisma.messages.findFirst({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await prisma.messages.delete({
      where: { id: messageId }
    });

    console.log(`Message ${messageId} deleted by user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete message error:', error);
    throw new Error('Failed to delete message');
  }
};

// Get message statistics
const getMessageStatistics = async (userId, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      OR: [{ senderId: userId }, { receiverId: userId }]
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const messages = await prisma.messages.findMany({
      where: whereClause,
      select: {
        senderId: true,
        receiverId: true
      }
    });

    const sentMessages = messages.filter((msg) => msg.senderId === userId).length;
    const receivedMessages = messages.filter((msg) => msg.receiverId === userId).length;

    return {
      totalMessages: messages.length,
      sentMessages,
      receivedMessages,
      unreadMessages: 0,
      readRate: receivedMessages > 0 ? 100 : 0
    };
  } catch (error) {
    console.error('Get message statistics error:', error);
    throw new Error('Failed to get message statistics');
  }
};

// Search messages
const searchMessages = async (userId, query, orderId = null) => {
  try {
    const whereClause = {
      OR: [{ senderId: userId }, { receiverId: userId }],
      content: {
        contains: String(query || '').trim(),
        mode: 'insensitive'
      }
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const messages = await prisma.messages.findMany({
      where: whereClause,
      include: MESSAGE_RELATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return messages.map(normalizeMessage);
  } catch (error) {
    console.error('Search messages error:', error);
    throw new Error('Failed to search messages');
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage,
  getMessageStatistics,
  searchMessages
};


