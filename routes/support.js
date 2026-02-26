const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');
const { randomUUID } = require('crypto');

const router = express.Router();
const ALLOWED_TICKET_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'priority'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const buildTicketTimeline = (ticket, actions = []) => {
  const baseEvent = {
    id: `created-${ticket.id}`,
    type: 'CREATED',
    title: 'Ticket created',
    message: 'Ticket submitted and added to admin support queue.',
    createdAt: ticket.createdAt,
    actor: {
      id: ticket.userId,
      name: 'Customer',
      role: 'CUSTOMER'
    }
  };

  const actionEvents = actions.map((action) => {
    const details = action.details || {};
    const actorName = [
      action.users?.profiles?.firstName,
      action.users?.profiles?.lastName
    ].filter(Boolean).join(' ') || action.users?.email || 'Support Team';

    const changeLines = [];
    if (details?.changes?.status) {
      changeLines.push(`Status: ${details.changes.status.from} -> ${details.changes.status.to}`);
    }
    if (details?.changes?.priority) {
      changeLines.push(`Priority: ${details.changes.priority.from} -> ${details.changes.priority.to}`);
    }
    if (details?.note) {
      changeLines.push(`Note: ${String(details.note).trim()}`);
    }

    return {
      id: action.id,
      type: 'UPDATE',
      title: 'Support update',
      message: changeLines.join(' | ') || 'Ticket updated by support team.',
      createdAt: action.createdAt,
      actor: {
        id: action.adminId,
        name: actorName,
        role: details?.actorRole || 'ADMIN'
      }
    };
  });

  return [baseEvent, ...actionEvents].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

// ==================== SUPPORT TICKETS ====================

// Create support ticket
router.post('/tickets', [
  authenticateToken,
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority')
    .optional()
    .custom((value) => TICKET_PRIORITIES.includes(String(value).toUpperCase()))
    .withMessage('Invalid priority')
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

    const now = new Date();
    const subject = String(req.body.subject || '').trim();
    const description = String(req.body.description || '').trim();
    const priority = String(req.body.priority || 'MEDIUM').toUpperCase();

    const ticket = await prisma.tickets.create({
      data: {
        id: randomUUID(),
        userId: req.user.id,
        subject,
        description,
        priority,
        updatedAt: now
      }
    });

    // Notify admin about new ticket
    const admins = await prisma.users.findMany({
      where: { userType: 'ADMIN' }
    });

    for (const admin of admins) {
      try {
        await sendNotification({
          userId: admin.id,
          type: 'SUPPORT',
          title: 'New Support Ticket',
          body: `New ticket from ${req.user.profile?.firstName || 'User'}: ${subject}`,
          data: { ticketId: ticket.id },
          channels: ['PUSH', 'EMAIL']
        });
      } catch (notificationError) {
        // Ticket creation should not fail because notifications fail.
        console.error('Admin notification failed for support ticket:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

// Get user tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const priority = req.query.priority ? String(req.query.priority).toUpperCase() : undefined;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const tickets = await prisma.tickets.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.tickets.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tickets'
    });
  }
});

// Get ticket details
router.get('/tickets/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const whereClause = req.user.userType === 'ADMIN'
      ? { id: ticketId }
      : { id: ticketId, userId: req.user.id };

    const ticket = await prisma.tickets.findFirst({
      where: whereClause,
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket details'
    });
  }
});

// Update ticket status (User)
router.put('/tickets/:ticketId/status', [
  authenticateToken,
  body('status')
    .custom((value) => ['OPEN', 'CLOSED'].includes(String(value).toUpperCase()))
    .withMessage('Invalid status. Customer can only OPEN (reopen) or CLOSE a ticket.')
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

    const { ticketId } = req.params;
    const status = String(req.body.status).toUpperCase();

    const ticket = await prisma.tickets.findFirst({
      where: {
        id: ticketId,
        userId: req.user.id
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or unauthorized'
      });
    }

    if (ticket.status === status) {
      return res.json({
        success: true,
        message: 'Ticket already in requested status',
        data: { ticket }
      });
    }

    if (status === 'OPEN' && ticket.status !== 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Only CLOSED tickets can be reopened by customer'
      });
    }

    if (status === 'CLOSED' && ticket.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already CLOSED'
      });
    }

    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: { ticket: updatedTicket }
    });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status'
    });
  }
});

// Get ticket timeline
router.get('/tickets/:ticketId/timeline', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const whereClause = req.user.userType === 'ADMIN'
      ? { id: ticketId }
      : { id: ticketId, userId: req.user.id };

    const ticket = await prisma.tickets.findFirst({
      where: whereClause
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or unauthorized'
      });
    }

    const actions = await prisma.admin_actions.findMany({
      where: {
        targetId: ticket.id,
        action: 'SUPPORT_TICKET_UPDATED'
      },
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const timeline = buildTicketTimeline(ticket, actions);

    res.json({
      success: true,
      data: { timeline }
    });
  } catch (error) {
    console.error('Get ticket timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket timeline'
    });
  }
});

// ==================== ADMIN SUPPORT MANAGEMENT ====================

// Get all tickets (Admin)
router.get('/admin/tickets', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const priority = req.query.priority ? String(req.query.priority).toUpperCase() : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = ALLOWED_TICKET_SORT_FIELDS.includes(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'createdAt';
    const sortOrder = ALLOWED_SORT_ORDERS.includes(String(req.query.sortOrder).toLowerCase())
      ? String(req.query.sortOrder).toLowerCase()
      : 'desc';

    const whereClause = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (userId) whereClause.userId = userId;
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const tickets = await prisma.tickets.findMany({
      where: whereClause,
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    const total = await prisma.tickets.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tickets'
    });
  }
});

