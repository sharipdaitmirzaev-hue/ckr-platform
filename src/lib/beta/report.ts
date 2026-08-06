import {
  BETA_ONBOARDING_EVENTS,
  BETA_SCENARIO_CHECKLISTS,
  isActivatedInviteStatus,
  isOpenInviteStatus,
  normalizeBetaParticipationStatus,
  type BetaScenarioRole,
} from "@/config/controlled-beta";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type BetaParticipantRow = {
  inviteId: string;
  email: string;
  role: string;
  status: string;
  participationStatus: string;
  userId: string | null;
  fullName: string | null;
  invitedAt: string;
  activatedAt: string | null;
  lastActionAt: string | null;
  lastActionType: string | null;
  modules: string[];
  scenarioComplete: boolean;
};

export type BetaReportData = {
  users: {
    invited: number;
    activated: number;
    active: number;
    completed: number;
    disabled: number;
  };
  funnel: {
    registration: number;
    profile: number;
    firstAction: number;
    lia: number;
    objectCreated: number;
  };
  activity: {
    projects: number;
    applications: number;
    interests: number;
    deals: number;
  };
  onboardingEvents: Record<string, number>;
  scenarios: Array<{
    role: BetaScenarioRole;
    title: string;
    steps: Array<{ key: string; label: string; doneCount: number }>;
  }>;
  participants: BetaParticipantRow[];
};

function emptyReport(): BetaReportData {
  return {
    users: {
      invited: 0,
      activated: 0,
      active: 0,
      completed: 0,
      disabled: 0,
    },
    funnel: {
      registration: 0,
      profile: 0,
      firstAction: 0,
      lia: 0,
      objectCreated: 0,
    },
    activity: {
      projects: 0,
      applications: 0,
      interests: 0,
      deals: 0,
    },
    onboardingEvents: Object.fromEntries(
      BETA_ONBOARDING_EVENTS.map((e) => [e, 0]),
    ),
    scenarios: (
      Object.entries(BETA_SCENARIO_CHECKLISTS) as Array<
        [BetaScenarioRole, (typeof BETA_SCENARIO_CHECKLISTS)[BetaScenarioRole]]
      >
    ).map(([role, cfg]) => ({
      role,
      title: cfg.title,
      steps: cfg.steps.map((s) => ({
        key: s.key,
        label: s.label,
        doneCount: 0,
      })),
    })),
    participants: [],
  };
}

