import {
  AdminTable,
  type AdminTableColumn,
} from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { MetricCard } from "@/components/analytics/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CRM_CONTACT_STATUSES,
  CRM_LEAD_STAGES,
  CRM_TABS,
  crmActivityTypeLabels,
  crmContactStatusLabels,
  crmContactTypeLabels,
  crmLeadStageLabels,
  crmTaskStatusLabels,
  type CrmTab,
} from "@/config/crm";
import {
  completeCrmTaskAction,
  updateCrmContactStatusAction,
  updateCrmLeadStageAction,
} from "@/features/crm/actions";
import { CreateActivityForm } from "@/features/crm/components/create-activity-form";
import { CreateContactForm } from "@/features/crm/components/create-contact-form";
import { CreateLeadForm } from "@/features/crm/components/create-lead-form";
import { CrmSegmentTemplates } from "@/features/crm/components/crm-segment-templates";
import { CrmTabs } from "@/features/crm/components/crm-tabs";
import {
  LIA_CRM_OPERATOR_SCENARIOS,
  buildLeadsNeedAttentionInsight,
} from "@/lib/crm/lia-operator";
import {
  getCrmDashboardStats,
  listCrmActivities,
  listCrmContacts,
  listCrmLeads,
  listCrmTasks,
} from "@/lib/crm/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { CrmActivity, CrmContact, CrmLead } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CRM — Админ",
};

export const dynamic = "force-dynamic";

function parseTab(value: string | string[] | undefined): CrmTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (CRM_TABS as readonly string[]).includes(raw)) {
    return raw as CrmTab;
  }
  return "contacts";
}

function contactTone(status: CrmContact["status"]) {
  if (status === "active") return "success" as const;
  if (status === "inactive") return "danger" as const;
  return "warning" as const;
}