// Update ticket (Admin)
router.put('/admin/tickets/:ticketId', [
  authenticateToken,
  requireRole('ADMIN'),
  body('status')
    .optional()
    .custom((value) => TICKET_STATUSES.includes(String(value).toUpperCase()))
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .custom((value) => TICKET_PRIORITIES.includes(String(value).toUpperCase()))
    .withMessage('Invalid priority'),
  body('note')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Note should be a text up to 1000 characters')
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

    const { ticketId } = req.params;
    const status = req.body.status ? String(req.body.status).toUpperCase() : undefined;
    const priority = req.body.priority ? String(req.body.priority).toUpperCase() : undefined;
    const note = req.body.note ? String(req.body.note).trim() : '';

    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        users: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (!status && !priority && !note) {
      return res.status(400).json({
        success: false,
        message: 'At least one of status, priority, or note is required'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const updatedTicket = status || priority
      ? await prisma.tickets.update({
        where: { id: ticketId },
        data: updateData
      })
      : ticket;

    const changes = {};
    if (status && status !== ticket.status) {
      changes.status = { from: ticket.status, to: status };
    }
    if (priority && priority !== ticket.priority) {
      changes.priority = { from: ticket.priority, to: priority };
    }

    await prisma.admin_actions.create({
      data: {
        id: randomUUID(),
        adminId: req.user.id,
        action: 'SUPPORT_TICKET_UPDATED',
        targetId: ticket.id,
        details: {
          source: 'SUPPORT_QUEUE',
          ticketId: ticket.id,
          changes,
          note: note || null,
          actorRole: req.user.userType || 'ADMIN'
        }
      }
    });

    // Notify user about ticket update
    if ((status && status !== ticket.status) || note) {
      try {
        const noteSuffix = note ? ` | Note: ${note.slice(0, 120)}` : '';
        await sendNotification({
          userId: ticket.userId,
          type: 'SUPPORT',
          title: 'Support Ticket Updated',
          body: `Your ticket "${ticket.subject}" has an update.${status ? ` Status: ${status}.` : ''}${noteSuffix}`,
          data: { ticketId: ticket.id, status },
          channels: ['PUSH', 'EMAIL']
        });
      } catch (notificationError) {
        console.error('User notification failed for support update:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: updatedTicket }
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket'
    });
  }
});

// Get support statistics (Admin)
router.get('/admin/statistics', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get ticket statistics
    const totalTickets = await prisma.tickets.count({
      where: whereClause
    });

    const statusBreakdown = await prisma.tickets.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    const priorityBreakdown = await prisma.tickets.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { priority: true }
    });

    // Get average resolution time
    const resolvedTickets = await prisma.tickets.findMany({
      where: {
        status: 'RESOLVED',
        ...whereClause
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const resolutionTimes = resolvedTickets.map(ticket => {
      return new Date(ticket.updatedAt) - new Date(ticket.createdAt);
    });

    const averageResolutionTime = resolutionTimes.length > 0 ? 
      resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0;

    // Get recent tickets
    const recentTickets = await prisma.tickets.findMany({
      where: whereClause,
      include: {
        users: {
          include: {
            profiles: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalTickets,
          averageResolutionTime: Math.round(averageResolutionTime / (1000 * 60 * 60)), // in hours
          resolvedTickets: resolvedTickets.length
        },
        statusBreakdown,
        priorityBreakdown,
        recentTickets
      }
    });

  } catch (error) {
    console.error('Get support statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get support statistics'
    });
  }
});

// ==================== FAQ SYSTEM ====================

// Get FAQ categories
router.get('/faq/categories', async (req, res) => {
  try {
    const categories = await prisma.faqs.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(item => item.category);

    res.json({
      success: true,
      data: { categories: categoryList }
    });

  } catch (error) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FAQ categories'
    });
  }
});

// Get FAQs
router.get('/faq', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const whereClause = {};
    if (category) whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } }
      ];
    }

    const faqs = await prisma.faqs.findMany({
      where: whereClause,
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: { faqs }
    });

  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FAQs'
    });
  }
});

// Create FAQ (Admin)
router.post('/admin/faq', [
  authenticateToken,
  requireRole('ADMIN'),
  body('question').notEmpty().withMessage('Question is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('order').optional().isInt().withMessage('Order must be a number')
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

    const now = new Date();
    const { question, answer, category, order = 0 } = req.body;

    const faq = await prisma.faqs.create({
      data: {
        id: randomUUID(),
        question,
        answer,
        category,
        order,
        updatedAt: now
      }
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: { faq }
    });

  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ'
    });
  }
});

// Update FAQ (Admin)
router.put('/admin/faq/:faqId', [
  authenticateToken,
  requireRole('ADMIN'),
  body('question').optional().notEmpty().withMessage('Question cannot be empty'),
  body('answer').optional().notEmpty().withMessage('Answer cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('order').optional().isInt().withMessage('Order must be a number')
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

    const { faqId } = req.params;
    const { question, answer, category, order } = req.body;

    const faq = await prisma.faqs.findUnique({
      where: { id: faqId }
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const updatedFAQ = await prisma.faqs.update({
      where: { id: faqId },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(category && { category }),
        ...(order !== undefined && { order }),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: { faq: updatedFAQ }
    });

  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ'
    });
  }
});

// Delete FAQ (Admin)
router.delete('/admin/faq/:faqId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { faqId } = req.params;

    const faq = await prisma.faqs.findUnique({
      where: { id: faqId }
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await prisma.faqs.delete({
      where: { id: faqId }
    });

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });

  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ'
    });
  }
});

module.exports = router;


