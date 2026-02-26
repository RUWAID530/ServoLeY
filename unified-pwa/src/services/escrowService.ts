// Escrow Payment Service for Service Platform
interface EscrowTransaction {
  id: string;
  customerId: string;
  providerId: string;
  amount: number;
  platformFee: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  serviceId: string;
  createdAt: Date | string;
  releasedAt?: Date | string;
  disputeReason?: string;
}

interface EscrowAccount {
  accountId: string;
  balance: number;
  heldAmount: number;
  availableAmount: number;
  currency: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

class EscrowService {
  private getToken(): string {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  }

  private async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }

    return payload?.data;
  }

  /**
   * Create escrow transaction when customer books service
   */
  async createEscrowTransaction(
    _customerId: string,
    providerId: string,
    amount: number,
    serviceId: string,
    platformFeePercent: number = 5
  ): Promise<EscrowTransaction> {
    return this.request('/api/escrow/transactions', {
      method: 'POST',
      body: JSON.stringify({
        providerId,
        amount,
        serviceId,
        platformFeePercent
      })
    });
  }

  /**
   * Hold payment in escrow after successful payment
   */
  async holdPayment(transactionId: string): Promise<EscrowTransaction> {
    return this.request(`/api/escrow/transactions/${encodeURIComponent(transactionId)}/hold`, {
      method: 'POST'
    });
  }

  /**
   * Release payment to provider after service completion
   */
  async releasePayment(
    transactionId: string,
    releaseAmount?: number
  ): Promise<EscrowTransaction> {
    return this.request(`/api/escrow/transactions/${encodeURIComponent(transactionId)}/release`, {
      method: 'POST',
      body: JSON.stringify({
        ...(releaseAmount != null ? { releaseAmount } : {})
      })
    });
  }

  /**
   * Refund payment to customer
   */
  async refundPayment(
    transactionId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<EscrowTransaction> {
    return this.request(`/api/escrow/transactions/${encodeURIComponent(transactionId)}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        ...(refundAmount != null ? { refundAmount } : {}),
        ...(reason ? { reason } : {})
      })
    });
  }

  /**
   * Initiate dispute resolution
   */
  async initiateDispute(
    transactionId: string,
    disputeReason: string,
    initiatedBy: 'customer' | 'provider'
  ): Promise<EscrowTransaction> {
    return this.request(`/api/escrow/transactions/${encodeURIComponent(transactionId)}/dispute`, {
      method: 'POST',
      body: JSON.stringify({
        disputeReason,
        initiatedBy
      })
    });
  }

  /**
   * Get escrow account balance
   */
  async getEscrowAccountBalance(): Promise<EscrowAccount> {
    return this.request('/api/escrow/account/balance');
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId?: string,
    status?: string,
    limit: number = 50
  ): Promise<EscrowTransaction[]> {
    const params = new URLSearchParams({
      limit: String(limit)
    });
    if (userId) params.set('user_id', userId);
    if (status) params.set('status', status);

    const data = await this.request(`/api/escrow/transactions?${params.toString()}`);
    return Array.isArray(data?.transactions) ? data.transactions : [];
  }

  /**
   * Auto-release payment after service completion confirmation
   */
  async autoReleasePayment(serviceId: string): Promise<void> {
    const transactions = await this.getTransactionHistory(undefined, 'held');
    const transaction = transactions.find((item) => item.serviceId === serviceId);

    if (!transaction) {
      throw new Error('No held transaction found for this service');
    }

    await this.releasePayment(transaction.id, transaction.amount);
  }
}

export const escrowService = new EscrowService();
export type { EscrowTransaction, EscrowAccount };

