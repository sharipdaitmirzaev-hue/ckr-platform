import { LiaWidget } from "@/components/lia/lia-widget";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { roleLabels } from "@/config/roles";
import { getCurrentUser } from "@/lib/auth/get-current-user";
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

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Кабинет"
        title={user.fullName ? `Здравствуйте, ${user.fullName}` : "Обзор"}
        description="Профиль, проекты и возможности уже доступны. Следующие модули — решения, заявки и инвестиции."
      />

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
              {profile.phone ? (
                <div className="flex gap-2">
                  <dt className="text-muted">Телефон:</dt>
                  <dd className="text-foreground">{profile.phone}</dd>
                </div>
              ) : null}
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
              ready: true,
            },
            {
              title: "Мои возможности",
              text: "Ресурсы для реализации проектов.",
              href: "/dashboard/opportunities",
              ready: true,
            },
            {
              title: "Заявки",
              text: "Появится вместе с модулями сделок.",
              ready: false,
            },
            {
              title: "Документы",
              text: "Supabase Storage — позже.",
              ready: false,
            },
          ] as const
        ).map((block) => (
          <Card key={block.title} variant="surface">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg text-foreground">
                {block.title}
              </h2>
              {block.ready ? null : <Badge variant="soft">Скоро</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted">{block.text}</p>
            {"href" in block ? (
              <div className="mt-4">
                <ButtonLink href={block.href} variant="outline" size="sm">
                  Открыть
                </ButtonLink>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <LiaWidget compact />
    </div>
  );
}
