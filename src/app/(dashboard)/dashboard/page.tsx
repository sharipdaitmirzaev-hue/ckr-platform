import { ActivityFeed } from "@/components/activity/activity-feed";
import { LiaRecommendations } from "@/components/lia/lia-recommendations";
import { LiaWidget } from "@/components/lia/lia-widget";
import { FirstActionHint } from "@/components/onboarding/first-action-hint";
import { FirstIntentPrompt } from "@/components/onboarding/first-intent-prompt";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { projectStatusLabels } from "@/config/projects";
import { ASSIGNABLE_ROLES, roleLabels, type AssignableRole } from "@/config/roles";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listActivityFeed } from "@/lib/activity/queries";
import { getDashboardOverview } from "@/lib/dashboard/overview";
import { buildLiaRecommendations } from "@/lib/lia/recommendations";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Metadata } from "next";
import Link from "next/link";
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
  const roles = current.roles.filter((role): role is AssignableRole =>
    (ASSIGNABLE_ROLES as readonly string[]).includes(role),
  );

  const [recommendations, activity, overview] = await Promise.all([
    buildLiaRecommendations(user.id),
    listActivityFeed(user.id, 6),
    getDashboardOverview(user.id),
  ]);

  let hasLia = false;
  let hasInterest = false;
  let hasExpertProfile = false;
  let hasOrganization = false;
  if (hasSupabaseEnv()) {
    const supabase = createClient();
    const [liaRes, interestRes, expertRes, orgRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("event_type", ["first_lia_use", "lia_used", "lia_started"]),
      supabase
        .from("investor_interests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("expert_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    hasLia = (liaRes.count ?? 0) > 0;
    hasInterest = (interestRes.count ?? 0) > 0;
    hasExpertProfile = (expertRes.count ?? 0) > 0;
    hasOrganization = (orgRes.count ?? 0) > 0;
  }

  const firstActionDone =
    (roles.includes("entrepreneur") && overview.projects.length > 0) ||
    (roles.includes("investor") && hasInterest) ||
    (roles.includes("expert") && hasExpertProfile) ||
    (roles.includes("company") && hasOrganization);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title={user.fullName ? `Здравствуйте, ${user.fullName}` : "Обзор"}
        description="Единый обзор: проекты, заявки, инвестиции, сделки, уведомления и рекомендации Лии."
      />

      <FirstIntentPrompt roles={roles} firstActionDone={firstActionDone} />

      <FirstActionHint
        roles={roles}
        hasProject={overview.projects.length > 0}
        hasLia={hasLia}
        hasInterest={hasInterest}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              label: "Проекты",
              value: overview.projects.length,
              href: "/dashboard/projects",
              hint: "последние",
            },
            {
              label: "Заявки",
              value:
                overview.applicationsIncoming + overview.applicationsOutgoing,
              href: "/dashboard/applications",
              hint: `${overview.applicationsIncoming} вх. · ${overview.applicationsOutgoing} исх.`,
            },
            {
              label: "Инвестиции",
              value: overview.investments,
              href: "/dashboard/investments",
              hint: "мои предложения",
            },
            {
              label: "Сделки",
              value: overview.deals,
              href: "/dashboard/projects",
              hint: "как участник",
            },
            {
              label: "Уведомления",
              value: overview.unreadNotifications,
              href: "/dashboard/notifications",
              hint: "непрочитанные",
            },
            {
              label: "Задачи",
              value: overview.openMilestones,
              href: "/dashboard/projects",
              hint: "открытые этапы",
            },
          ] as const
        ).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-sm border border-border bg-surface/60 px-4 py-3 transition-colors hover:border-accent/40"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {item.label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/dashboard/notifications" variant="outline" size="sm">
          Уведомления
          {overview.unreadNotifications > 0
            ? ` (${overview.unreadNotifications})`
            : ""}
        </ButtonLink>
        <ButtonLink href="/messages" variant="outline" size="sm">
          Сообщения
        </ButtonLink>
        <ButtonLink href="/dashboard/activity" variant="outline" size="sm">
          Активность
        </ButtonLink>
        <ButtonLink href="/lia" variant="outline" size="sm">
          Лия
        </ButtonLink>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-foreground">Мои проекты</h2>
          <ButtonLink href="/dashboard/projects" variant="outline" size="sm">
            Все проекты
          </ButtonLink>
        </div>
        {overview.projects.length === 0 ? (
          <EmptyState
            title="Проектов пока нет"
            description="Создайте проект или начните сценарий с Лией «Помоги создать бизнес-проект»."
            actionHref="/dashboard/projects/create"
            actionLabel="Создать проект"
          />
        ) : (
          <ul className="space-y-2">
            {overview.projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}/workspace`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-background/40 px-4 py-3 transition-colors hover:border-accent/40"
                >
                  <span className="font-medium text-foreground">
                    {project.title}
                  </span>
                  <Badge variant="soft">
                    {projectStatusLabels[project.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      <LiaWidget embedded compact />
    </div>
  );
}
