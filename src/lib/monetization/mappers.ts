import type {
  Service,
  Subscription,
  SubscriptionPlan,
} from "@/types";
import type {
  ServiceRow,
  SubscriptionPlanRow,
  SubscriptionRow,
} from "@/types/database";

function parseFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapSubscriptionPlanRow(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    price: Number(row.price),
    period: row.period,
    features: parseFeatures(row.features),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapServiceRow(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
