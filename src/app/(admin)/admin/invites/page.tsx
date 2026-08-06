import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { betaInviteStatusLabels, type BetaInviteStatus } from "@/config/beta";
import {
  inviteSourceLabels,
  type InviteSource,
} from "@/config/first-users-wave";
import { roleLabels, type AssignableRole } from "@/config/roles";
import { CreateInviteForm } from "@/features/beta/components/create-invite-form";
import { InviteRowActions } from "@/features/beta/components/invite-row-actions";
import { listBetaInvites } from "@/lib/beta/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { BetaInvite } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Приглашения — Админ",
};

export const dynamic = "force-dynamic";

function inviteTone(status: BetaInviteStatus) {
  if (
    status === "completed" ||
    status === "activated" ||
    status === "active" ||
    status === "used"
  ) {
    return "success" as const;
  }
  if (status === "invited" || status === "sent") return "accent" as const;
  if (status === "disabled" || status === "expired") return "danger" as const;
  return "warning" as const;
}

const columns: AdminTableColumn<BetaInvite>[] = [
  {
    key: "email",
    header: "Email",
    cell: (invite) => invite.email,
  },
  {
    key: "code",
    header: "Код",
    cell: (invite) => (
      <span className="font-mono text-accent">{invite.code}</span>
    ),
  },
  {
    key: "role",
    header: "Роль",
    cell: (invite) =>
      roleLabels[invite.role as AssignableRole] ?? invite.role,
  },
  {
    key: "source",
    header: "Источник",
    cell: (invite) =>
      inviteSourceLabels[(invite.source as InviteSource) ?? "manual"] ??
      invite.source ??
      "manual",
  },
  {
    key: "status",
    header: "Статус",
    cell: (invite) => (
      <StatusBadge
        label={betaInviteStatusLabels[invite.status]}
        tone={inviteTone(invite.status)}
      />
    ),
  },
  {
    key: "dates",
    header: "Даты",
    cell: (invite) => (
      <div className="text-xs text-muted">
        <div>
          создано:{" "}
          {invite.createdAt
            ? new Date(invite.createdAt).toLocaleString("ru-RU")
            : "—"}
        </div>
        <div>
          использовано:{" "}
          {invite.usedAt
            ? new Date(invite.usedAt).toLocaleString("ru-RU")
            : "—"}
        </div>
      </div>
    ),
  },
  {
    key: "actions",
    header: "Действия",
    cell: (invite) => <InviteRowActions invite={invite} />,
  },
];

export default async function AdminInvitesPage() {
  const invites = await listBetaInvites();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="First Users Wave"
        title="Приглашения в ЦКР"
        description="Роль, источник и статус (invited → activated → active → completed | disabled). Дашборд волны: /admin/first-users."
      />
      <p className="text-sm">
        <Link href="/admin/first-users" className="text-accent hover:underline">
          First Users Dashboard →
        </Link>
      </p>

      {!hasSupabaseEnv() ? (
        <Card variant="surface" className="p-5 text-sm text-muted">
          Supabase не настроен — примените миграцию `beta_invites` и задайте env,
          чтобы управлять приглашениями.
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Новое приглашение
          </h2>
          <p className="text-sm text-muted">
            Код вида <span className="font-mono text-accent">CKR-XXXXXXXX</span>{" "}
            передаётся участнику. При регистрации с кодом роль берётся из
            приглашения.
          </p>
          <CreateInviteForm />
        </Card>

        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            Статусы приглашений
          </h2>
          {invites.length === 0 ? (
            <EmptyState
              title="Приглашений пока нет"
              description="Создайте первое приглашение слева."
            />
          ) : (
            <AdminTable
              columns={columns}
              rows={invites}
              rowKey={(invite) => invite.id}
            />
          )}
        </div>
      </section>
    </div>
  );
}
