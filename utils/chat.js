const { prisma } = require('../config/database');
const { sendNotification } = require('./notifications');

// Send message
const sendMessage = async (senderId, receiverId, content, orderId = null) => {
  try {
    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        orderId
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        }
      }
    });

    // Send push notification to receiver
    await sendNotification({
      userId: receiverId,
      type: 'MESSAGE',
      title: 'New Message',
      body: content,
      data: {
        senderId,
        messageId: message.id,
        orderId
      }
    });

    console.log(`Message sent from ${senderId} to ${receiverId}`);
    return message;

  } catch (error) {
    console.error('Send message error:', error);
    throw new Error('Failed to send message');
  }
};

// Get conversation between two users
const getConversation = async (userId1, userId2, orderId = null, page = 1, limit = 50) => {
  try {
    const skip = (page - 1) * limit;

    const whereClause = {
      OR: [
        {
          senderId: userId1,
          receiverId: userId2
        },
        {
          senderId: userId2,
          receiverId: userId1
        }
      ]
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit
    });

    const total = await prisma.message.count({
      where: whereClause
    });

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
    const skip = (page - 1) * limit;

    // Get unique conversation partners
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        },
        order: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId', 'receiverId']
    });

    // Group conversations by partner
    const conversationMap = new Map();

    conversations.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partner: partner,
          lastMessage: message,
          unreadCount: 0,
          order: message.order
        });
      }
    });

    // Calculate unread messages for each conversation
    for (const [partnerId, conversation] of conversationMap) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: partnerId,
          receiverId: userId,
          readAt: null
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversationList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt))
      .slice(skip, skip + limit);

    const total = conversationMap.size;

    return {
      conversations: conversationList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Get user conversations error:', error);
    throw new Error('Failed to get user conversations');
  }
};

// Mark messages as read
const markMessagesAsRead = async (userId, senderId, orderId = null) => {
  try {
    const whereClause = {
      senderId,
      receiverId: userId,
      readAt: null
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    await prisma.message.updateMany({
      where: whereClause,
      data: {
        readAt: new Date()
      }
    });

    console.log(`Messages marked as read for user ${userId} from sender ${senderId}`);
    return { success: true };

  } catch (error) {
    console.error('Mark messages as read error:', error);
    throw new Error('Failed to mark messages as read');
  }
};

// Get unread message count
const getUnreadMessageCount = async (userId) => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null
      }
    });

    return count;

  } catch (error) {
    console.error('Get unread message count error:', error);
    throw new Error('Failed to get unread message count');
  }
};

// Delete message
const deleteMessage = async (messageId, userId) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await prisma.message.delete({
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
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true,
        readAt: true
      }
    });

    const stats = {
      totalMessages: messages.length,
      sentMessages: messages.filter(msg => msg.senderId === userId).length,
      receivedMessages: messages.filter(msg => msg.receiverId === userId).length,
      unreadMessages: messages.filter(msg => msg.receiverId === userId && !msg.readAt).length,
      readRate: 0
    };

    if (stats.receivedMessages > 0) {
      stats.readRate = ((stats.receivedMessages - stats.unreadMessages) / stats.receivedMessages) * 100;
    }

    return stats;

  } catch (error) {
    console.error('Get message statistics error:', error);
    throw new Error('Failed to get message statistics');
  }
};

// Search messages
const searchMessages = async (userId, query, orderId = null) => {
  try {
    const whereClause = {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ],
      content: {
        contains: query,
        mode: 'insensitive'
      }
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        },
        order: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return messages;

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


