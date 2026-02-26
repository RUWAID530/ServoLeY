const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords for seed users - use strong random passwords
  const adminPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const customerPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const providerPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@servoley.com' },
    update: {},
    create: {
      email: 'admin@servoley.com',
      phone: '+919876543210',
      userType: 'ADMIN',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          passwordHash: adminPassword,
          address: 'Tirunelveli, Tamil Nadu',
          pincode: '627001',
          city: 'Tirunelveli',
          state: 'Tamil Nadu',
          country: 'India'
        }
      },
      wallet: {
        create: {
          balance: 0
        }
      }
    }
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample customer
  const customerUser = await prisma.user.upsert({
    where: { email: 'classyak12@gmail.com' },
    update: {},
    create: {
      email: 'classyak12@gmail.com',
      phone: '+916379188252',
      userType: 'CUSTOMER',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          passwordHash: customerPassword,
          address: 'Palayamkottai, Tirunelveli',
          pincode: '627002',
          city: 'Tirunelveli',
          state: 'Tamil Nadu',
          country: 'India'
        }
      },
      wallet: {
        create: {
          balance: 1000
        }
      }
    }
  });

  console.log('✅ Customer user created:', customerUser.email);

  // Create sample provider
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@servoley.com' },
    update: {},
    create: {
      email: 'provider@servoley.com',
      phone: '+919876543212',
      userType: 'PROVIDER',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          passwordHash: providerPassword,
          address: 'Pettai, Tirunelveli',
          pincode: '627003',
          city: 'Tirunelveli',
          state: 'Tamil Nadu',
          country: 'India'
        }
      },
      wallet: {
        create: {
          balance: 0
        }
      },
      provider: {
        create: {
          businessName: 'Jane\'s Home Services',
          providerType: 'FREELANCER',
          category: 'Home Cleaning',
          area: 'Palayamkottai',
          address: 'Pettai, Tirunelveli',
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '123456789012',
          gstNumber: '33ABCDE1234F1Z5',
          bankAccount: '1234567890123456',
          upiId: 'jane@paytm',
          isVerified: true,
          isActive: true,
          rating: 4.5,
          totalOrders: 25
        }
      }
    }
  });

  console.log('✅ Provider user created:', providerUser.email);

  // Seed Tirunelveli zones if not present
  const zones = [
    { name: 'Tirunelveli Central', city: 'Tirunelveli', polygon: [ [77.704,8.729], [77.740,8.729], [77.740,8.765], [77.704,8.765] ], isActive: true },
    { name: 'Palayamkottai', city: 'Tirunelveli', polygon: [ [77.729,8.706], [77.765,8.706], [77.765,8.740], [77.729,8.740] ], isActive: true },
    { name: 'Melapalayam', city: 'Tirunelveli', polygon: [ [77.700,8.700], [77.735,8.700], [77.735,8.730], [77.700,8.730] ], isActive: true }
  ];

  for (const z of zones) {
    await prisma.zone.upsert({ where: { name: z.name }, update: z, create: z });
  }
  console.log('✅ Tirunelveli zones seeded');

  // Create sample services
  const services = [
    {
      name: 'Home Cleaning',
      description: 'Complete home cleaning service including kitchen, bathroom, and living areas',
      category: 'Home Cleaning',
      price: 500,
      duration: 120
    },
    {
      name: 'Plumbing Repair',
      description: 'Fix all plumbing issues including leaks, blockages, and installations',
      category: 'Plumbing',
      price: 300,
      duration: 60
    },
    {
      name: 'Electrical Work',
      description: 'Electrical repairs, installations, and maintenance services',
      category: 'Electrical',
      price: 400,
      duration: 90
    },
    {
      name: 'AC Service',
      description: 'AC cleaning, gas filling, and maintenance services',
      category: 'AC Service',
      price: 600,
      duration: 180
    },
    {
      name: 'Carpenter Work',
      description: 'Furniture repair, installation, and custom woodwork',
      category: 'Carpentry',
      price: 800,
      duration: 240
    }
  ];

  for (const serviceData of services) {
    const service = await prisma.service.create({
      data: {
        providerId: providerUser.provider.id,
        ...serviceData
      }
    });
    console.log(`✅ Service created: ${service.name}`);
  }

  // Create sample transactions
  const transactions = [
    {
      amount: 1000,
      type: 'CREDIT',
      description: 'Wallet top-up via UPI',
      paymentMethod: 'UPI'
    },
    {
      amount: 500,
      type: 'DEBIT',
      description: 'Service booking payment',
      paymentMethod: 'WALLET'
    }
  ];

  for (const transactionData of transactions) {
    const transaction = await prisma.transaction.create({
      data: {
        walletId: customerUser.wallet.id,
        ...transactionData
      }
    });
    console.log(`✅ Transaction created: ${transaction.description}`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

