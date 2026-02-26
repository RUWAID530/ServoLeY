const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create a customer user
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      phone: '9876543210',
      passwordHash: hashedPassword,
      userType: 'CUSTOMER',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St, City, State',
          passwordHash: hashedPassword
        }
      },
      wallet: {
        create: {
          balance: 1000
        }
      }
    }
  });

  console.log('Created customer:', customer);

  // Create a provider user
  const provider = await prisma.user.create({
    data: {
      email: 'provider@example.com',
      phone: '9876543211',
      passwordHash: hashedPassword,
      userType: 'PROVIDER',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Business Ave, City, State',
          passwordHash: hashedPassword
        }
      },
      provider: {
        create: {
          businessName: 'Smith Home Services',
          providerType: 'FREELANCER',
          category: 'Home Cleaning',
          area: 'Downtown',
          address: '456 Business Ave, City, State',
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '123456789012',
          upiId: 'smith@upi',
          isVerified: true,
          isActive: true,
          rating: 4.5,
          totalOrders: 25,
          isOnline: true
        }
      },
      wallet: {
        create: {
          balance: 5000
        }
      }
    }
  });

  console.log('Created provider:', provider);

  // Create services for the provider
  const service1 = await prisma.service.create({
    data: {
      providerId: provider.provider.id,
      name: 'Basic Home Cleaning',
      category: 'Home Cleaning',
      description: 'Complete home cleaning service including dusting, vacuuming, and bathroom cleaning',
      price: 1000,
      basePrice: 1200,
      offerPercent: 17,
      estimatedTime: 2,
      warrantyMonths: 1
    }
  });

  const service2 = await prisma.service.create({
    data: {
      providerId: provider.provider.id,
      name: 'Deep Cleaning Service',
      category: 'Home Cleaning',
      description: 'Deep cleaning service with special attention to kitchen and bathrooms',
      price: 2000,
      basePrice: 2500,
      offerPercent: 20,
      estimatedTime: 4,
      warrantyMonths: 1
    }
  });

  console.log('Created services:', service1, service2);

  // Create an order
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      providerId: provider.provider.id,
      serviceId: service1.id,
      status: 'COMPLETED',
      totalAmount: 1000,
      paymentStatus: 'PAID',
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      notes: 'Customer requested extra attention to the kitchen'
    }
  });

  console.log('Created order:', order);

  // Create a review
  const review = await prisma.review.create({
    data: {
      orderId: order.id,
      customerId: customer.id,
      providerId: provider.provider.id,
      rating: 5,
      comment: 'Excellent service! The provider was professional and did a thorough job.'
    }
  });

  console.log('Created review:', review);

  // Create transactions
  const paymentTransaction = await prisma.transaction.create({
    data: {
      userId: customer.id,
      orderId: order.id,
      type: 'PAYMENT',
      amount: 1000,
      description: 'Payment for Basic Home Cleaning service'
    }
  });

  const earningTransaction = await prisma.transaction.create({
    data: {
      userId: provider.id,
      orderId: order.id,
      type: 'EARNING',
      amount: 900, // Assuming 10% platform fee
      description: 'Earning from Basic Home Cleaning service'
    }
  });

  console.log('Created transactions:', paymentTransaction, earningTransaction);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
