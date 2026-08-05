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
  PROJECT_STATUSES,
  projectStatusLabels,
} from "@/config/projects";
import {
  VERIFICATION_STATUSES,
  verificationStatusLabels,
} from "@/config/verification";
import { adminUpdateProjectModerationAction } from "@/features/admin/actions";
import { ModerationForm } from "@/features/admin/components/moderation-form";
import { listAdminProjects } from "@/lib/admin/queries";
import type { ProjectStatus, VerificationStatus } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Проекты" };

type ProjectsPageProps = {
  searchParams?: { status?: string; verification?: string };
};

export default async function AdminProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const status = PROJECT_STATUSES.includes(
    searchParams?.status as ProjectStatus,
  )
    ? (searchParams?.status as ProjectStatus)
    : null;
  const verificationStatus = VERIFICATION_STATUSES.includes(
    searchParams?.verification as VerificationStatus,
  )
    ? (searchParams?.verification as VerificationStatus)
    : null;

  const projects = await listAdminProjects({ status, verificationStatus });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Проекты"
        description="Список, фильтры, изменение статуса публикации и проверка."
      />

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Статус</p>
        <AdminFilterBar
          basePath="/admin/projects"
          param="status"
          current={status}
          allLabel="Все"
          preserve={{ verification: verificationStatus }}
          options={PROJECT_STATUSES.map((item) => ({
            value: item,
            label: projectStatusLabels[item],
          }))}
        />
        <p className="pt-2 text-xs uppercase tracking-[0.16em] text-muted">
          Проверка
        </p>
        <AdminFilterBar
          basePath="/admin/projects"
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
        rows={projects}
        rowKey={(row) => row.id}
        emptyText="Проекты не найдены."
        columns={[
          {
            key: "title",
            header: "Проект",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted">
                  {row.ownerName || "Владелец"} · {row.region}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Статус",
            cell: (row) => (
              <StatusBadge
                label={projectStatusLabels[row.status]}
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
                action={adminUpdateProjectModerationAction}
                id={row.id}
                status={row.status}
                verificationStatus={row.verificationStatus}
                statusOptions={PROJECT_STATUSES.map((item) => ({
                  value: item,
                  label: projectStatusLabels[item],
                }))}
              />
            ),
          },
          {
            key: "link",
            header: "",
            cell: (row) => (
              <ButtonLink
                href={`/project/${row.id}`}
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
