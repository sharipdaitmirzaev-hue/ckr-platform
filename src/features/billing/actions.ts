"use server";

import { getPaymentProvider } from "@/lib/payments/provider";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BillingActionState = {
  error?: string;
  success?: string;
  checkoutId?: string;
};

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null as null };
  return { supabase, user };
}

/**
 * Запрос на оформление тарифа через PaymentProvider.
 * Реальные списания не выполняются — создаётся mock checkout.
 */
export async function requestPlanCheckoutAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const { user } = await requireUser();
  if (!user) return { error: "Войдите, чтобы оформить тариф." };

  const planId = String(formData.get("planId") ?? "");
  const planName = String(formData.get("planName") ?? "Тариф ЦКР");
  const price = Number(formData.get("price") ?? 0);
  const methodRaw = String(formData.get("method") ?? "card");
  const method =
    methodRaw === "sbp" || methodRaw === "other" || methodRaw === "card"
      ? methodRaw
      : "card";

  if (!planId) return { error: "Не выбран тариф." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Некорректная цена тарифа." };
  }

  const provider = getPaymentProvider();
  const session = await provider.createCheckout({
    amount: price,
    currency: "RUB",
    purpose: "subscription",
    description: `Подписка: ${planName}`,
    referenceId: planId,
    userId: user.id,
    method,
    returnUrl: "/dashboard/billing",
    cancelUrl: "/pricing",
  });

  revalidatePath("/dashboard/billing");

  return {
    success:
      session.message ??
      "Запрос на оплату создан. Подключение реального провайдера — следующий шаг.",
    checkoutId: session.id,
  };
}

/**
 * Запрос на услугу ЦКР через PaymentProvider (без реального платежа).
 */
export async function requestServiceCheckoutAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const { user } = await requireUser();
  if (!user) return { error: "Войдите, чтобы заказать услугу." };

  const serviceId = String(formData.get("serviceId") ?? "");
  const title = String(formData.get("title") ?? "Услуга ЦКР");
  const price = Number(formData.get("price") ?? 0);

  if (!serviceId) return { error: "Не выбрана услуга." };

  const provider = getPaymentProvider();
  const session = await provider.createCheckout({
    amount: price,
    currency: "RUB",
    purpose: "service",
    description: title,
    referenceId: serviceId,
    userId: user.id,
    method: "card",
    returnUrl: "/dashboard/billing",
    cancelUrl: "/services",
  });

  revalidatePath("/dashboard/billing");

  return {
    success:
      session.message ??
      "Запрос на услугу принят. Оплата будет доступна после подключения провайдера.",
    checkoutId: session.id,
  };
}
