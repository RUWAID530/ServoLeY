const crypto = require('crypto');

class SecureEnvironmentGenerator {
  static generateSecureEnv() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return {
      // JWT Configuration
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      
      // Encryption
      ENCRYPTION_KEY: crypto.randomBytes(64).toString('hex'),
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '200',
      
      // Production Settings
      NODE_ENV: 'production',
      MOCK_PAYMENT: 'false',
      DEBUG: 'false',
      ENABLE_DEV_TOOLS: 'false',
      
      // Payment (Use real keys in production)
      RAZORPAY_KEY_ID: 'rzp_live_YOUR_KEY_ID_HERE',
      RAZORPAY_KEY_SECRET: 'YOUR_LIVE_SECRET_KEY_HERE',
      RAZORPAY_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      
      // Database
      DATABASE_URL: 'postgresql://username:password@localhost:5432/servoley_prod',
      
      // CORS (Update with your domains)
      CORS_ORIGIN: 'https://yourapp.com,https://admin.yourapp.com',
      
      // Webhook Security
      TWILIO_AUTH_TOKEN: 'your-twilio-auth-token',
      API_BASE_URL: 'https://api.yourapp.com',
      
      // Security
      BCRYPT_ROUNDS: '12',
      
      // Request Limits
      REQUEST_TIMEOUT_MS: '30000',
      MAX_REQUEST_SIZE: '1048576',
      
      // Feature Flags
      ENABLE_ESCROW: 'false',
      ENABLE_ANALYTICS: 'true',
      ENABLE_NOTIFICATIONS: 'true',
      
      // Admin Settings
      ADMIN_EMAIL: 'admin@yourapp.com',
      SUPPORT_EMAIL: 'support@yourapp.com',
      
      // Generated timestamp
      GENERATED_AT: timestamp,
      VERSION: '1.0.0'
    };
  }
  
  static generateDevEnv() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return {
      // JWT Configuration (Development)
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      
      // Encryption
      ENCRYPTION_KEY: crypto.randomBytes(64).toString('hex'),
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '200',
      
      // Development Settings
      NODE_ENV: 'development',
      MOCK_PAYMENT: 'false', // Set to false for realistic testing
      DEBUG: 'false',
      ENABLE_DEV_TOOLS: 'false',
      
      // Payment (Test keys)
      RAZORPAY_KEY_ID: 'rzp_test_YOUR_TEST_KEY_ID',
      RAZORPAY_KEY_SECRET: 'your-test-secret-key',
      RAZORPAY_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      
      // Database
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/servoley_dev',
      
      // CORS (Development)
      CORS_ORIGIN: 'http://localhost:5173,http://localhost:5174',
      
      // Webhook Security (Development)
      TWILIO_AUTH_TOKEN: 'your-twilio-test-auth-token',
      API_BASE_URL: 'http://localhost:8080',
      
      // Security
      BCRYPT_ROUNDS: '10',
      
      // Request Limits
      REQUEST_TIMEOUT_MS: '30000',
      MAX_REQUEST_SIZE: '1048576',
      
      // Feature Flags
      ENABLE_ESCROW: 'true',
      ENABLE_ANALYTICS: 'true',
      ENABLE_NOTIFICATIONS: 'true',
      
      // Generated timestamp
      GENERATED_AT: timestamp,
      VERSION: '1.0.0'
    };
  }
  
  static validateGeneratedEnv(env) {
    const issues = [];
    
    // Check required fields
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];
    for (const field of required) {
      if (!env[field] || env[field].length < 32) {
        issues.push(`${field} must be at least 32 characters long`);
      }
    }
    
    // Check for test/production mismatch
    if (env.NODE_ENV === 'production') {
      if (env.MOCK_PAYMENT === 'true') {
        issues.push('MOCK_PAYMENT must be false in production');
      }
      if (env.RAZORPAY_KEY_ID?.includes('test')) {
        issues.push('RAZORPAY_KEY_ID cannot use test keys in production');
      }
    }
    
    return issues;
  }
}

module.exports = SecureEnvironmentGenerator;
