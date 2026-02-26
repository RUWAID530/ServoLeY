const express = require('express');
const { randomUUID } = require('crypto');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const round2 = (value) => Math.round(Number(value) * 100) / 100;
const nowIso = () => new Date().toISOString();

const getStore = () => {
  if (!global.__SERVOLEY_ESCROW_STORE__) {
    global.__SERVOLEY_ESCROW_STORE__ = {
      transactions: []
    };
  }
  return global.__SERVOLEY_ESCROW_STORE__;
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
};

const canAccessTransaction = (user, transaction) => {
  if (!user || !transaction) return false;
  if (user.userType === 'ADMIN') return true;
  return (
    String(transaction.customerId) === String(user.id) ||
    String(transaction.providerId) === String(user.id)
  );
};

router.post(
  '/transactions',
  [
    authenticateToken,
    body('providerId').notEmpty().withMessage('Provider ID is required'),
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('platformFeePercent').optional().isFloat({ min: 0, max: 30 }).withMessage('Invalid platform fee percent')
  ],
  async (req, res) => {
    const failed = validate(req, res);
    if (failed) return failed;

    const store = getStore();
    const amount = round2(req.body.amount);
    const platformFeePercent = Number(req.body.platformFeePercent ?? 5);
    const platformFee = round2((amount * platformFeePercent) / 100);

    const transaction = {
      id: randomUUID(),
      customerId: String(req.user.id),
      providerId: String(req.body.providerId),
      amount,
      platformFee,
      status: 'pending',
      serviceId: String(req.body.serviceId),
      createdAt: nowIso(),
      releasedAt: null,
      disputeReason: null
    };

    store.transactions.unshift(transaction);

    return res.status(201).json({
      success: true,
      data: transaction
    });
  }
);

router.post(
  '/transactions/:transactionId/hold',
  [authenticateToken],
  async (req, res) => {
    const store = getStore();
    const transaction = store.transactions.find((item) => item.id === req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (!canAccessTransaction(req.user, transaction)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (transaction.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Only pending transactions can be held' });
    }

    transaction.status = 'held';
    return res.json({ success: true, data: transaction });
  }
);

router.post(
  '/transactions/:transactionId/release',
  [
    authenticateToken,
    body('releaseAmount').optional().isFloat({ gt: 0 }).withMessage('Invalid release amount')
  ],
  async (req, res) => {
    const failed = validate(req, res);
    if (failed) return failed;

    const store = getStore();
    const transaction = store.transactions.find((item) => item.id === req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (!canAccessTransaction(req.user, transaction)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['held', 'disputed'].includes(String(transaction.status))) {
      return res.status(409).json({ success: false, message: 'Only held/disputed transactions can be released' });
    }

    const releaseAmount = req.body.releaseAmount == null ? transaction.amount : round2(req.body.releaseAmount);
    if (releaseAmount > transaction.amount) {
      return res.status(400).json({ success: false, message: 'Release amount cannot exceed transaction amount' });
    }

    transaction.amount = releaseAmount;
    transaction.status = 'released';
    transaction.releasedAt = nowIso();

    return res.json({ success: true, data: transaction });
  }
);

router.post(
  '/transactions/:transactionId/refund',
  [
    authenticateToken,
    body('refundAmount').optional().isFloat({ gt: 0 }).withMessage('Invalid refund amount'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  async (req, res) => {
    const failed = validate(req, res);
    if (failed) return failed;

    const store = getStore();
    const transaction = store.transactions.find((item) => item.id === req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (!canAccessTransaction(req.user, transaction)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['pending', 'held', 'disputed'].includes(String(transaction.status))) {
      return res.status(409).json({ success: false, message: 'Transaction cannot be refunded in current status' });
    }

    const refundAmount = req.body.refundAmount == null ? transaction.amount : round2(req.body.refundAmount);
    if (refundAmount > transaction.amount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed transaction amount' });
    }

    transaction.amount = refundAmount;
    transaction.status = 'refunded';

    return res.json({
      success: true,
      data: {
        ...transaction,
        refundReason: String(req.body.reason || 'Refund processed')
      }
    });
  }
);

router.post(
  '/transactions/:transactionId/dispute',
  [
    authenticateToken,
    body('disputeReason').notEmpty().withMessage('Dispute reason is required'),
    body('initiatedBy').optional().isIn(['customer', 'provider']).withMessage('Invalid initiator')
  ],
  async (req, res) => {
    const failed = validate(req, res);
    if (failed) return failed;

    const store = getStore();
    const transaction = store.transactions.find((item) => item.id === req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (!canAccessTransaction(req.user, transaction)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['pending', 'held'].includes(String(transaction.status))) {
      return res.status(409).json({ success: false, message: 'Only pending/held transactions can be disputed' });
    }

    transaction.status = 'disputed';
    transaction.disputeReason = String(req.body.disputeReason);

    return res.json({ success: true, data: transaction });
  }
);

router.get('/transactions', authenticateToken, async (req, res) => {
  const store = getStore();
  const limit = Math.max(Math.min(Number(req.query.limit || 50), 100), 1);
  const status = String(req.query.status || '').trim().toLowerCase();
  const userIdFilter = String(req.query.user_id || '').trim();

  let rows = store.transactions.filter((item) => {
    if (!canAccessTransaction(req.user, item)) return false;
    if (status && String(item.status).toLowerCase() !== status) return false;

    if (!userIdFilter) return true;
    return (
      String(item.customerId) === userIdFilter ||
      String(item.providerId) === userIdFilter
    );
  });

  rows = rows.slice(0, limit);

  return res.json({
    success: true,
    data: {
      transactions: rows
    }
  });
});

router.get('/account/balance', authenticateToken, async (req, res) => {
  const store = getStore();
  const rows = store.transactions.filter((item) => canAccessTransaction(req.user, item));

  const balance = round2(rows.reduce((sum, item) => sum + round2(item.amount), 0));
  const heldAmount = round2(
    rows
      .filter((item) => String(item.status) === 'held')
      .reduce((sum, item) => sum + round2(item.amount), 0)
  );
  const availableAmount = round2(
    rows
      .filter((item) => String(item.status) === 'released')
      .reduce((sum, item) => sum + round2(item.amount), 0)
  );

  return res.json({
    success: true,
    data: {
      accountId: `escrow_${req.user.id}`,
      balance,
      heldAmount,
      availableAmount,
      currency: 'INR'
    }
  });
});

module.exports = router;

