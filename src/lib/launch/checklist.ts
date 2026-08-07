import type { LaunchCheckItem } from "@/config/launch";
import { platformVersion } from "@/config/version";
import { getBetaReviewDashboard } from "@/lib/beta/review";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type LaunchIssueBucket = {
  fixed: Array<{ id: string; title: string; source: string }>;
  planned: Array<{ id: string; title: string; source: string }>;
  rejected: Array<{ id: string; title: string; source: string }>;
  openCritical: Array<{ id: string; title: string; source: string }>;
};

export type LaunchChecklistData = {
  product: LaunchCheckItem[];
  users: LaunchCheckItem[];
  technical: LaunchCheckItem[];
  business: LaunchCheckItem[];
  issues: LaunchIssueBucket;
  readiness: {
    score: number;
    verdict: "ready" | "conditional" | "blocked";
    summary: string;
  };
  analytics: Record<string, number>;
};

function emptyIssues(): LaunchIssueBucket {
  return { fixed: [], planned: [], rejected: [], openCritical: [] };
}

function empty(): LaunchChecklistData {
  return {
    product: [],
    users: [],
    technical: [],
    business: [],
    issues: emptyIssues(),
    readiness: {
      score: 0,
      verdict: "blocked",
      summary: "Нет данных для оценки готовности.",
    },
    analytics: {},
  };
}

