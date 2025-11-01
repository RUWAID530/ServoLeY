const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ServoLeY API is running (No DB Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock auth routes for testing
app.post('/api/auth/register', (req, res) => {
  const { email, phone, firstName, lastName, userType } = req.body;

  // Log the entire request body for debugging
  console.log('🔓 Development mode: Mock registration');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  // Always return success response
  const response = {
    success: true,
    message: 'Registration successful',
    data: {
      userId: 'mock-id-123',
      user: {
        id: 'mock-id-123',
        email: email || '',
        phone: phone || '',
        name: `${firstName || ''} ${lastName || ''}`.trim() || 'Test User',
        firstName: firstName || '',
        lastName: lastName || '',
        userType: userType || 'CUSTOMER',
        isVerified: false
      },
      token: 'mock-jwt-token'
    }
  };

  console.log('Response being sent:', JSON.stringify(response, null, 2));
  res.status(201).json(response);
});

app.post('/api/auth/login', (req, res) => {
  const { email, phone } = req.body;
  console.log('🔓 Development mode: Mock login for', email || phone);

  // Always return success response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      userId: 'mock-id-123',
      user: {
        id: 'mock-id-123',
        email: email || '',
        phone: phone || '',
        name: 'Test User',
        isVerified: true
      },
      token: 'mock-jwt-token'
    }
  });
});

// Mock OTP routes for testing
app.post('/api/otp/generate', (req, res) => {
  const { email, phone } = req.body;
  console.log('🔓 Development mode: Using fixed OTP 123456 for', email || phone);

  // Always return success response
  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      // In development, we always return 123456
      otp: process.env.NODE_ENV === 'development' ? '123456' : undefined
    }
  });
});

app.post('/api/otp/verify', (req, res) => {
  const { email, phone, otp } = req.body;
  console.log('🔓 Development mode: Verifying OTP', otp, 'for', email || phone);

  // In development, always accept any OTP
  if (process.env.NODE_ENV === 'development') {
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });
  }
});

// Add endpoint for OTP verification that frontend expects
app.post('/api/auth/verify-otp', (req, res) => {
  const { userId, code } = req.body;
  console.log('🔓 Development mode: Verifying OTP', code, 'for user', userId);

  // In development, always accept any OTP
  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      token: 'mock-jwt-token',
      user: {
        id: userId || 'mock-id-123',
        userType: 'CUSTOMER'
      }
    }
  });
});

// Add resend OTP endpoint
app.post('/api/auth/resend-otp', (req, res) => {
  const { userId } = req.body;
  console.log('🔓 Development mode: Resending OTP for user', userId);

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
    data: {
      otp: process.env.NODE_ENV === 'development' ? '123456' : undefined
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ServoLeY API (No DB Mode) running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔓 Development mode: Database bypassed, using mock data`);
});

module.exports = app;
