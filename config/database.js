const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma =
  global.__SERVOLEY_PRISMA__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty'
  });

const aliasModels = () => {
  const aliases = {
    user: 'users',
    profile: 'profiles',
    provider: 'providers',
    service: 'services',
    order: 'orders',
    message: 'messages',
    ticket: 'tickets',
    wallet: 'wallets',
    transaction: 'transactions',
    paymentOrder: 'payment_orders',
    notification: 'notifications'
  };

  for (const [alias, target] of Object.entries(aliases)) {
    if (!prisma[alias] && prisma[target]) {
      prisma[alias] = prisma[target];
    }
  }
};

aliasModels();

if (!global.__SERVOLEY_PRISMA__) {
  global.__SERVOLEY_PRISMA__ = prisma;
}

const connectDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  await prisma.$connect();
  logger.info('Database connected');
};

const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Database disconnection failed', error);
  }
};

process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase
};
