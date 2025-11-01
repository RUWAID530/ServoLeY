const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ServoLeY API is running (Simple Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ServoLeY API (Simple) running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
});

module.exports = app;
