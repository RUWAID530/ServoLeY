require('dotenv').config();

const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDatabase, prisma } = require('./config/database');
const { logger } = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimits');
const { authenticateToken } = require('./middleware/auth');
const { requestTimeout } = require('./middleware/securityMiddleware');
const { captureRawBody } = require('./middleware/requestSanitizer');
const { sanitizeRequestInput } = require('./middleware/requestSanitizer');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { verifyAccessToken } = require('./utils/jwt');
const SecurityConfigValidator = require('./utils/securityConfigValidator');

let compression = null;
try {
  compression = require('compression');
} catch {
  logger.warn('compression package is not installed. Install it for response compression.');
}

const authRoutes = require('./routes/auth_final');
const refreshRoutes = require('./routes/refresh');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payments');
const escrowRoutes = require('./routes/escrow');
const serviceRoutes = require('./routes/services');
const uploadRoutes = require('./routes/upload');
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

let orderRoutes = null;
try {
  orderRoutes = require('./routes/orders');
} catch (error) {
  logger.warn('Orders route is unavailable. /api/orders will be disabled.', error?.message);
}

const app = express();
app.set('trust proxy', 1);

// Validate security configuration before starting server
const securityValidation = SecurityConfigValidator.validateEnvironment();
if (!securityValidation.isValid) {
  console.error('🚨 SECURITY CONFIGURATION ERRORS:');
  securityValidation.errors.forEach(error => console.error(`  - ${error}`));
  console.error('\nServer cannot start with insecure configuration. Please fix the above errors.');
  process.exit(1);
}

if (securityValidation.warnings.length > 0) {
  console.warn('⚠️  Security warnings:');
  securityValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

const parseOrigins = () => {
  const raw = String(process.env.CORS_ORIGIN || '').trim();
  if (!raw) {
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8083',
      'http://localhost:8084'
    ];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' }
  })
);
app.use(cors(corsOptions));
if (compression) {
  app.use(compression());
}
app.use(requestTimeout(30000)); // 30 second timeout
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb', verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, limit: '1mb', verify: captureRawBody }));
app.use(sanitizeRequestInput);

// Uploads are now served via authenticated download endpoint only

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'servoley-api' });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'servoley-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/refresh', refreshRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/services', serviceRoutes);
if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
}
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);

// Disable escrow route in production until DB-backed implementation exists
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/escrow', escrowRoutes);
}

app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reports', reportRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.use(async (socket, next) => {
  try {
    const authToken = String(socket.handshake?.auth?.token || '').trim();
    const authHeader = String(socket.handshake?.headers?.authorization || '').trim();
    const token = authToken || (authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, userType: true, isActive: true, isBlocked: true }
    });

    if (!user || !user.isActive || user.isBlocked) {
      return next(new Error('Authentication failed'));
    }

    socket.data.userId = String(user.id);
    socket.data.userType = String(user.userType);
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.on('services:subscribe', () => {
    socket.join('services:public');
  });

  socket.on('chat:join', async ({ orderId }) => {
    try {
      const roomId = String(orderId || '').trim();
      if (!roomId) return;

      const order = await prisma.orders.findFirst({
        where: {
          id: roomId,
          OR: [
            { customerId: socket.data.userId },
            { providerId: socket.data.userId }
          ]
        },
        select: { id: true }
      });

      if (!order) {
        socket.emit('chat:error', { message: 'Unauthorized order room access' });
        return;
      }

      socket.join(roomId);
      io.to(roomId).emit('chat:presence', { userId: socket.data.userId, status: 'online' });
    } catch {
      socket.emit('chat:error', { message: 'Failed to join chat room' });
    }
  });

  socket.on('chat:typing', ({ orderId, typing }) => {
    const roomId = String(orderId || '').trim();
    if (!roomId) return;
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('chat:typing', { userId: socket.data.userId, typing: Boolean(typing) });
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 8084);
connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`API server listening on port ${PORT}`, {
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    });
  })
  .catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });

module.exports = app;
