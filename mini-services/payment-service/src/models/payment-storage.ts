import { PaymentTransaction, PaymentStatus } from '../types/index.js';

// In-memory storage (in production, use a database like Redis, MongoDB, or PostgreSQL)
class PaymentStorage {
  private transactions: Map<string, PaymentTransaction> = new Map();

  create(transaction: PaymentTransaction): PaymentTransaction {
    this.transactions.set(transaction.transactionId, transaction);
    return transaction;
  }

  get(transactionId: string): PaymentTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  getByOrderId(orderId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values()).filter(t => t.orderId === orderId);
  }

  update(transactionId: string, updates: Partial<PaymentTransaction>): PaymentTransaction | null {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return null;
    }

    const updated = {
      ...transaction,
      ...updates,
      updatedAt: new Date()
    };

    this.transactions.set(transactionId, updated);
    return updated;
  }

  updateStatus(transactionId: string, status: PaymentStatus): PaymentTransaction | null {
    return this.update(transactionId, { status });
  }

  delete(transactionId: string): boolean {
    return this.transactions.delete(transactionId);
  }

  getAll(): PaymentTransaction[] {
    return Array.from(this.transactions.values());
  }

  count(): number {
    return this.transactions.size;
  }

  // Clean up expired transactions
  cleanupExpired(): number {
    const now = new Date();
    let count = 0;

    for (const [transactionId, transaction] of this.transactions.entries()) {
      if (transaction.status === PaymentStatus.PENDING && transaction.expiryDate < now) {
        this.updateStatus(transactionId, PaymentStatus.EXPIRED);
        count++;
      }
    }

    return count;
  }
}

export const paymentStorage = new PaymentStorage();
