const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

const router = express.Router();

// ==================== SUPPORT TICKETS ====================

// Create support ticket
router.post('/tickets', [
  authenticateToken,
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority')
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

    const { subject, description, priority = 'MEDIUM' } = req.body;

    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user.id,
        subject,
        description,
        priority
      }
    });

    // Notify admin about new ticket
    const admins = await prisma.user.findMany({
      where: { userType: 'ADMIN' }
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        type: 'SUPPORT',
        title: 'New Support Ticket',
        body: `New ticket from ${req.user.profile?.firstName || 'User'}: ${subject}`,
        data: { ticketId: ticket.id },
        channels: ['PUSH', 'EMAIL']
      });
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
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.ticket.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        OR: [
          { userId: req.user.id },
          { ...(req.user.userType === 'ADMIN' && {}) }
        ]
      },
      include: {
        user: {
          include: {
            profile: true
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
  body('status').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status')
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
    const { status } = req.body;

    const ticket = await prisma.ticket.findFirst({
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

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
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

// ==================== ADMIN SUPPORT MANAGEMENT ====================

// Get all tickets (Admin)
router.get('/admin/tickets', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

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

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.ticket.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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
  body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('response').optional().isString().withMessage('Response must be a string')
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
    const { status, priority, response } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (response) updateData.response = response;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    // Notify user about ticket update
    if (status && status !== ticket.status) {
      await sendNotification({
        userId: ticket.userId,
        type: 'SUPPORT',
        title: 'Support Ticket Updated',
        body: `Your ticket "${ticket.subject}" has been updated to ${status}`,
        data: { ticketId: ticket.id, status },
        channels: ['PUSH', 'EMAIL']
      });
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
    const totalTickets = await prisma.ticket.count({
      where: whereClause
    });

    const statusBreakdown = await prisma.ticket.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    const priorityBreakdown = await prisma.ticket.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { priority: true }
    });

    // Get average resolution time
    const resolvedTickets = await prisma.ticket.findMany({
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
    const recentTickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true
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
    const categories = await prisma.fAQ.findMany({
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

    const faqs = await prisma.fAQ.findMany({
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

    const { question, answer, category, order = 0 } = req.body;

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category,
        order
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

    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId }
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const updatedFAQ = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(category && { category }),
        ...(order !== undefined && { order })
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

    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId }
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await prisma.fAQ.delete({
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


