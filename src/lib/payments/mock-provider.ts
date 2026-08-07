import type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  PaymentRecord,
} from "@/lib/payments/types";

/**
 * Mock PaymentProvider — без реальных списаний.
 * Готовит место для card / СБП / других провайдеров.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";
  readonly name = "ЦКР Mock Payments";
  readonly supportedMethods = ["card", "sbp", "other"] as const;

  private readonly store = new Map<string, PaymentRecord>();

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const id = `mock_${crypto.randomUUID()}`;
    const method = input.method ?? "card";
    const now = new Date().toISOString();

    const record: PaymentRecord = {
      id,
      provider: this.id,
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      method,
      purpose: input.purpose,
      referenceId: input.referenceId,
      userId: input.userId,
      updatedAt: now,
    };
    this.store.set(id, record);

    return {
      id,
      provider: this.id,
      status: "pending",
      amount: input.amount,
      currency: input.currency,
      method,
      checkoutUrl: null,
      message:
        "Платежи ещё не подключены. Архитектура готова к card, СБП и внешним провайдерам.",
      createdAt: now,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentRecord | null> {
    return this.store.get(paymentId) ?? null;
  }
}