export async function getLaunchChecklist(): Promise<LaunchChecklistData> {
  if (!hasSupabaseEnv()) {
    const data = empty();
    data.technical = [
      {
        id: "env",
        label: "Environment",
        status: "blocked",
        detail: "Supabase env не настроен в этом окружении.",
      },
      {
        id: "build",
        label: "Build / Lint",
        status: "info",
        detail: "Проверяйте локально: npm run lint && npm run build",
      },
    ];
    data.business = defaultBusinessChecks();
    return data;
  }

  try {
    const supabase = createClient();
    const review = await getBetaReviewDashboard();

    const [
      improvementsRes,
      issuesRes,
      feedbackRes,
      invitesRes,
      eventsRes,
    ] = await Promise.all([
      supabase
        .from("product_improvements")
        .select("id, title, status, priority, source_type")
        .order("updated_at", { ascending: false })
        .limit(80),
      supabase
        .from("pilot_issues")
        .select("id, title, status, severity")
        .order("updated_at", { ascending: false })
        .limit(80),
      supabase
        .from("feedback")
        .select("id, message, type, priority")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("beta_invites").select("id, status"),
      supabase
        .from("analytics_events")
        .select("event_type")
        .in("event_type", [
          "public_registration",
          "role_selected",
          "first_project",
          "first_investment_interest",
          "first_expert_request",
          "onboarding_completed",
          "profile_completed",
        ])
        .limit(2000),
    ]);

    const improvements = improvementsRes.data ?? [];
    const issues = issuesRes.data ?? [];
    const feedback = feedbackRes.data ?? [];
    const invites = invitesRes.data ?? [];
    const events = eventsRes.data ?? [];

    const issuesBucket: LaunchIssueBucket = emptyIssues();

    for (const item of improvements) {
      const row = {
        id: item.id as string,
        title: item.title as string,
        source: `improvement/${item.source_type}`,
      };
      if (item.status === "released") issuesBucket.fixed.push(row);
      else if (item.status === "rejected") issuesBucket.rejected.push(row);
      else issuesBucket.planned.push(row);
    }

    for (const issue of issues) {
      const row = {
        id: issue.id as string,
        title: issue.title as string,
        source: `pilot_issue/${issue.severity}`,
      };
      if (issue.status === "resolved" || issue.status === "closed") {
        issuesBucket.fixed.push(row);
      } else if (
        issue.severity === "critical" ||
        issue.severity === "high"
      ) {
        issuesBucket.openCritical.push(row);
        issuesBucket.planned.push(row);
      } else {
        issuesBucket.planned.push(row);
      }
    }

    for (const item of feedback.filter(
      (f) => f.priority === "critical" || f.priority === "high",
    )) {
      issuesBucket.planned.push({
        id: item.id as string,
        title: String(item.message).slice(0, 100),
        source: `feedback/${item.type}`,
      });
    }

    const openCritical = issuesBucket.openCritical.length;
    const released = improvements.filter((i) => i.status === "released").length;
    const plannedImp = improvements.filter(
      (i) => i.status === "planned" || i.status === "in_progress",
    ).length;

    const unusedModules = review.modules.filter((m) => m.uses === 0).length;
    const maxDrop = Math.max(0, ...review.funnel.map((f) => f.dropOff ?? 0));

    const product: LaunchCheckItem[] = [
      {
        id: "critical",
        label: "Критичные проблемы",
        status: openCritical === 0 ? "ready" : "blocked",
        detail:
          openCritical === 0
            ? "Нет открытых critical/high pilot_issues"
            : `Открыто critical/high: ${openCritical}`,
        href: "/admin/improvements",
      },
      {
        id: "tasks",
        label: "Незакрытые задачи улучшений",
        status: plannedImp === 0 ? "ready" : plannedImp > 5 ? "attention" : "info",
        detail: `planned/in_progress: ${plannedImp} · released: ${released}`,
        href: "/admin/improvements",
      },
      {
        id: "modules",
        label: "Состояние модулей",
        status: unusedModules === 0 ? "ready" : "attention",
        detail:
          unusedModules === 0
            ? "Ключевые модули имеют использование"
            : `Модулей без использования: ${unusedModules}`,
        href: "/admin/beta-review",
      },
    ];

    const invited = invites.filter((i) =>
      ["invited", "created", "sent"].includes(i.status as string),
    ).length;
    const activated = invites.filter((i) =>
      ["activated", "used", "completed"].includes(i.status as string),
    ).length;
    const onboardingDone = events.filter(
      (e) =>
        e.event_type === "onboarding_completed" ||
        e.event_type === "profile_completed",
    ).length;

    const users: LaunchCheckItem[] = [
      {
        id: "onboarding",
        label: "Готовность онбординга",
        status: onboardingDone > 0 ? "ready" : "attention",
        detail:
          onboardingDone > 0
            ? `Завершённых онбордингов/профилей (события): ${onboardingDone}`
            : "Пока нет onboarding_completed / profile_completed",
        href: "/onboarding",
      },
      {
        id: "invites",
        label: "Приглашения",
        status: activated > 0 ? "ready" : invited > 0 ? "attention" : "info",
        detail: `invited: ${invited} · activated: ${activated}`,
        href: "/admin/invites",
      },
      {
        id: "support",
        label: "Поддержка",
        status: "ready",
        detail: "Help Center: docs/help-center.md · feedback в продукте",
        href: "/admin/improvements",
      },
    ];

    const technical: LaunchCheckItem[] = [
      {
        id: "build",
        label: "Build",
        status: "ready",
        detail: "Перед релизом: npm run build (обязательно зелёный)",
      },
      {
        id: "lint",
        label: "Lint",
        status: "ready",
        detail: "Перед релизом: npm run lint",
      },
      {
        id: "env",
        label: "Environment",
        status: "ready",
        detail: `Supabase env доступен · версия ${platformVersion.version}`,
      },
      {
        id: "security",
        label: "Security",
        status: "attention",
        detail:
          "Проверьте docs/security-audit.md и production-checklist перед волной 2",
        href: "/admin/dashboard",
      },
    ];

    const business = defaultBusinessChecks();
    if (maxDrop >= 50) {
      business.push({
        id: "funnel-drop",
        label: "Воронка beta",
        status: "attention",
        detail: `Максимальная потеря в воронке: ${maxDrop}% — держите подсказки онбординга`,
        href: "/admin/beta-review",
      });
    }

    const analytics: Record<string, number> = {
      public_registration: 0,
      role_selected: 0,
      first_project: 0,
      first_investment_interest: 0,
      first_expert_request: 0,
    };
    for (const e of events) {
      const key = e.event_type as string;
      if (key in analytics) analytics[key] += 1;
    }

    let score = 0;
    const all = [...product, ...users, ...technical, ...business];
    for (const item of all) {
      if (item.status === "ready") score += 2;
      else if (item.status === "info") score += 1;
      else if (item.status === "attention") score += 0;
      else score -= 2;
    }
    const maxScore = all.length * 2;
    const pct = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;

    const verdict =
      openCritical > 0
        ? ("blocked" as const)
        : pct >= 70
          ? ("ready" as const)
          : ("conditional" as const);

    const summary =
      verdict === "ready"
        ? "Чеклист допускает переход к волне Public Launch (invite/waitlist). Новые бизнес-модули не требуются."
        : verdict === "conditional"
          ? "Conditional Go: закройте пункты attention/blocked перед расширением доступа."
          : "Запуск заблокирован открытыми critical/high проблемами.";

    return {
      product,
      users,
      technical,
      business,
      issues: {
        fixed: issuesBucket.fixed.slice(0, 20),
        planned: issuesBucket.planned.slice(0, 20),
        rejected: issuesBucket.rejected.slice(0, 20),
        openCritical: issuesBucket.openCritical.slice(0, 20),
      },
      readiness: { score: pct, verdict, summary },
      analytics,
    };
  } catch {
    return empty();
  }
}

function defaultBusinessChecks(): LaunchCheckItem[] {
  return [
    {
      id: "product-desc",
      label: "Описание продукта",
      status: "ready",
      detail: "/about · /features · docs/ckr-1.0-overview.md",
      href: "/features",
    },
    {
      id: "scenarios",
      label: "Сценарии использования",
      status: "ready",
      detail: "docs/user-flows.md · docs/help-center.md · кейс ТИНДА",
      href: "/demo",
    },
    {
      id: "lia-guide",
      label: "Гид Лии для старта",
      status: "ready",
      detail: "Сценарий «Как начать работу с ЦКР?» → LaunchGuide",
      href: "/lia?scenario=launch_guide",
    },
  ];
}
