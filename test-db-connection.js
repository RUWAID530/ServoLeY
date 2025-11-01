const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL);

  const prisma = new PrismaClient();

  try {
    // Try to connect
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database query successful:', result);

    // Disconnect
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    await prisma.$disconnect();
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('Database connection test passed!');
  } else {
    console.log('Database connection test failed!');
    console.log('Please check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database exists');
    console.log('3. Connection credentials are correct');
  }
  process.exit(success ? 0 : 1);
});
