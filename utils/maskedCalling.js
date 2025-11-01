const twilio = require('twilio');
const { prisma } = require('../config/database');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Create masked call between customer and provider
const createMaskedCall = async (customerId, providerId, orderId = null) => {
  try {
    // Get user phone numbers
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { phone: true, profile: { select: { firstName: true, lastName: true } } }
    });

    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      select: { phone: true, profile: { select: { firstName: true, lastName: true } } }
    });

    if (!customer?.phone || !provider?.phone) {
      throw new Error('Customer or provider phone number not found');
    }

    // Create call session
    const callSession = await prisma.callSession.create({
      data: {
        customerId,
        providerId,
        orderId,
        status: 'INITIATED',
        customerPhone: customer.phone,
        providerPhone: provider.phone
      }
    });

    // Create Twilio call
    const call = await client.calls.create({
      twiml: `<Response>
        <Say>Connecting you to your service provider. Please hold.</Say>
        <Dial>
          <Number>${provider.phone}</Number>
        </Dial>
      </Response>`,
      to: customer.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: `${process.env.API_BASE_URL}/api/communication/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    // Update call session with Twilio call SID
    await prisma.callSession.update({
      where: { id: callSession.id },
      data: {
        twilioCallSid: call.sid,
        status: 'RINGING'
      }
    });

    console.log(`Masked call created: ${call.sid} between ${customerId} and ${providerId}`);
    
    return {
      success: true,
      callSessionId: callSession.id,
      twilioCallSid: call.sid,
      status: 'RINGING'
    };

  } catch (error) {
    console.error('Create masked call error:', error);
    throw new Error('Failed to create masked call');
  }
};

// Handle call status updates
const handleCallStatusUpdate = async (callSid, status, duration = null) => {
  try {
    const callSession = await prisma.callSession.findFirst({
      where: { twilioCallSid: callSid }
    });

    if (!callSession) {
      console.error(`Call session not found for Twilio SID: ${callSid}`);
      return;
    }

    // Update call session status
    await prisma.callSession.update({
      where: { id: callSession.id },
      data: {
        status: status.toUpperCase(),
        duration: duration ? parseInt(duration) : null,
        endedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    // Log call activity
    await prisma.callLog.create({
      data: {
        callSessionId: callSession.id,
        status: status.toUpperCase(),
        duration: duration ? parseInt(duration) : null,
        timestamp: new Date()
      }
    });

    console.log(`Call ${callSid} status updated to ${status}`);

  } catch (error) {
    console.error('Handle call status update error:', error);
  }
};

// Get call history for user
const getCallHistory = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const callSessions = await prisma.callSession.findMany({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId }
        ]
      },
      include: {
        customer: {
          include: {
            profile: true
          }
        },
        provider: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        order: {
          include: {
            service: true
          }
        },
        callLogs: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.callSession.count({
      where: {
        OR: [
          { customerId: userId },
          { providerId: userId }
        ]
      }
    });

    return {
      callSessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Get call history error:', error);
    throw new Error('Failed to get call history');
  }
};

// Get call statistics
const getCallStatistics = async (userId, startDate = null, endDate = null) => {
  try {
    const whereClause = {
      OR: [
        { customerId: userId },
        { providerId: userId }
      ]
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const callSessions = await prisma.callSession.findMany({
      where: whereClause,
      select: {
        status: true,
        duration: true,
        createdAt: true
      }
    });

    const stats = {
      totalCalls: callSessions.length,
      answeredCalls: callSessions.filter(call => call.status === 'COMPLETED').length,
      missedCalls: callSessions.filter(call => call.status === 'NO-ANSWER').length,
      totalDuration: callSessions.reduce((sum, call) => sum + (call.duration || 0), 0),
      averageDuration: 0,
      answerRate: 0
    };

    if (stats.totalCalls > 0) {
      stats.averageDuration = stats.totalDuration / stats.answeredCalls;
      stats.answerRate = (stats.answeredCalls / stats.totalCalls) * 100;
    }

    return stats;

  } catch (error) {
    console.error('Get call statistics error:', error);
    throw new Error('Failed to get call statistics');
  }
};

// End call
const endCall = async (callSessionId) => {
  try {
    const callSession = await prisma.callSession.findUnique({
      where: { id: callSessionId }
    });

    if (!callSession) {
      throw new Error('Call session not found');
    }

    if (callSession.twilioCallSid) {
      // End the Twilio call
      await client.calls(callSession.twilioCallSid).update({
        status: 'completed'
      });
    }

    // Update call session
    await prisma.callSession.update({
      where: { id: callSessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    console.log(`Call session ${callSessionId} ended`);
    return { success: true };

  } catch (error) {
    console.error('End call error:', error);
    throw new Error('Failed to end call');
  }
};

module.exports = {
  createMaskedCall,
  handleCallStatusUpdate,
  getCallHistory,
  getCallStatistics,
  endCall
};


