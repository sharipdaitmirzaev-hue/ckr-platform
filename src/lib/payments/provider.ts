import { MockPaymentProvider } from "@/lib/payments/mock-provider";
import type { PaymentProvider } from "@/lib/payments/types";

export type PaymentProviderKind = "mock";

/**
 * Фабрика платёжного провайдера.
 * Позже: yookassa | cloudpayments | custom по PAYMENT_PROVIDER.
 */
export function getPaymentProvider(): PaymentProvider {
  const kind = (process.env.PAYMENT_PROVIDER ?? "mock") as PaymentProviderKind;

  switch (kind) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export type { PaymentProvider } from "@/lib/payments/types";
