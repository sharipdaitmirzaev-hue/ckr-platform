import { getAdminStats } from "@/lib/admin/queries";
import { getPlatformAnalytics } from "@/lib/analytics/queries";
import { getLiaMarketSnapshot } from "@/lib/analytics/lia-context";
import { getCrmDashboardStats } from "@/lib/crm/queries";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getOperatorDashboardData } from "@/lib/operator/queries";
import { platformVersion } from "@/config/version";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type OwnerLiaMonitor = {
  sessionsTotal: number;
  sessionsLast7d: number;
  messagesTotal: number;
  analysesTotal: number;
  eventsStarted: number;
  eventsUsed: number;
  recentSessions: Array<{
    id: string;
    title: string;
    userId: string;
    updatedAt: string;
  }>;
};

export type OwnerAttentionItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  overdue?: boolean;
};

export type OwnerDashboard = {
  version: typeof platformVersion;
  generatedAt: string;
  platform: Awaited<ReturnType<typeof getAdminStats>>;
  period: Awaited<ReturnType<typeof getPlatformAnalytics>>;
  crm: Awaited<ReturnType<typeof getCrmDashboardStats>>;
  operations: Awaited<ReturnType<typeof getOperatorDashboardData>>["stats"];
  queue: OwnerAttentionItem[];
  market: Awaited<ReturnType<typeof getLiaMarketSnapshot>>;
  lia: OwnerLiaMonitor;
  product: {
    openProblems: number;
    feedback: number;
    improvements: number;
  };
};

async function getLiaMonitor(): Promise<OwnerLiaMonitor> {
  const empty: OwnerLiaMonitor = {
    sessionsTotal: 0,
    sessionsLast7d: 0,
    messagesTotal: 0,
    analysesTotal: 0,
    eventsStarted: 0,
    eventsUsed: 0,
    recentSessions: [],
  };
  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = createClient();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      sessionsTotal,
      sessionsLast7d,
      messagesTotal,
      analysesTotal,
      eventsStarted,
      eventsUsed,
      recentRes,
    ] = await Promise.all([
      supabase.from("lia_sessions").select("id", { count: "exact", head: true }),
      supabase
        .from("lia_sessions")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", since7d),
      supabase.from("lia_messages").select("id", { count: "exact", head: true }),
      supabase.from("lia_analyses").select("id", { count: "exact", head: true }),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "lia_started"),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "lia_used"),
      supabase
        .from("lia_sessions")
        .select("id, title, user_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(8),
    ]);

    return {
      sessionsTotal: sessionsTotal.count ?? 0,
      sessionsLast7d: sessionsLast7d.count ?? 0,
      messagesTotal: messagesTotal.count ?? 0,
      analysesTotal: analysesTotal.count ?? 0,
      eventsStarted: eventsStarted.count ?? 0,
      eventsUsed: eventsUsed.count ?? 0,
      recentSessions: (recentRes.data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) || "Диалог Лии",
        userId: row.user_id as string,
        updatedAt: row.updated_at as string,
      })),
    };
  } catch {
    return empty;
  }
}

export async function getOwnerDashboard(): Promise<OwnerDashboard> {
  const [platform, period, crm, operator, market, lia, improvements] =
    await Promise.all([
      getAdminStats(),
      getPlatformAnalytics("30d"),
      getCrmDashboardStats(),
      getOperatorDashboardData(),
      getLiaMarketSnapshot(),
      getLiaMonitor(),
      getImprovementsDashboard(),
    ]);

  const queue: OwnerAttentionItem[] = operator.queue.slice(0, 12).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? item.kind,
    href: item.href,
    overdue: item.overdue,
  }));

  return {
    version: platformVersion,
    generatedAt: new Date().toISOString(),
    platform,
    period,
    crm,
    operations: operator.stats,
    queue,
    market,
    lia,
    product: {
      openProblems: improvements.counts.problemsOpen,
      feedback: improvements.counts.proposals,
      improvements: improvements.counts.improvements,
    },
  };
}
