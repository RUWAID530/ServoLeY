const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env file exists, if not create a template
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with default values...');
  fs.writeFileSync(envPath, `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/service_marketplace"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# OTP Configuration
BYPASS_OTP="true"

# Email Configuration (optional)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# SMS Configuration (optional)
SMS_API_KEY="your-sms-api-key"
SMS_SENDER="YourSenderID"
`);
}

console.log('Setting up the Service Marketplace Database...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Apply database schema
  console.log('Applying database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // Seed the database
  console.log('Seeding database with sample data...');
  execSync('node database/seed.js', { stdio: 'inherit' });

  console.log('Database setup completed successfully!');
  console.log('');
  console.log('You can now start the application with: npm start');
  console.log('Or use Prisma Studio to view the database: npx prisma studio');
} catch (error) {
  console.error('Error during database setup:', error.message);
  process.exit(1);
}
