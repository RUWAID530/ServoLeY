#!/usr/bin/env node

const SecureEnvironmentGenerator = require('./utils/secureEnvironmentGenerator');
const fs = require('fs');
const path = require('path');

const envType = process.argv[2] || 'development';

console.log(`🔐 Generating secure ${envType} environment configuration...`);

let envConfig;
if (envType === 'production') {
  envConfig = SecureEnvironmentGenerator.generateSecureEnv();
  console.log('⚠️  PRODUCTION environment generated');
  console.log('📝 Please update the following values:');
  console.log('   - DATABASE_URL (your production database)');
  console.log('   - RAZORPAY_KEY_ID (your live Razorpay key)');
  console.log('   - RAZORPAY_KEY_SECRET (your live Razorpay secret)');
  console.log('   - TWILIO_AUTH_TOKEN (your Twilio auth token)');
  console.log('   - API_BASE_URL (your production API URL)');
  console.log('   - CORS_ORIGIN (your production domains)');
} else {
  envConfig = SecureEnvironmentGenerator.generateDevEnv();
  console.log('🧪 DEVELOPMENT environment generated');
  console.log('📝 Please update the following values:');
  console.log('   - DATABASE_URL (your development database)');
  console.log('   - RAZORPAY_KEY_ID (your test Razorpay key)');
  console.log('   - RAZORPAY_KEY_SECRET (your test Razorpay secret)');
  console.log('   - TWILIO_AUTH_TOKEN (your test Twilio token)');
}

// Validate the generated configuration
const issues = SecureEnvironmentGenerator.validateGeneratedEnv(envConfig);
if (issues.length > 0) {
  console.log('❌ Configuration issues:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  process.exit(1);
}

// Generate .env file content
let envContent = `# ========================================
# ${envType.toUpperCase()} ENVIRONMENT CONFIGURATION
# Generated on: ${envConfig.GENERATED_AT}
# Version: ${envConfig.VERSION}
# ========================================

`;

Object.entries(envConfig).forEach(([key, value]) => {
  if (key !== 'GENERATED_AT' && key !== 'VERSION') {
    envContent += `${key}=${value}\n`;
  }
});

envContent += `

# ========================================
# IMPORTANT: Update the values marked above
# ========================================

# For PRODUCTION:
# - Replace DATABASE_URL with your production database
# - Replace RAZORPAY keys with your live keys
# - Replace TWILIO_AUTH_TOKEN with your live token
# - Update CORS_ORIGIN with your production domains
# - Update API_BASE_URL with your production URL

# For DEVELOPMENT:
# - Update DATABASE_URL with your local database
# - Get test keys from Razorpay dashboard
# - Set up Twilio test credentials if needed
`;

// Write to .env file
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

console.log(`✅ Environment configuration written to: ${envPath}`);
console.log('🔒 All secrets are cryptographically secure');
console.log('🚀 Your application is now configured for launch!');
