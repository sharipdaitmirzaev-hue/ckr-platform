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
  EXPERT_STATUSES,
  expertSpecializationLabels,
  expertStatusLabels,
} from "@/config/experts";
import {
  VERIFICATION_STATUSES,
  verificationStatusLabels,
} from "@/config/verification";
import { adminUpdateExpertModerationAction } from "@/features/admin/actions";
import { ModerationForm } from "@/features/admin/components/moderation-form";
import { listAdminExperts } from "@/lib/admin/queries";
import type {
  ExpertProfileStatus,
  ExpertSpecialization,
  VerificationStatus,
} from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Эксперты" };

type ExpertsPageProps = {
  searchParams?: { status?: string; verification?: string };
};

export default async function AdminExpertsPage({
  searchParams,
}: ExpertsPageProps) {
  const status = EXPERT_STATUSES.includes(
    searchParams?.status as ExpertProfileStatus,
  )
    ? (searchParams?.status as ExpertProfileStatus)
    : null;
  const verificationStatus = VERIFICATION_STATUSES.includes(
    searchParams?.verification as VerificationStatus,
  )
    ? (searchParams?.verification as VerificationStatus)
    : null;

  const experts = await listAdminExperts({ status, verificationStatus });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Эксперты"
        description="Проверка экспертных профилей и статус публикации в каталоге."
      />

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Статус</p>
        <AdminFilterBar
          basePath="/admin/experts"
          param="status"
          current={status}
          allLabel="Все"
          preserve={{ verification: verificationStatus }}
          options={EXPERT_STATUSES.map((item) => ({
            value: item,
            label: expertStatusLabels[item],
          }))}
        />
        <p className="pt-2 text-xs uppercase tracking-[0.16em] text-muted">
          Проверка
        </p>
        <AdminFilterBar
          basePath="/admin/experts"
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
        rows={experts}
        rowKey={(row) => row.id}
        emptyText="Профили экспертов не найдены."
        columns={[
          {
            key: "expert",
            header: "Эксперт",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">
                  {row.fullName || "Эксперт ЦКР"}
                </p>
                <p className="text-xs text-muted">
                  {row.headline || "—"} ·{" "}
                  {expertSpecializationLabels[
                    row.specialization as ExpertSpecialization
                  ] ?? row.specialization}{" "}
                  · {row.region}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Статус",
            cell: (row) => (
              <StatusBadge
                label={expertStatusLabels[row.status]}
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
                action={adminUpdateExpertModerationAction}
                id={row.id}
                status={row.status}
                verificationStatus={row.verificationStatus}
                statusOptions={EXPERT_STATUSES.map((item) => ({
                  value: item,
                  label: expertStatusLabels[item],
                }))}
              />
            ),
          },
          {
            key: "link",
            header: "",
            cell: (row) => (
              <ButtonLink href={`/expert/${row.id}`} size="sm" variant="outline">
                Сайт
              </ButtonLink>
            ),
          },
        ]}
      />
    </div>
  );
}