export async function getBetaReport(): Promise<BetaReportData> {
  if (!hasSupabaseEnv()) return emptyReport();

  try {
    const supabase = createClient();
    const cutoff = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      invitesRes,
      eventsRes,
      projectsRes,
      appsRes,
      interestsRes,
      dealsRes,
      profilesRes,
    ] = await Promise.all([
      supabase
        .from("beta_invites")
        .select(
          "id, email, role, status, created_at, used_at, used_by",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("analytics_events")
        .select("id, event_type, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const invites = invitesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const nameById = new Map(
      (profilesRes.data ?? []).map((p) => [
        p.id as string,
        (p.full_name as string | null) ?? null,
      ]),
    );

    let invited = 0;
    let activated = 0;
    let completed = 0;
    let disabled = 0;

    for (const invite of invites) {
      const normalized = normalizeBetaParticipationStatus(
        invite.status as string,
      );
      if (normalized === "invited") invited += 1;
      if (normalized === "activated") activated += 1;
      if (normalized === "completed") completed += 1;
      if (normalized === "disabled") disabled += 1;
      // activated count includes completed for "активировано"
      if (isActivatedInviteStatus(invite.status as string)) {
        if (normalized !== "activated" && normalized !== "completed") {
          // no-op
        }
      }
    }

    // «Активировано» = activated + completed + legacy used
    activated = invites.filter((i) =>
      isActivatedInviteStatus(i.status as string),
    ).length;
    invited = invites.filter((i) =>
      isOpenInviteStatus(i.status as string),
    ).length;
    completed = invites.filter(
      (i) => (i.status as string) === "completed",
    ).length;
    disabled = invites.filter((i) => {
      const n = normalizeBetaParticipationStatus(i.status as string);
      return n === "disabled";
    }).length;

    const usersWithEvent = (type: string) => {
      const set = new Set<string>();
      for (const e of events) {
        if (e.event_type === type && e.user_id) set.add(e.user_id as string);
      }
      return set;
    };

    const regUsers = usersWithEvent("registration_completed");
    if (regUsers.size === 0) {
      for (const e of events) {
        if (e.event_type === "user_registered" && e.user_id) {
          regUsers.add(e.user_id as string);
        }
      }
    }
    const profileUsers = usersWithEvent("profile_completed");
    const liaUsers = new Set([
      ...usersWithEvent("first_lia_use"),
      ...usersWithEvent("lia_used"),
    ]);
    const projectUsers = new Set([
      ...usersWithEvent("first_project_created"),
      ...usersWithEvent("project_created"),
    ]);
    const appUsers = usersWithEvent("first_application_sent");
    const interestUsers = usersWithEvent("first_interest_created");
    const firstActionUsers = new Set([
      ...liaUsers,
      ...projectUsers,
      ...appUsers,
      ...interestUsers,
      ...usersWithEvent("project_viewed"),
    ]);

    const onboardingEvents: Record<string, number> = {};
    for (const key of BETA_ONBOARDING_EVENTS) {
      onboardingEvents[key] = usersWithEvent(key).size;
    }

    const eventUsersByType = new Map<string, Set<string>>();
    const lastByUser = new Map<
      string,
      { at: string; type: string }
    >();
    const modulesByUser = new Map<string, Set<string>>();

    for (const e of events) {
      const uid = e.user_id as string | null;
      const type = e.event_type as string;
      if (!uid) continue;
      if (!eventUsersByType.has(type)) eventUsersByType.set(type, new Set());
      eventUsersByType.get(type)!.add(uid);

      const prev = lastByUser.get(uid);
      if (!prev || (e.created_at as string) > prev.at) {
        lastByUser.set(uid, { at: e.created_at as string, type });
      }

      const mods = modulesByUser.get(uid) ?? new Set();
      if (type.includes("lia") || type === "first_lia_use") mods.add("Лия");
      if (type.includes("project")) mods.add("Проекты");
      if (type.includes("application")) mods.add("Заявки");
      if (type.includes("interest")) mods.add("Интересы");
      if (type.includes("deal")) mods.add("Сделки");
      if (type.includes("onboarding") || type.includes("profile")) {
        mods.add("Профиль");
      }
      modulesByUser.set(uid, mods);
    }

    const scenarios = (
      Object.entries(BETA_SCENARIO_CHECKLISTS) as Array<
        [BetaScenarioRole, (typeof BETA_SCENARIO_CHECKLISTS)[BetaScenarioRole]]
      >
    ).map(([role, cfg]) => ({
      role,
      title: cfg.title,
      steps: cfg.steps.map((step) => ({
        key: step.key,
        label: step.label,
        doneCount: step.event
          ? (eventUsersByType.get(step.event)?.size ?? 0)
          : 0,
      })),
    }));

    const activeUserIds = new Set<string>();
    for (const [uid, last] of Array.from(lastByUser.entries())) {
      if (last.at >= cutoff) activeUserIds.add(uid);
    }

    const participants: BetaParticipantRow[] = invites.map((invite) => {
      const userId = (invite.used_by as string | null) ?? null;
      const last = userId ? lastByUser.get(userId) : null;
      const modules = userId
        ? Array.from(modulesByUser.get(userId) ?? [])
        : [];
      const role = invite.role as string;
      const scenarioCfg =
        role in BETA_SCENARIO_CHECKLISTS
          ? BETA_SCENARIO_CHECKLISTS[role as BetaScenarioRole]
          : null;
      let scenarioComplete = false;
      if (scenarioCfg && userId) {
        scenarioComplete = scenarioCfg.steps.every((step) => {
          if (!step.event) return true;
          return eventUsersByType.get(step.event)?.has(userId) ?? false;
        });
      }

      return {
        inviteId: invite.id as string,
        email: invite.email as string,
        role,
        status: invite.status as string,
        participationStatus: normalizeBetaParticipationStatus(
          invite.status as string,
        ),
        userId,
        fullName: userId ? nameById.get(userId) ?? null : null,
        invitedAt: invite.created_at as string,
        activatedAt: (invite.used_at as string | null) ?? null,
        lastActionAt: last?.at ?? null,
        lastActionType: last?.type ?? null,
        modules,
        scenarioComplete,
      };
    });

    return {
      users: {
        invited,
        activated,
        active: activeUserIds.size,
        completed,
        disabled,
      },
      funnel: {
        registration: regUsers.size || activated,
        profile: profileUsers.size,
        firstAction: firstActionUsers.size,
        lia: liaUsers.size,
        objectCreated: projectUsers.size,
      },
      activity: {
        projects: projectsRes.count ?? 0,
        applications: appsRes.count ?? 0,
        interests: interestsRes.count ?? 0,
        deals: dealsRes.count ?? 0,
      },
      onboardingEvents,
      scenarios,
      participants,
    };
  } catch {
    return emptyReport();
  }
}
