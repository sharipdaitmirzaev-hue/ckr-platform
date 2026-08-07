import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminTable } from "@/components/admin/admin-table";
import {
  StatusBadge,
  publishStatusTone,
  verificationStatusTone,
} from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  OPPORTUNITY_STATUSES,
  opportunityStatusLabels,
  opportunityTypeLabels,
} from "@/config/opportunities";
import {
  VERIFICATION_STATUSES,
  verificationStatusLabels,
} from "@/config/verification";
import { adminUpdateOpportunityModerationAction } from "@/features/admin/actions";
import { ModerationForm } from "@/features/admin/components/moderation-form";
import { listAdminOpportunities } from "@/lib/admin/queries";
import type {
  OpportunityType,
  PublishStatus,
  VerificationStatus,
} from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Возможности" };

type OpportunitiesPageProps = {
  searchParams?: { status?: string; verification?: string };
};

export default async function AdminOpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const status = OPPORTUNITY_STATUSES.includes(
    searchParams?.status as PublishStatus,
  )
    ? (searchParams?.status as PublishStatus)
    : null;
  const verificationStatus = VERIFICATION_STATUSES.includes(
    searchParams?.verification as VerificationStatus,
  )
    ? (searchParams?.verification as VerificationStatus)
    : null;

  const opportunities = await listAdminOpportunities({
    status,
    verificationStatus,
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Возможности"
        description="Список, проверка и изменение статуса публикации."
      />

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Статус</p>
        <AdminFilterBar
          basePath="/admin/opportunities"
          param="status"
          current={status}
          allLabel="Все"
          preserve={{ verification: verificationStatus }}
          options={OPPORTUNITY_STATUSES.map((item) => ({
            value: item,
            label: opportunityStatusLabels[item],
          }))}
        />
        <p className="pt-2 text-xs uppercase tracking-[0.16em] text-muted">
          Проверка
        </p>
        <AdminFilterBar
          basePath="/admin/opportunities"
          param="verification"
          current={verificationStatus}
          allLabel="Все"
          preserve={{ status }}
          options={VERIFICATION_STATUSES.map((item) => ({
            value: item,
            label: verificationStatusLabels[item],
          }))}
        />
      </div>

      <AdminTable
        rows={opportunities}
        rowKey={(row) => row.id}
        emptyText="Возможности не найдены."
        columns={[
          {
            key: "title",
            header: "Возможность",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted">
                  {opportunityTypeLabels[row.type as OpportunityType] ??
                    row.type}{" "}
                  · {row.ownerName || "Владелец"} · {row.region}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Статус",
            cell: (row) => (
              <StatusBadge
                label={opportunityStatusLabels[row.status]}
                tone={publishStatusTone(row.status)}
              />
            ),
          },
          {
            key: "verification",
            header: "Проверка",
            cell: (row) => (
              <StatusBadge
                label={verificationStatusLabels[row.verificationStatus]}
                tone={verificationStatusTone(row.verificationStatus)}
              />
            ),
          },
          {
            key: "moderate",
            header: "Модерация",
            cell: (row) => (
              <ModerationForm
                action={adminUpdateOpportunityModerationAction}
                id={row.id}
                status={row.status}
                verificationStatus={row.verificationStatus}
                statusOptions={OPPORTUNITY_STATUSES.map((item) => ({
                  value: item,
                  label: opportunityStatusLabels[item],
                }))}
              />
            ),
          },
          {
            key: "link",
            header: "",
            cell: (row) => (
              <ButtonLink
                href={`/opportunity/${row.id}`}
                size="sm"
                variant="outline"
              >
                Сайт
              </ButtonLink>
            ),
          },
        ]}
      />
    </div>
  );
}
