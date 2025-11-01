const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { connectDatabase } = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const otpRoutes = require('./routes/otp');
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payments');
const serviceRoutes = require('./routes/services');

const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const reviewRoutes = require('./routes/reviews');
const communicationRoutes = require('./routes/communication');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const reportRoutes = require('./routes/reports');
const chatRoutes = require('./routes/chat');
const adminAuthRoutes = require('./routes/adminAuth');
const notificationRoutes = require('./routes/notifications');
const providerRoutes = require('./routes/provider');
const locationRoutes = require('./routes/locations');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8084', 
      'http://localhost:5173', 
      'http://localhost:5174',
      // Add Project IDX domain when available
      process.env.PROJECT_IDX_URL
    ].filter(Boolean)
  }
});
app.set('io', io);
const PORT = process.env.PORT || 8084;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:8083', 
    'http://localhost:5173', 
    'http://localhost:5174',
    // Add Project IDX domain when available
    process.env.PROJECT_IDX_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/locations', locationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ServoLeY API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  // join order room
  socket.on('chat:join', ({ orderId, userId }) => {
    socket.join(orderId);
    io.to(orderId).emit('chat:presence', { userId, status: 'online' });
  });
  // typing indicator
  socket.on('chat:typing', ({ orderId, userId, typing }) => {
    socket.to(orderId).emit('chat:typing', { userId, typing });
  });
  // read receipts
  socket.on('chat:read', async ({ orderId, userId }) => {
    try {
      const { prisma } = require('./config/database');
      await prisma.message.updateMany({ where: { orderId, receiverId: userId, readAt: null }, data: { readAt: new Date() } });
      socket.to(orderId).emit('chat:read', { orderId, userId });
    } catch {}
  });
});

// Initialize database and start server
connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 ServoLeY API server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


module.exports = app; // Export for testing
