const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const jwt = require('jsonwebtoken');
const { createOTP, verifyOTP } = require('../utils/otp');
const { sendEmailOTP } = require('../utils/email');

const router = express.Router();

// Admin login - request OTP
router.post('/login', [body('email').isEmail()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email } = req.body;
    const admin = await prisma.user.findFirst({ where: { email, userType: 'ADMIN', isActive: true } });
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { code } = await createOTP(admin.id, 'EMAIL');
    try { await sendEmailOTP(email, code); } catch {}
    res.json({ success: true, data: { userId: admin.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Admin verify OTP
router.post('/verify', [body('userId').notEmpty(), body('code').isLength({ min: 6, max: 6 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { userId, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.userType !== 'ADMIN') return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await verifyOTP(userId, code);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });
    const token = jwt.sign({ userId, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success: true, data: { token } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;



