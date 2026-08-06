import { flattenInternalMatches } from "@/lib/lia/analysis";
import {
  TINDA_ANALYSIS_ID,
  TINDA_CRM_IDS,
  TINDA_DEAL_ID,
  TINDA_LEAD_IDS,
  TINDA_ORG_ID,
  TINDA_OWNER_ID,
  TINDA_PARTICIPANT_ID,
  TINDA_PARTNERSHIP_IDS,
  TINDA_PROJECT_ID,
  TINDA_ROADMAP_ID,
  buildTindaLiaReport,
  tindaCrmContacts,
  tindaExecutionItems,
  tindaExecutionMetrics,
  tindaExecutionRoadmap,
  tindaExecutionTasks,
  tindaFinancialMetrics,
  tindaMilestones,
  tindaOrganization,
  tindaPilotChecklist,
  tindaProject,
  tindaProjectResults,
  tindaSeedMeta,
} from "@/lib/pilot/tinda-seed-data";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TindaSeedResult = {
  ok: boolean;
  message: string;
  created?: Record<string, number>;
  ids?: {
    ownerId: string;
    organizationId: string;
    projectId: string;
  };
};

async function ensurePilotUser(
  admin: SupabaseClient,
  input: { id: string; email: string; fullName: string },
): Promise<string> {
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list.data.users.find((u) => u.email === input.email);
  if (existing) return existing.id;

  const created = await admin.auth.admin.createUser({
    id: input.id,
    email: input.email,
    password: "PilotTinda-ChangeMe!",
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      pilot: "tinda",
    },
  });

  if (created.data.user) return created.data.user.id;

  const retry = await admin.auth.admin.createUser({
    email: input.email,
    password: "PilotTinda-ChangeMe!",
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      pilot: "tinda",
    },
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
 * Применяет пилот ООО ТИНДА через service role.
 * Использует существующие таблицы: organizations, projects, milestones,
 * deals, CRM, lia_analyses, reputation, partnerships.
 */
export async function applyTindaPilotSeed(): Promise<TindaSeedResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      ok: false,
      message:
        "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY для seed пилота ТИНДА.",
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const ownerId = await ensurePilotUser(admin, {
      id: TINDA_OWNER_ID,
      email: "pilot.tinda@ckr.local",
      fullName: "Оператор пилота ТИНДА",
    });

    await admin.from("profiles").upsert({
      id: ownerId,
      full_name: "Оператор пилота ТИНДА",
      company_name: tindaOrganization.name,
      bio: "Служебный профиль владельца пилотного проекта ООО ТИНДА в ЦКР. Не содержит реальных ПДн сотрудников.",
      city: tindaOrganization.city,
      region: tindaOrganization.region,
      website: tindaOrganization.website || null,
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

    const { error: orgError } = await admin.from("organizations").upsert({
      id: tindaOrganization.id,
      name: tindaOrganization.name,
      type: tindaOrganization.type,
      description: tindaOrganization.description,
      website: tindaOrganization.website,
      region: tindaOrganization.region,
      city: tindaOrganization.city,
      verification_status: tindaOrganization.verificationStatus,
      created_by: ownerId,
    });
    if (orgError) throw new Error(`organizations: ${orgError.message}`);

    const { error: memberError } = await admin
      .from("organization_members")
      .upsert(
        {
          organization_id: TINDA_ORG_ID,
          user_id: ownerId,
          role: "owner",
        },
        { onConflict: "organization_id,user_id" },
      );
    if (memberError) {
      throw new Error(`organization_members: ${memberError.message}`);
    }

    const { error: projectError } = await admin.from("projects").upsert({
      id: tindaProject.id,
      owner_id: ownerId,
      organization_id: TINDA_ORG_ID,
      title: tindaProject.title,
      slug: tindaProject.slug,
      summary: tindaProject.summary,
      description: tindaProject.description,
      category: tindaProject.category,
      region: tindaProject.region,
      investment_required: tindaProject.investmentRequired,
      currency: tindaProject.currency,
      stage: tindaProject.stage,
      status: tindaProject.status,
      verification_status: "verified",
    });
    if (projectError) throw new Error(`projects: ${projectError.message}`);

    let milestones = 0;
    for (const item of tindaMilestones) {
      const { error } = await admin.from("project_milestones").upsert({
        id: item.id,
        project_id: TINDA_PROJECT_ID,
        title: item.title,
        description: item.description,
        status: item.status,
        sort_order: item.sortOrder,
      });
      if (!error) milestones += 1;
    }

    const { error: roadmapError } = await admin.from("project_roadmaps").upsert({
      id: tindaExecutionRoadmap.id,
      project_id: tindaExecutionRoadmap.projectId,
      title: tindaExecutionRoadmap.title,
      description: tindaExecutionRoadmap.description,
      status: tindaExecutionRoadmap.status,
    });
    if (roadmapError) {
      throw new Error(`project_roadmaps: ${roadmapError.message}`);
    }

    let roadmapItems = 0;
    for (const item of tindaExecutionItems) {
      const { error } = await admin.from("roadmap_items").upsert({
        id: item.id,
        roadmap_id: TINDA_ROADMAP_ID,
        title: item.title,
        description: item.description,
        order_number: item.orderNumber,
        responsible_user_id: ownerId,
        status: item.status,
        milestone_id: item.milestoneId,
      });
      if (!error) roadmapItems += 1;
    }

    let roadmapTasks = 0;
    for (const task of tindaExecutionTasks) {
      const { error } = await admin.from("tasks").upsert({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: ownerId,
        related_type: "roadmap_item",
        related_id: task.itemId,
        roadmap_item_id: task.itemId,
        priority: "medium",
        status: task.status,
        created_by: ownerId,
      });
      if (!error) roadmapTasks += 1;
    }

    let metrics = 0;
    for (const metric of tindaExecutionMetrics) {
      const { error } = await admin.from("project_metrics").upsert({
        id: metric.id,
        project_id: TINDA_PROJECT_ID,
        name: metric.name,
        description: metric.description,
        target_value: metric.targetValue,
        current_value: metric.currentValue,
        unit: metric.unit,
        period: metric.period,
      });
      if (!error) metrics += 1;
    }

    let projectResults = 0;
    for (const result of tindaProjectResults) {
      const { error } = await admin.from("project_results").upsert({
        id: result.id,
        project_id: TINDA_PROJECT_ID,
        result_type: result.resultType,
        title: result.title,
        description: result.description,
        value: result.value,
        unit: result.unit,
        achieved_at: new Date().toISOString(),
        metric_id: result.metricId,
      });
      if (!error) projectResults += 1;
    }

    let financialMetrics = 0;
    for (const metric of tindaFinancialMetrics) {
      const { error } = await admin.from("project_financial_metrics").upsert({
        id: metric.id,
        project_id: TINDA_PROJECT_ID,
        metric_type: metric.metricType,
        value: metric.value,
        currency: metric.currency,
        period: metric.period,
      });
      if (!error) financialMetrics += 1;
    }

    const { count: resultActivityCount } = await admin
      .from("project_activity")
      .select("id", { count: "exact", head: true })
      .eq("project_id", TINDA_PROJECT_ID)
      .eq("activity_type", "result_created")
      .contains("metadata", { source: "tinda-pilot-seed" });

    if (!resultActivityCount) {
      await admin.from("project_activity").insert({
        project_id: TINDA_PROJECT_ID,
        actor_id: ownerId,
        activity_type: "result_created",
        title: "Подготовлены результаты пилота ТИНДА",
        body: "Зафиксированы целевые кейсы: клиенты, договоры, партнёры.",
        metadata: {
          source: "tinda-pilot-seed",
          version: tindaSeedMeta.version,
          results: projectResults,
        },
      });
    }

    const { count: roadmapActivityCount } = await admin
      .from("project_activity")
      .select("id", { count: "exact", head: true })
      .eq("project_id", TINDA_PROJECT_ID)
      .eq("activity_type", "roadmap_created")
      .contains("metadata", { source: "tinda-pilot-seed" });

    if (!roadmapActivityCount) {
      await admin.from("project_activity").insert({
        project_id: TINDA_PROJECT_ID,
        actor_id: ownerId,
        activity_type: "roadmap_created",
        title: "Создана дорожная карта ТИНДА",
        body: tindaExecutionRoadmap.title,
        metadata: {
          source: "tinda-pilot-seed",
          roadmapId: TINDA_ROADMAP_ID,
          version: tindaSeedMeta.version,
        },
      });
    }

    const { count: activityCount } = await admin
      .from("project_activity")
      .select("id", { count: "exact", head: true })
      .eq("project_id", TINDA_PROJECT_ID)
      .eq("title", "Пилот ТИНДА инициализирован");

    if (!activityCount) {
      await admin.from("project_activity").insert({
        project_id: TINDA_PROJECT_ID,
        actor_id: ownerId,
        activity_type: "note",
        title: "Пилот ТИНДА инициализирован",
        body: "Организация, проект, этапы workspace и CRM-структура загружены seed-скриптом этапа 30.",
        metadata: {
          source: "tinda-pilot-seed",
          version: tindaSeedMeta.version,
        },
      });
    }

    const { error: dealError } = await admin.from("deals").upsert({
      id: TINDA_DEAL_ID,
      project_id: TINDA_PROJECT_ID,
      initiator_id: ownerId,
      partner_id: null,
      deal_type: "partnership",
      status: "negotiation",
      amount: null,
      currency: "RUB",
      description:
        "Пилотная сделка-контейнер для сопровождения партнёрств оптовой платформы ТИНДА.",
    });
    if (dealError) throw new Error(`deals: ${dealError.message}`);

    await admin.from("deal_participants").upsert(
      {
        deal_id: TINDA_DEAL_ID,
        user_id: ownerId,
        role: "owner",
      },
      { onConflict: "deal_id,user_id" },
    );

    let contacts = 0;
    for (const item of tindaCrmContacts) {
      const { error } = await admin.from("crm_contacts").upsert({
        id: item.id,
        name: item.name,
        company_name: item.companyName,
        phone: "",
        email: "",
        type: item.type,
        source: item.source,
        status: item.status,
        notes: item.notes,
        assigned_to: ownerId,
        created_by: ownerId,
      });
      if (!error) contacts += 1;
    }

    await admin.from("leads").upsert({
      id: TINDA_LEAD_IDS.clientExpansion,
      contact_id: TINDA_CRM_IDS.clientA,
      title: "Расширение клиентской базы ТИНДА",
      description:
        "Лид пилота: рост оптовых клиентов в текущем регионе и подготовка к экспансии.",
      category: "trade",
      assigned_to: ownerId,
      stage: "qualified",
      converted_project_id: TINDA_PROJECT_ID,
      created_by: ownerId,
    });

    await admin.from("leads").upsert({
      id: TINDA_LEAD_IDS.supplierOnboard,
      contact_id: TINDA_CRM_IDS.supplierA,
      title: "Онбординг ключевых поставщиков",
      description:
        "Лид пилота: подключение поставщиков к оптовой платформе.",
      category: "trade",
      assigned_to: ownerId,
      stage: "contacted",
      created_by: ownerId,
    });

    await admin.from("partnerships").upsert({
      id: TINDA_PARTNERSHIP_IDS.supplier,
      organization_id: TINDA_ORG_ID,
      type: "supplier",
      status: "active",
      description:
        "Контур поставщиков оптовой платформы ТИНДА (пилотная запись).",
      created_by: ownerId,
    });

    await admin.from("partnerships").upsert({
      id: TINDA_PARTNERSHIP_IDS.strategic,
      organization_id: TINDA_ORG_ID,
      type: "strategic",
      status: "pending",
      description:
        "Стратегические партнёры масштабирования платформы (пилотная запись).",
      created_by: ownerId,
    });

    const report = buildTindaLiaReport();
    const { error: liaError } = await admin.from("lia_analyses").upsert({
      id: TINDA_ANALYSIS_ID,
      user_id: ownerId,
      project_id: TINDA_PROJECT_ID,
      summary: report.solutionDraft.summary,
      available_resources: report.solutionDraft.available_resources,
      missing_resources: report.solutionDraft.missing_resources,
      recommendations: report.solutionDraft.recommendations,
      risks: report.solutionDraft.risks,
      next_steps: report.solutionDraft.next_steps,
      internal_matches: flattenInternalMatches(report),
      external_results: report.external,
      report,
    });
    if (liaError) throw new Error(`lia_analyses: ${liaError.message}`);

    await admin.from("reputation_profiles").upsert(
      {
        entity_type: "organization",
        entity_id: TINDA_ORG_ID,
        score: 0,
        verification_level: "verified",
        completed_projects: 0,
        completed_deals: 0,
        reviews_count: 0,
      },
      { onConflict: "entity_type,entity_id" },
    );

    const { count: historyCount } = await admin
      .from("entity_history")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", "organization")
      .eq("entity_id", TINDA_ORG_ID)
      .eq("related_id", TINDA_PROJECT_ID);

    if (!historyCount) {
      await admin.from("entity_history").insert({
        entity_type: "organization",
        entity_id: TINDA_ORG_ID,
        kind: "project",
        title: "Запущен пилотный проект в ЦКР",
        related_type: "project",
        related_id: TINDA_PROJECT_ID,
        meta: {
          projectTitle: tindaProject.title,
          source: "tinda-pilot-seed",
        },
      });
    }

    const { count: metricCount } = await admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", TINDA_PROJECT_ID)
      .contains("metadata", { source: "tinda-pilot-seed" });

    if (!metricCount) {
      const pilotEvents = [
        "registration_completed",
        "profile_completed",
        "project_created",
        "project_published",
        "lia_used",
        "deal_created",
      ] as const;

      for (const eventType of pilotEvents) {
        await admin.from("analytics_events").insert({
          user_id: ownerId,
          event_type: eventType,
          entity_type:
            eventType === "deal_created"
              ? "deal"
              : eventType === "lia_used"
                ? "lia_analysis"
                : eventType.startsWith("project")
                  ? "project"
                  : "organization",
          entity_id:
            eventType === "deal_created"
              ? TINDA_DEAL_ID
              : eventType === "lia_used"
                ? TINDA_ANALYSIS_ID
                : eventType.startsWith("project")
                  ? TINDA_PROJECT_ID
                  : TINDA_ORG_ID,
          metadata: {
            channel: "closed_pilot",
            source: "tinda-pilot-seed",
            organization: tindaSeedMeta.organization,
          },
        });
      }
    }

    const { error: participantError } = await admin
      .from("pilot_participants")
      .upsert({
        id: TINDA_PARTICIPANT_ID,
        user_id: ownerId,
        role: "organization",
        status: "active",
        notes: "ООО ТИНДА — production pilot case (этап 41)",
      });
    if (participantError) {
      throw new Error(`pilot_participants: ${participantError.message}`);
    }

    let checklistItems = 0;
    for (const item of tindaPilotChecklist) {
      const { error } = await admin.from("pilot_checklists").upsert({
        id: item.id,
        participant_id: TINDA_PARTICIPANT_ID,
        item: item.item,
        status: item.status,
      });
      if (!error) checklistItems += 1;
    }

    let waveParticipants = 0;
    try {
      const { LAUNCH_WAVE_IDS, TINDA_WAVE_PARTICIPANT_ID } = await import(
        "@/config/launch-waves"
      );
      const { error: waveError } = await admin
        .from("launch_wave_participants")
        .upsert({
          id: TINDA_WAVE_PARTICIPANT_ID,
          wave_id: LAUNCH_WAVE_IDS.closed,
          user_id: ownerId,
          status: "active",
          notes: "ООО ТИНДА — production pilot case, волна 1 closed",
        });
      if (!waveError) waveParticipants = 1;
    } catch {
      // таблица волн может ещё не быть применена
    }

    return {
      ok: true,
      message: `ТИНДА production pilot case v${tindaSeedMeta.version} применён. Смените пароль pilot.tinda@ckr.local после запуска.`,
      created: {
        organization: 1,
        project: 1,
        milestones,
        roadmapItems,
        roadmapTasks,
        metrics,
        projectResults,
        financialMetrics,
        contacts,
        deals: 1,
        liaAnalyses: 1,
        pilotParticipants: 1,
        pilotChecklists: checklistItems,
        waveParticipants,
      },
      ids: {
        ownerId,
        organizationId: TINDA_ORG_ID,
        projectId: TINDA_PROJECT_ID,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ошибка seed ТИНДА",
    };
  }
}
