import { ActivityFeed } from "@/components/activity/activity-feed";
import { LiaRecommendations } from "@/components/lia/lia-recommendations";
import { LiaWidget } from "@/components/lia/lia-widget";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { roleLabels } from "@/config/roles";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listActivityFeed } from "@/lib/activity/queries";
import { buildLiaRecommendations } from "@/lib/lia/recommendations";
import { countUnreadNotifications } from "@/lib/notifications/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Личный кабинет",
};

export default async function DashboardPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login");
  }

  const { user, profile } = current;
  const [recommendations, activity, unread] = await Promise.all([
    buildLiaRecommendations(user.id),
    listActivityFeed(user.id, 6),
    countUnreadNotifications(user.id),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title={user.fullName ? `Здравствуйте, ${user.fullName}` : "Обзор"}
        description="Профиль, проекты, коммуникации и рекомендации Лии — в одном месте."
      />

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/dashboard/notifications" variant="outline" size="sm">
          Уведомления{unread > 0 ? ` (${unread})` : ""}
        </ButtonLink>
        <ButtonLink href="/messages" variant="outline" size="sm">
          Сообщения
        </ButtonLink>
        <ButtonLink href="/dashboard/activity" variant="outline" size="sm">
          Активность
        </ButtonLink>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LiaRecommendations items={recommendations} />
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-foreground">
              Недавняя активность
            </h2>
            <ButtonLink href="/dashboard/activity" variant="outline" size="sm">
              Вся лента
            </ButtonLink>
          </div>
          <ActivityFeed items={activity} />
        </Card>
      </div>

      <Card variant="surface">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg text-foreground">Профиль</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted">Email:</dt>
                <dd className="text-foreground">{user.email}</dd>
              </div>
              {profile.company_name ? (
                <div className="flex gap-2">
                  <dt className="text-muted">Компания:</dt>
                  <dd className="text-foreground">{profile.company_name}</dd>
                </div>
              ) : null}
              {profile.city || profile.region ? (
                <div className="flex gap-2">
                  <dt className="text-muted">Локация:</dt>
                  <dd className="text-foreground">
                    {[profile.city, profile.region].filter(Boolean).join(", ")}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <dt className="text-muted">Проверка:</dt>
                <dd>
                  <VerificationBadge
                    status={profile.verification_status ?? "unverified"}
                  />
                </dd>
              </div>
            </dl>
          </div>
          <ButtonLink href="/onboarding" variant="outline" size="sm">
            Редактировать
          </ButtonLink>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Роли</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role} variant="accent">
                  {roleLabels[role]}
                </Badge>
              ))
            ) : (
              <Badge variant="soft">Роль не выбрана</Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            {
              title: "Мои проекты",
              text: "Управление проектами — ядром платформы.",
              href: "/dashboard/projects",
            },
            {
              title: "Заявки",
              text: "Входящие и исходящие взаимодействия.",
              href: "/dashboard/applications",
            },
            {
              title: "Сообщения",
              text: "Диалоги после принятия заявок.",
              href: "/messages",
            },
            {
              title: "Документы",
              text: "Файлы и проверка ЦКР.",
              href: "/dashboard/documents",
            },
          ] as const
        ).map((block) => (
          <Card key={block.title} variant="surface">
            <h2 className="font-display text-lg text-foreground">
              {block.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{block.text}</p>
            <div className="mt-4">
              <ButtonLink href={block.href} variant="outline" size="sm">
                Открыть
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>

      <LiaWidget embedded compact />
    </div>
  );
}