function leadTone(stage: CrmLead["stage"]) {
  if (stage === "deal" || stage === "project_created") return "success" as const;
  if (stage === "closed") return "danger" as const;
  if (stage === "qualified" || stage === "contacted") return "accent" as const;
  return "warning" as const;
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = parseTab(searchParams?.tab);
  const [stats, contacts, leads, tasks, history] = await Promise.all([
    getCrmDashboardStats(),
    listCrmContacts(),
    listCrmLeads(),
    listCrmTasks(),
    listCrmActivities(80),
  ]);

  const liaInsight = buildLeadsNeedAttentionInsight(leads);

  const contactColumns: AdminTableColumn<CrmContact>[] = [
    {
      key: "name",
      header: "Контакт",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted">{row.companyName || "—"}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Тип",
      cell: (row) => crmContactTypeLabels[row.type],
    },
    {
      key: "email",
      header: "Связь",
      cell: (row) => (
        <div className="text-xs">
          <div>{row.email || "—"}</div>
          <div className="text-muted">{row.phone || "—"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      cell: (row) => (
        <form action={updateCrmContactStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="contactId" value={row.id} />
          <StatusBadge
            label={crmContactStatusLabels[row.status]}
            tone={contactTone(row.status)}
          />
          <select
            name="status"
            defaultValue={row.status}
            className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
          >
            {CRM_CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {crmContactStatusLabels[status]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="ghost">
            OK
          </Button>
        </form>
      ),
    },
    {
      key: "source",
      header: "Источник",
      cell: (row) => row.source || "—",
    },
  ];

  const leadColumns: AdminTableColumn<CrmLead>[] = [
    {
      key: "title",
      header: "Лид",
      cell: (row) => (
        <div>
          <Link
            href={`/admin/crm/leads/${row.id}`}
            className="font-medium text-accent hover:underline"
          >
            {row.title}
          </Link>
          <p className="text-xs text-muted">{row.contactName || "—"}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Категория",
      cell: (row) => row.category || "—",
    },
    {
      key: "stage",
      header: "Этап",
      cell: (row) => (
        <form action={updateCrmLeadStageAction} className="flex items-center gap-2">
          <input type="hidden" name="leadId" value={row.id} />
          <StatusBadge
            label={crmLeadStageLabels[row.stage]}
            tone={leadTone(row.stage)}
          />
          <select
            name="stage"
            defaultValue={row.stage}
            className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
          >
            {CRM_LEAD_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {crmLeadStageLabels[stage]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="ghost">
            OK
          </Button>
        </form>
      ),
    },
    {
      key: "converted",
      header: "Конвертация",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.convertedUserId ? <Badge variant="soft">user</Badge> : null}
          {row.convertedProjectId ? <Badge variant="soft">project</Badge> : null}
          {row.convertedOpportunityId ? (
            <Badge variant="soft">opportunity</Badge>
          ) : null}
          {row.convertedInvestmentId ? (
            <Badge variant="soft">investment</Badge>
          ) : null}
          {!row.convertedUserId &&
          !row.convertedProjectId &&
          !row.convertedOpportunityId &&
          !row.convertedInvestmentId ? (
            <span className="text-xs text-muted">—</span>
          ) : null}
        </div>
      ),
    },
  ];

  const taskColumns: AdminTableColumn<CrmActivity>[] = [
    {
      key: "title",
      header: "Задача",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title || "Задача"}</p>
          <p className="text-xs text-muted">
            {row.leadTitle || row.contactName || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      cell: (row) =>
        row.taskStatus ? crmTaskStatusLabels[row.taskStatus] : "—",
    },
    {
      key: "due",
      header: "Срок",
      cell: (row) =>
        row.dueAt ? new Date(row.dueAt).toLocaleString("ru-RU") : "—",
    },
    {
      key: "actions",
      header: "Действия",
      cell: (row) =>
        row.taskStatus === "open" ? (
          <form action={completeCrmTaskAction}>
            <input type="hidden" name="activityId" value={row.id} />
            <Button type="submit" size="sm" variant="secondary">
              Выполнено
            </Button>
          </form>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Оператор ЦКР"
        title="CRM ЦКР"
        description="Внутренняя система работы с клиентами, партнёрами и потенциальными проектами."
      />

      {!hasSupabaseEnv() ? (
        <Card variant="surface" className="p-5 text-sm text-muted">
          Supabase не настроен — примените миграцию `crm` и задайте env.
        </Card>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Контакты" value={stats.contacts} />
        <MetricCard label="Открытые лиды" value={stats.leadsOpen} />
        <MetricCard label="Открытые задачи" value={stats.tasksOpen} />
        <MetricCard label="Активности" value={stats.activities} />
      </section>

      <Card variant="surface" className="space-y-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Лия · оператор (архитектура)
        </p>
        <p className="text-sm text-foreground">{liaInsight.summary}</p>
        <p className="text-xs text-muted">{liaInsight.nextStep}</p>
        <ul className="flex flex-wrap gap-2">
          {LIA_CRM_OPERATOR_SCENARIOS.map((scenario) => (
            <li key={scenario.id}>
              <Badge variant="soft" title={scenario.description}>
                {scenario.examplePrompt}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <CrmTabs active={tab} />

      {tab === "contacts" ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card variant="surface" className="space-y-4 p-5">
              <h2 className="font-display text-xl text-foreground">
                Новый контакт
              </h2>
              <CreateContactForm />
            </Card>
            <Card variant="surface" className="p-5">
              <CrmSegmentTemplates />
            </Card>
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground">Контакты</h2>
            {contacts.length === 0 ? (
              <EmptyState
                title="Контактов пока нет"
                description="Создайте контакт или примените шаблон сегмента."
              />
            ) : (
              <AdminTable
                columns={contactColumns}
                rows={contacts}
                rowKey={(row) => row.id}
              />
            )}
          </div>
        </section>
      ) : null}

      {tab === "leads" ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card variant="surface" className="space-y-4 p-5">
            <h2 className="font-display text-xl text-foreground">Новый лид</h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted">
                Сначала создайте контакт во вкладке «Контакты».
              </p>
            ) : (
              <CreateLeadForm contacts={contacts} />
            )}
          </Card>
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground">Лиды</h2>
            {leads.length === 0 ? (
              <EmptyState
                title="Лидов пока нет"
                description="Создайте лид на основе контакта."
              />
            ) : (
              <AdminTable
                columns={leadColumns}
                rows={leads}
                rowKey={(row) => row.id}
              />
            )}
          </div>
        </section>
      ) : null}

      {tab === "tasks" ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card variant="surface" className="space-y-4 p-5">
            <h2 className="font-display text-xl text-foreground">
              Новая активность / задача
            </h2>
            <CreateActivityForm contacts={contacts} leads={leads} />
          </Card>
          <div className="space-y-4">
            <h2 className="font-display text-xl text-foreground">Задачи</h2>
            {tasks.length === 0 ? (
              <EmptyState
                title="Задач пока нет"
                description="Добавьте задачу слева."
              />
            ) : (
              <AdminTable
                columns={taskColumns}
                rows={tasks}
                rowKey={(row) => row.id}
              />
            )}
          </div>
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            История активностей
          </h2>
          {history.length === 0 ? (
            <EmptyState
              title="История пуста"
              description="Звонки, встречи, письма и комментарии появятся здесь."
            />
          ) : (
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id}>
                  <Card variant="surface" className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent">
                        {crmActivityTypeLabels[item.type]}
                      </Badge>
                      <p className="font-medium text-foreground">
                        {item.title || crmActivityTypeLabels[item.type]}
                      </p>
                      <span className="text-xs text-muted">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("ru-RU")
                          : ""}
                      </span>
                    </div>
                    {item.body ? (
                      <p className="text-sm text-muted">{item.body}</p>
                    ) : null}
                    <p className="text-xs text-muted">
                      {[item.contactName, item.leadTitle]
                        .filter(Boolean)
                        .join(" · ") || "Без привязки"}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
