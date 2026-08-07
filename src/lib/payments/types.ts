/**
 * Платёжная архитектура ЦКР (Этап 16).
 * Реальные провайдеры не подключены — только контракт и mock.
 */

export type PaymentMethod = "card" | "sbp" | "other";

export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "cancelled";

export type CheckoutPurpose =
  | "subscription"
  | "service"
  | "commission"
  | "other";

export type CreateCheckoutInput = {
  amount: number;
  currency: string;
  purpose: CheckoutPurpose;
  description: string;
  /** Внешний ключ сущности: plan_id, service_id, deal_id */
  referenceId: string;
  userId: string;
  method?: PaymentMethod;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSession = {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  /** URL редиректа на оплату (если есть) */
  checkoutUrl: string | null;
  /** Сообщение для UI, пока провайдер не подключён */
  message?: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: CheckoutPurpose;
  referenceId: string;
  userId: string;
  updatedAt: string;
};

export interface PaymentProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedMethods: readonly PaymentMethod[];

  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getPaymentStatus(paymentId: string): Promise<PaymentRecord | null>;
}
