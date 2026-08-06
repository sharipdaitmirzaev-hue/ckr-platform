import {
  AdminTable,
  type AdminTableColumn,
} from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  canManageOrganization,
  organizationMemberRoleLabels,
} from "@/config/partners";
import { updateMemberRoleAction } from "@/features/partners/actions";
import { AddMemberForm } from "@/features/partners/components/add-member-form";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import { listOrganizationMembers } from "@/lib/partners/queries";
import type { OrganizationMember } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сотрудники организации",
};

export const dynamic = "force-dynamic";

export default async function PartnerMembersPage() {
  const session = await requirePartnerMembership();
  const members = await listOrganizationMembers(
    session.primary.organization.id,
  );
  const canManage = canManageOrganization(session.primary.role);

  const columns: AdminTableColumn<OrganizationMember>[] = [
    {
      key: "name",
      header: "Участник",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.fullName || "Участник ЦКР"}</p>
          <p className="font-mono text-xs text-muted">{row.userId}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Роль",
      cell: (row) =>
        row.role === "owner" || !canManage ? (
          organizationMemberRoleLabels[row.role]
        ) : (
          <form
            action={updateMemberRoleAction}
            className="flex items-center gap-2"
          >
            <input type="hidden" name="memberId" value={row.id} />
            <select
              name="role"
              defaultValue={row.role}
              className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
            >
              <option value="manager">
                {organizationMemberRoleLabels.manager}
              </option>
              <option value="employee">
                {organizationMemberRoleLabels.employee}
              </option>
            </select>
            <Button type="submit" size="sm" variant="ghost">
              OK
            </Button>
          </form>
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Организация"
        title="Сотрудники"
        description="Роли: owner, manager, employee."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Добавить сотрудника
          </h2>
          {canManage ? (
            <AddMemberForm />
          ) : (
            <p className="text-sm text-muted">
              Добавление доступно владельцу и менеджеру.
            </p>
          )}
        </Card>
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Команда</h2>
          {members.length === 0 ? (
            <EmptyState
              title="Сотрудников нет"
              description="Добавьте участников организации."
            />
          ) : (
            <AdminTable
              columns={columns}
              rows={members}
              rowKey={(row) => row.id}
            />
          )}
        </div>
      </section>
    </div>
  );
}
