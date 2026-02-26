import { escrowService } from './escrowService';

const SECURITY_CONFIG = {
  fraud: {
    maxAmount: 100000,
    maxDailyTransactions: 50
  },
  rateLimit: {
    requests: 100,
    windowMs: 60000
  }
};

class SecureEscrowService {
  private rateLimitMap: Map<string, number[]> = new Map();

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowMs = SECURITY_CONFIG.rateLimit.windowMs;
    const maxRequests = SECURITY_CONFIG.rateLimit.requests;

    const existing = this.rateLimitMap.get(userId) || [];
    const valid = existing.filter((entry) => now - entry < windowMs);
    if (valid.length >= maxRequests) {
      return false;
    }

    valid.push(now);
    this.rateLimitMap.set(userId, valid);
    return true;
  }

  private async detectFraud(transactionData: { customerId: string; amount: number }) {
    let riskScore = 0;
    const reasons: string[] = [];

    if (transactionData.amount > SECURITY_CONFIG.fraud.maxAmount) {
      riskScore += 30;
      reasons.push('High amount transaction');
    }

    const todayTransactions = await escrowService.getTransactionHistory(transactionData.customerId);
    if (todayTransactions.length >= SECURITY_CONFIG.fraud.maxDailyTransactions) {
      riskScore += 25;
      reasons.push('Excessive daily transactions');
    }

    return {
      isSafe: riskScore < 50,
      riskScore,
      reasons
    };
  }

  async createSecureTransaction(
    customerId: string,
    providerId: string,
    amount: number,
    serviceId: string
  ): Promise<any> {
    if (!this.checkRateLimit(customerId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (!customerId || !providerId || !serviceId || amount <= 0) {
      throw new Error('Invalid transaction parameters');
    }
    if (amount > SECURITY_CONFIG.fraud.maxAmount) {
      throw new Error(`Transaction amount exceeds maximum limit of Rs ${SECURITY_CONFIG.fraud.maxAmount}`);
    }

    const fraudCheck = await this.detectFraud({ customerId, amount });
    if (!fraudCheck.isSafe) {
      throw new Error('Transaction blocked due to security concerns');
    }

    return escrowService.createEscrowTransaction(customerId, providerId, amount, serviceId);
  }

  async secureReleasePayment(
    transactionId: string,
    _customerId: string,
    _confirmationCode?: string
  ): Promise<any> {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }
    return escrowService.releasePayment(transactionId);
  }
}

export const secureEscrowService = new SecureEscrowService();

