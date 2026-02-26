const Razorpay = require('razorpay');
const crypto = require('crypto');

const isMockPaymentConfigured = () => {
  const raw = String(process.env.MOCK_PAYMENT || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
};

const hasRazorpayCredentials = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  return Boolean(keyId && keySecret);
};

// For local/dev MVPs, automatically fall back to mock mode when creds are absent.
const isMockPaymentEnabled = () => isMockPaymentConfigured() || (process.env.NODE_ENV !== 'production' && !hasRazorpayCredentials());

let razorpay = null;

const getRazorpayClient = () => {
  if (isMockPaymentEnabled()) {
    return null;
  }

  if (razorpay) {
    return razorpay;
  }

  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  return razorpay;
};

// Create payment order
const createPaymentOrder = async (amount, currency = 'INR', receipt = null) => {
  if (isMockPaymentEnabled()) {
    const safeAmount = Math.round(Number(amount) * 100) / 100;
    const mockOrderId = `mock_order_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    return {
      success: true,
      orderId: mockOrderId,
      amount: safeAmount,
      currency,
      receipt: receipt || `mock_receipt_${Date.now()}`,
      isMock: true
    };
  }

  try {
    const client = getRazorpayClient();
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        platform: 'ServoLeY',
        timestamp: new Date().toISOString()
      }
    };

    const order = await client.orders.create(options);
    
    console.log('Razorpay order created:', order.id);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      isMock: false
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Failed to create payment order');
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (isMockPaymentEnabled()) {
    return true;
  }

  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;
    
    console.log('Payment verification:', { isValid, orderId, paymentId });
    return isValid;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
};

// Capture payment
const capturePayment = async (paymentId, amount) => {
  try {
    const client = getRazorpayClient();
    const payment = await client.payments.capture(
      paymentId,
      Math.round(amount * 100), // Convert to paise
      'INR'
    );

    console.log('Payment captured:', payment.id);
    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount / 100, // Convert back to rupees
      method: payment.method
    };
  } catch (error) {
    console.error('Payment capture failed:', error);
    throw new Error('Failed to capture payment');
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  if (isMockPaymentEnabled()) {
    return {
      success: true,
      paymentId: paymentId || `mock_payment_${Date.now()}`,
      status: 'captured',
      amount: null,
      currency: 'INR',
      method: 'mock',
      description: 'Mock payment details',
      createdAt: new Date()
    };
  }

  try {
    const client = getRazorpayClient();
    const payment = await client.payments.fetch(paymentId);
    
    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      description: payment.description,
      createdAt: new Date(payment.created_at * 1000)
    };
  } catch (error) {
    console.error('Get payment details failed:', error);
    throw new Error('Failed to get payment details');
  }
};

// Create refund
const createRefund = async (paymentId, amount, notes = {}) => {
  try {
    const client = getRazorpayClient();
    const refund = await client.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      notes: {
        platform: 'ServoLeY',
        timestamp: new Date().toISOString(),
        ...notes
      }
    });

    console.log('Refund created:', refund.id);
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      notes: refund.notes
    };
  } catch (error) {
    console.error('Refund creation failed:', error);
    throw new Error('Failed to create refund');
  }
};

// Get refund details
const getRefundDetails = async (refundId) => {
  try {
    const client = getRazorpayClient();
    const refund = await client.payments.fetchRefund(refundId);
    
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      notes: refund.notes,
      createdAt: new Date(refund.created_at * 1000)
    };
  } catch (error) {
    console.error('Get refund details failed:', error);
    throw new Error('Failed to get refund details');
  }
};

// Create transfer to provider
const createTransfer = async (accountId, amount, notes = {}) => {
  try {
    const client = getRazorpayClient();
    const transfer = await client.transfers.create({
      account: accountId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      notes: {
        platform: 'ServoLeY',
        timestamp: new Date().toISOString(),
        ...notes
      }
    });

    console.log('Transfer created:', transfer.id);
    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100,
      status: transfer.status
    };
  } catch (error) {
    console.error('Transfer creation failed:', error);
    throw new Error('Failed to create transfer');
  }
};

// Validate webhook signature
const validateWebhookSignature = (body, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  capturePayment,
  getPaymentDetails,
  createRefund,
  getRefundDetails,
  createTransfer,
  validateWebhookSignature
};


