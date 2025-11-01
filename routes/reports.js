const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  generateUserAnalytics,
  generateOrderAnalytics,
  generateFinancialReport,
  generateSupportAnalytics,
  generateAdminReport,
  exportReportToCSV
} = require('../utils/adminReports');

const router = express.Router();

// Generate user analytics report
router.get('/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await generateUserAnalytics(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate user analytics'
    });
  }
});

// Generate order analytics report
router.get('/orders', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await generateOrderAnalytics(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate order analytics'
    });
  }
});

// Generate financial report
router.get('/financial', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await generateFinancialReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report'
    });
  }
});

// Generate support analytics report
router.get('/support', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await generateSupportAnalytics(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate support analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate support analytics'
    });
  }
});

// Generate comprehensive admin report
router.get('/comprehensive', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await generateAdminReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate comprehensive report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive report'
    });
  }
});

// Export report to CSV
router.get('/export/:type', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    const { csv, filename } = await exportReportToCSV(type, startDate, endDate);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Get report templates
router.get('/templates', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const templates = [
      {
        id: 'user_analytics',
        name: 'User Analytics',
        description: 'User registration, verification, and activity analytics',
        fields: ['totalUsers', 'newUsers', 'verifiedUsers', 'userTypes', 'providers']
      },
      {
        id: 'order_analytics',
        name: 'Order Analytics',
        description: 'Order statistics, completion rates, and revenue analytics',
        fields: ['totalOrders', 'completedOrders', 'revenue', 'statusBreakdown', 'categories']
      },
      {
        id: 'financial_report',
        name: 'Financial Report',
        description: 'Revenue, commission, and financial performance metrics',
        fields: ['totalRevenue', 'commission', 'topProviders', 'walletStats']
      },
      {
        id: 'support_analytics',
        name: 'Support Analytics',
        description: 'Support ticket statistics and resolution metrics',
        fields: ['totalTickets', 'resolutionRate', 'averageResolutionTime', 'priorityBreakdown']
      },
      {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete platform overview with all metrics',
        fields: ['users', 'orders', 'financial', 'support']
      }
    ];

    res.json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report templates'
    });
  }
});

// Schedule automated reports
router.post('/schedule', [
  authenticateToken,
  requireRole('ADMIN'),
  body('reportType').isIn(['user_analytics', 'order_analytics', 'financial_report', 'support_analytics', 'comprehensive']).withMessage('Invalid report type'),
  body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { reportType, frequency, email } = req.body;

    // This would integrate with a job scheduler like Bull or Agenda
    // For now, we'll just store the schedule preference
    
    const schedule = await prisma.reportSchedule.create({
      data: {
        adminId: req.user.id,
        reportType,
        frequency,
        email,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Report schedule created successfully',
      data: { schedule }
    });

  } catch (error) {
    console.error('Schedule report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule report'
    });
  }
});

// Get scheduled reports
router.get('/schedules', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const schedules = await prisma.reportSchedule.findMany({
      where: { adminId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { schedules }
    });

  } catch (error) {
    console.error('Get scheduled reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled reports'
    });
  }
});

// Update scheduled report
router.put('/schedules/:scheduleId', [
  authenticateToken,
  requireRole('ADMIN'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { isActive, frequency, email } = req.body;

    const schedule = await prisma.reportSchedule.findFirst({
      where: {
        id: scheduleId,
        adminId: req.user.id
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const updatedSchedule = await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(frequency && { frequency }),
        ...(email && { email })
      }
    });

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule: updatedSchedule }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule'
    });
  }
});

// Delete scheduled report
router.delete('/schedules/:scheduleId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.reportSchedule.findFirst({
      where: {
        id: scheduleId,
        adminId: req.user.id
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    await prisma.reportSchedule.delete({
      where: { id: scheduleId }
    });

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule'
    });
  }
});

module.exports = router;


