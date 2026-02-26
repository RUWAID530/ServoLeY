const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    
    // Require encryption key from environment - no fallback
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required for KYC field encryption');
    }
    
    if (encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    
    // Use proper key derivation with a fixed salt for consistency
    this.key = crypto.pbkdf2Sync(encryptionKey, 'servoley-kyc-salt-2024', 100000, 32, 'sha256');
  }

  encrypt(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    
    // Use createCipheriv instead of deprecated createCipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    cipher.setAAD(Buffer.from('servoley-kyc', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) return null;
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    // Use createDecipheriv instead of deprecated createDecipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAAD(Buffer.from('servoley-kyc', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  encryptField(data) {
    return JSON.stringify(this.encrypt(data));
  }

  decryptField(encryptedField) {
    try {
      if (!encryptedField) return null;
      const data = typeof encryptedField === 'string' ? JSON.parse(encryptedField) : encryptedField;
      return this.decrypt(data);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Method to validate encryption key strength
  static validateKey(key) {
    if (!key) return false;
    if (key.length < 32) return false;
    // Check for sufficient entropy (no repeated patterns)
    const uniqueChars = new Set(key).size;
    if (uniqueChars < key.length * 0.5) return false;
    return true;
  }

  // Method to generate a secure encryption key
  static generateSecureKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new EncryptionService();
