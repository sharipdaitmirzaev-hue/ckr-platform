import {
  StatusBadge,
  verificationStatusTone,
} from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ASSIGNABLE_ROLES, roleLabels } from "@/config/roles";
import { verificationStatusLabels } from "@/config/verification";
import {
  adminSetUserBlockedAction,
  adminUpdateUserRolesAction,
} from "@/features/admin/actions";
import { getAdminUser } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type UserPageProps = {
  params: { id: string };
};

export const metadata: Metadata = { title: "Админ — Профиль пользователя" };

export default async function AdminUserDetailPage({ params }: UserPageProps) {
  const admin = await requireAdmin();
  const user = await getAdminUser(params.id);
  if (!user) notFound();

  const isSelf = admin.user.id === user.id;
  const manageRoles = [...ASSIGNABLE_ROLES, "admin"] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Пользователь"
          title={user.fullName || "Участник ЦКР"}
          description="Просмотр профиля, управление ролями и доступом."
        />
        <ButtonLink href="/admin/users" variant="outline">
          К списку
        </ButtonLink>
      </div>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={verificationStatusLabels[user.verificationStatus]}
            tone={verificationStatusTone(user.verificationStatus)}
          />
          {user.isBlocked ? (
            <StatusBadge label="Заблокирован" tone="danger" />
          ) : (
            <StatusBadge label="Активен" tone="success" />
          )}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Компания</dt>
            <dd className="mt-1 text-foreground">{user.companyName || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Телефон</dt>
            <dd className="mt-1 text-foreground">{user.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Город</dt>
            <dd className="mt-1 text-foreground">{user.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Регион</dt>
            <dd className="mt-1 text-foreground">{user.region || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Создан</dt>
            <dd className="mt-1 text-foreground">
              {new Date(user.createdAt).toLocaleString("ru-RU")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-muted">
              {user.id}
            </dd>
          </div>
        </dl>
      </Card>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-lg text-foreground">Роли</h2>
        <form action={adminUpdateUserRolesAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            {manageRoles.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer gap-3 rounded-sm border border-border px-3 py-3 has-[:checked]:border-accent/50 has-[:checked]:bg-accent-muted"
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  defaultChecked={user.roles.includes(role)}
                  className="mt-1 accent-[var(--ckr-accent)]"
                />
                <span className="text-sm text-foreground">
                  {roleLabels[role]}
                </span>
              </label>
            ))}
          </div>
          <Button type="submit">Сохранить роли</Button>
        </form>
      </Card>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-lg text-foreground">Блокировка</h2>
        {isSelf ? (
          <p className="text-sm text-muted">
            Нельзя заблокировать собственный аккаунт администратора.
          </p>
        ) : (
          <form action={adminSetUserBlockedAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="hidden"
              name="blocked"
              value={user.isBlocked ? "false" : "true"}
            />
            <Button
              type="submit"
              variant={user.isBlocked ? "outline" : "primary"}
            >
              {user.isBlocked ? "Разблокировать" : "Заблокировать"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
