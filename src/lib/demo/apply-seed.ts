import {
  DEMO_OWNER_ID,
  demoExpertsSeed,
  demoInvestmentsSeed,
  demoOpportunitiesSeed,
  demoProjectsSeed,
  demoSeedMeta,
} from "@/lib/demo/seed-data";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SeedResult = {
  ok: boolean;
  message: string;
  created?: Record<string, number>;
};

async function ensureDemoUser(
  admin: SupabaseClient,
  input: {
    id: string;
    email: string;
    fullName: string;
  },
): Promise<string> {
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list.data.users.find((u) => u.email === input.email);
  if (existing) return existing.id;

  const created = await admin.auth.admin.createUser({
    id: input.id,
    email: input.email,
    password: "DemoCkrLaunch-ChangeMe!",
    email_confirm: true,
    user_metadata: { full_name: input.fullName, demo: true },
  });

  if (created.data.user) return created.data.user.id;

  const retry = await admin.auth.admin.createUser({
    email: input.email,
    password: "DemoCkrLaunch-ChangeMe!",
    email_confirm: true,
    user_metadata: { full_name: input.fullName, demo: true },
  });

  if (retry.error || !retry.data.user) {
    throw new Error(
      created.error?.message ??
        retry.error?.message ??
        `Не удалось создать ${input.email}`,
    );
  }
  return retry.data.user.id;
}

/**
 * Применяет demo seed в Supabase через service role.
 * Не использует реальные ПДн. Требует SUPABASE_SERVICE_ROLE_KEY.
 */
export async function applyDemoSeed(): Promise<SeedResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      ok: false,
      message:
        "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY для записи seed в БД. Каталоги доступны из встроенного demo fallback.",
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const ownerId = await ensureDemoUser(admin, {
      id: DEMO_OWNER_ID,
      email: "demo.owner@ckr.local",
      fullName: "Демо-владелец ЦКР",
    });

    await admin.from("profiles").upsert({
      id: ownerId,
      full_name: "Демо-владелец ЦКР",
      company_name: "ЦКР Demo",
      bio: "Вымышленный профиль для демонстрации платформы. Не является реальным лицом.",
      city: "Москва",
      region: "Москва",
      is_public: true,
      show_contact: false,
      verification_status: "verified",
    });

    await admin.from("user_roles").upsert(
      [
        { user_id: ownerId, role: "entrepreneur" },
        { user_id: ownerId, role: "company" },
      ],
      { onConflict: "user_id,role" },
    );

    let projects = 0;
    for (const item of demoProjectsSeed) {
      const { error } = await admin.from("projects").upsert({
        id: item.id,
        owner_id: ownerId,
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        description: item.description,
        category: item.category,
        region: item.region,
        investment_required: item.investmentRequired,
        currency: item.currency,
        stage: item.stage,
        status: "published",
        verification_status: "verified",
      });
      if (!error) projects += 1;
    }

    let opportunities = 0;
    for (const item of demoOpportunitiesSeed) {
      const { error } = await admin.from("opportunities").upsert({
        id: item.id,
        owner_id: ownerId,
        title: item.title,
        description: item.description,
        type: item.type,
        region: item.region,
        city: item.city,
        price: item.price,
        currency: item.currency,
        status: "published",
        verification_status: "verified",
      });
      if (!error) opportunities += 1;
    }

    let investments = 0;
    for (const item of demoInvestmentsSeed) {
      const { error } = await admin.from("investment_offers").upsert({
        id: item.id,
        owner_id: ownerId,
        title: item.title,
        description: item.description,
        amount_min: item.amountMin,
        amount_max: item.amountMax,
        currency: item.currency,
        regions: [...item.regions],
        categories: [...item.categories],
        investment_type: item.investmentType,
        status: "published",
        verification_status: "verified",
      });
      if (!error) investments += 1;
    }

    let experts = 0;
    for (const item of demoExpertsSeed) {
      const expertUserId = await ensureDemoUser(admin, {
        id: item.userId,
        email: item.email,
        fullName: item.fullName,
      });

      await admin.from("profiles").upsert({
        id: expertUserId,
        full_name: item.fullName,
        company_name: "Демо-эксперт ЦКР",
        bio: "Вымышленный эксперт для демонстрации. Не реальное лицо.",
        region: item.region,
        is_public: true,
        show_contact: false,
        verification_status: "verified",
      });

      await admin.from("user_roles").upsert(
        { user_id: expertUserId, role: "expert" },
        { onConflict: "user_id,role" },
      );

      const { error } = await admin.from("expert_profiles").upsert({
        id: item.id,
        user_id: expertUserId,
        specialization: item.specialization,
        headline: item.headline,
        description: item.description,
        experience_years: item.experienceYears,
        services: item.services,
        region: item.region,
        status: "published",
        verification_status: "verified",
      });
      if (!error) experts += 1;
    }

    return {
      ok: true,
      message: `Demo seed v${demoSeedMeta.version} применён. Смените пароли demo-пользователей после показа.`,
      created: { projects, opportunities, investments, experts },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ошибка seed",
    };
  }
}
