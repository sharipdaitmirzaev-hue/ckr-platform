import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CRM_LEAD_STAGES,
  crmLeadStageLabels,
} from "@/config/crm";
import { updateCrmLeadStageAction } from "@/features/crm/actions";
import { ConvertLeadForm } from "@/features/crm/components/convert-lead-form";
import { CreateActivityForm } from "@/features/crm/components/create-activity-form";
import { Button } from "@/components/ui/button";
import {
  getCrmLeadById,
  listCrmActivities,
  listCrmContacts,
  listCrmLeads,
} from "@/lib/crm/queries";
import { crmActivityTypeLabels } from "@/config/crm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Лид CRM — Админ",
};

export const dynamic = "force-dynamic";

export default async function AdminCrmLeadPage({
  params,
}: {
  params: { id: string };
}) {
  const [lead, contacts, leads, activities] = await Promise.all([
    getCrmLeadById(params.id),
    listCrmContacts(),
    listCrmLeads(),
    listCrmActivities(200),
  ]);

  if (!lead) notFound();

  const leadActivities = activities.filter((item) => item.leadId === lead.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          eyebrow="CRM"
          title={lead.title}
          description={
            lead.contactName
              ? `Контакт: ${lead.contactName}${lead.contactEmail ? ` · ${lead.contactEmail}` : ""}`
              : "Карточка лида"
          }
        />
        <Link
          href="/admin/crm?tab=leads"
          className="text-sm text-muted hover:text-accent"
        >
          ← К списку лидов
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={crmLeadStageLabels[lead.stage]}
              tone="accent"
            />
            {lead.category ? <Badge variant="soft">{lead.category}</Badge> : null}
          </div>
          <p className="text-sm text-muted whitespace-pre-wrap">
            {lead.description || "Описание не заполнено."}
          </p>

          <form action={updateCrmLeadStageAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <label className="space-y-1 text-xs text-muted">
              Этап
              <select
                name="stage"
                defaultValue={lead.stage}
                className="flex h-9 min-w-[180px] rounded-sm border border-border bg-background px-2 text-sm"
              >
                {CRM_LEAD_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {crmLeadStageLabels[stage]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline">
              Сохранить этап
            </Button>
          </form>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-muted">
            <p>
              Пользователь:{" "}
              <span className="font-mono text-foreground">
                {lead.convertedUserId ?? "—"}
              </span>
            </p>
            <p>
              Проект:{" "}
              <span className="font-mono text-foreground">
                {lead.convertedProjectId ?? "—"}
              </span>
            </p>
            <p>
              Возможность:{" "}
              <span className="font-mono text-foreground">
                {lead.convertedOpportunityId ?? "—"}
              </span>
            </p>
            <p>
              Инвестиция:{" "}
              <span className="font-mono text-foreground">
                {lead.convertedInvestmentId ?? "—"}
              </span>
            </p>
          </div>
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Конвертация (только с подтверждением)
          </h2>
          <p className="text-sm text-muted">
            Лид → пользователь / проект / возможность / инвестиция. Действие
            выполняется только после явного подтверждения администратора.
          </p>
          <ConvertLeadForm leadId={lead.id} />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Активность</h2>
          <CreateActivityForm
            contacts={contacts}
            leads={leads}
            defaultLeadId={lead.id}
            defaultContactId={lead.contactId}
          />
        </Card>
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">История лида</h2>
          {leadActivities.length === 0 ? (
            <Card variant="surface" className="p-4 text-sm text-muted">
              Пока нет записей.
            </Card>
          ) : (
            leadActivities.map((item) => (
              <Card key={item.id} variant="surface" className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">
                    {crmActivityTypeLabels[item.type]}
                  </Badge>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.body ? (
                  <p className="text-sm text-muted">{item.body}</p>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
