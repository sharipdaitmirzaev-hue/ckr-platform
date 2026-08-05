"use server";

import { investmentOfferFormSchema } from "@/lib/investments/validations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type InvestmentActionState = {
  error?: string;
  success?: string;
};

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOfferForm(formData: FormData) {
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter(Boolean);
  const regionsRaw = formData.get("regions");
  const regions =
    typeof regionsRaw === "string"
      ? regionsRaw
          .split(/[,;\n]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : parseList(regionsRaw);

  return investmentOfferFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    amountMin: formData.get("amountMin"),
    amountMax: formData.get("amountMax"),
    currency: formData.get("currency"),
    regions,
    categories,
    investmentType: formData.get("investmentType"),
    status: formData.get("status"),
  });
}

export async function createInvestmentOfferAction(
  _prev: InvestmentActionState,
  formData: FormData,
): Promise<InvestmentActionState> {
  const parsed = parseOfferForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const { error } = await supabase.from("investment_offers").insert({
    owner_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    amount_min: parsed.data.amountMin,
    amount_max: parsed.data.amountMax,
    currency: parsed.data.currency,
    regions: parsed.data.regions,
    categories: parsed.data.categories,
    investment_type: parsed.data.investmentType,
    status: parsed.data.status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/investments");
  revalidatePath("/dashboard/investments");
  redirect("/dashboard/investments");
}

export async function updateInvestmentOfferAction(
  _prev: InvestmentActionState,
  formData: FormData,
): Promise<InvestmentActionState> {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) return { error: "Не указано предложение." };

  const parsed = parseOfferForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const { data: existing } = await supabase
    .from("investment_offers")
    .select("id, owner_id")
    .eq("id", offerId)
    .maybeSingle();

  if (!existing) return { error: "Предложение не найдено." };
  if (existing.owner_id !== user.id) {
    return { error: "Можно редактировать только свои предложения." };
  }

  const { error } = await supabase
    .from("investment_offers")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      amount_min: parsed.data.amountMin,
      amount_max: parsed.data.amountMax,
      currency: parsed.data.currency,
      regions: parsed.data.regions,
      categories: parsed.data.categories,
      investment_type: parsed.data.investmentType,
      status: parsed.data.status,
    })
    .eq("id", offerId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/investments");
  revalidatePath("/dashboard/investments");
  revalidatePath(`/investment/${offerId}`);
  return { success: "Предложение сохранено." };
}

export async function closeInvestmentOfferAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) redirect("/dashboard/investments");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("investment_offers")
    .update({ status: "closed" })
    .eq("id", offerId)
    .eq("owner_id", user.id);

  revalidatePath("/investments");
  revalidatePath("/dashboard/investments");
  revalidatePath(`/investment/${offerId}`);
  redirect("/dashboard/investments");
}
