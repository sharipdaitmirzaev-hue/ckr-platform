import {
  defaultServices,
  defaultSubscriptionPlans,
} from "@/config/monetization";
import {
  mapServiceRow,
  mapSubscriptionPlanRow,
  mapSubscriptionRow,
} from "@/lib/monetization/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Service,
  ServiceCategory,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanType,
} from "@/types";
import type {
  ServiceRow,
  SubscriptionPlanRow,
  SubscriptionRow,
} from "@/types/database";

export type SubscriptionWithPlan = Subscription & {
  plan: SubscriptionPlan | null;
};

function fallbackPlans(type?: SubscriptionPlanType | null): SubscriptionPlan[] {
  return defaultSubscriptionPlans
    .filter((plan) => plan.status === "active")
    .filter((plan) => !type || plan.type === type)
    .map((plan) => ({ ...plan }));
}

function fallbackServices(category?: ServiceCategory | null): Service[] {
  return defaultServices
    .filter((service) => service.status === "active")
    .filter((service) => !category || service.category === category)
    .map((service) => ({
      ...service,
      priceOnRequest: Boolean(service.priceOnRequest),
    }));
}

export async function listActivePlans(
  type?: SubscriptionPlanType | null,
): Promise<SubscriptionPlan[]> {
  if (!hasSupabaseEnv()) return fallbackPlans(type);

  try {
    const supabase = createClient();
    let query = supabase
      .from("subscription_plans")
      .select("*")
      .eq("status", "active")
      .order("price", { ascending: true });

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return fallbackPlans(type);
    return (data as SubscriptionPlanRow[]).map(mapSubscriptionPlanRow);
  } catch {
    return fallbackPlans(type);
  }
}

export async function listActiveServices(
  category?: ServiceCategory | null,
): Promise<Service[]> {
  if (!hasSupabaseEnv()) return fallbackServices(category);

  try {
    const supabase = createClient();
    let query = supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("price", { ascending: true });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return fallbackServices(category);
    return (data as ServiceRow[]).map(mapServiceRow);
  } catch {
    return fallbackServices(category);
  }
}

export async function getActiveSubscription(
  userId: string,
): Promise<SubscriptionWithPlan | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans (*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as SubscriptionRow & {
      subscription_plans: SubscriptionPlanRow | SubscriptionPlanRow[] | null;
    };
    const planRow = Array.isArray(row.subscription_plans)
      ? row.subscription_plans[0]
      : row.subscription_plans;

    return {
      ...mapSubscriptionRow(row),
      plan: planRow ? mapSubscriptionPlanRow(planRow) : null,
    };
  } catch {
    return null;
  }
}

export async function listUserSubscriptions(
  userId: string,
): Promise<SubscriptionWithPlan[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans (*)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item) => {
      const row = item as SubscriptionRow & {
        subscription_plans: SubscriptionPlanRow | SubscriptionPlanRow[] | null;
      };
      const planRow = Array.isArray(row.subscription_plans)
        ? row.subscription_plans[0]
        : row.subscription_plans;
      return {
        ...mapSubscriptionRow(row),
        plan: planRow ? mapSubscriptionPlanRow(planRow) : null,
      };
    });
  } catch {
    return [];
  }
}
