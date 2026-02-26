const crypto = require('crypto');

class SecurityConfigValidator {
  static validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check JWT secrets
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      errors.push('JWT_SECRET is required');
    } else if (jwtSecret.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters long');
    } else if (jwtSecret.includes('test') || jwtSecret.includes('demo') || jwtSecret.includes('secret')) {
      errors.push('JWT_SECRET contains insecure keywords (test, demo, secret)');
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      errors.push('JWT_REFRESH_SECRET is required');
    } else if (jwtRefreshSecret === jwtSecret) {
      errors.push('JWT_REFRESH_SECRET must be different from JWT_SECRET');
    }

    // Check production settings
    if (process.env.NODE_ENV === 'production') {
      if (process.env.MOCK_PAYMENT === 'true') {
        errors.push('MOCK_PAYMENT must be false in production');
      }

      if (process.env.DEBUG === 'true') {
        errors.push('DEBUG must be false in production');
      }

      if (process.env.ENABLE_DEV_TOOLS === 'true') {
        errors.push('ENABLE_DEV_TOOLS must be false in production');
      }

      // Check for test Razorpay keys
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      if (razorpayKeyId && razorpayKeyId.includes('test')) {
        errors.push('RAZORPAY_KEY_ID cannot use test keys in production');
      }

      // Check encryption key
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        errors.push('ENCRYPTION_KEY is required for KYC field encryption');
      } else if (encryptionKey.length < 32) {
        errors.push('ENCRYPTION_KEY must be at least 32 characters long');
      }
    } else {
      // In development, still warn about missing critical secrets
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
        errors.push('JWT_SECRET is required and must be at least 64 characters');
      }
      
      if (!process.env.ENCRYPTION_KEY) {
        errors.push('ENCRYPTION_KEY is required for KYC field encryption');
      }
      
      if (process.env.MOCK_PAYMENT === 'true') {
        warnings.push('MOCK_PAYMENT should be false for realistic testing');
      }
    }

    // Check webhook configuration
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    if (!twilioAuthToken) {
      warnings.push('TWILIO_AUTH_TOKEN is recommended for webhook security');
    }

    // Check database URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      errors.push('DATABASE_URL is required');
    } else if (databaseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      errors.push('DATABASE_URL cannot use localhost in production');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  static validateEncryptionKey(key) {
    if (!key) return false;
    if (key.length < 32) return false;
    return true;
  }
}

module.exports = SecurityConfigValidator;
