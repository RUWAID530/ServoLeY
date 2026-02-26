const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { loginLimiter, otpVerifyLimiter } = require('../middleware/rateLimits');
const { strictBody } = require('../middleware/validation');
const { createOTP, verifyOTP } = require('../utils/otp');
const { sendEmailOTP } = require('../utils/email');
const { signAccessToken } = require('../utils/jwt');

const router = express.Router();

// Admin login - request OTP
router.post(
  '/login',
  loginLimiter,
  strictBody([body('email').isEmail().isLength({ max: 254 })]),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email } = req.body;
    const admin = await prisma.users.findFirst({ where: { email, userType: 'ADMIN', isActive: true } });
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { code } = await createOTP(admin.id, 'EMAIL');
    try { await sendEmailOTP(email, code); } catch {}
    res.json({ success: true, data: { userId: admin.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Admin verify OTP
router.post(
  '/verify',
  otpVerifyLimiter,
  strictBody([
    body('userId').isString().isLength({ min: 1, max: 64 }),
    body('code').isString().isLength({ min: 6, max: 6 })
  ]),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { userId, code } = req.body;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.userType !== 'ADMIN') return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await verifyOTP(userId, code);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });
    const token = signAccessToken({ userId, userType: 'ADMIN' });
    res.json({ success: true, data: { token } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;



