import { StatsCard } from "@/components/admin/stats-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAdminStats } from "@/lib/admin/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Обзор" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Оператор"
        title="Обзор платформы"
        description="Сводка по участникам, объектам и очереди проверки ЦКР."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          label="Пользователи"
          value={stats.users}
          href="/admin/users"
          hint="Профили участников"
        />
        <StatsCard
          label="Проекты"
          value={stats.projects}
          href="/admin/projects"
          hint="Все статусы публикации"
        />
        <StatsCard
          label="Возможности"
          value={stats.opportunities}
          href="/admin/opportunities"
        />
        <StatsCard
          label="Инвестиции"
          value={stats.investments}
          href="/admin/investments"
          hint="Инвестиционные предложения"
        />
        <StatsCard
          label="Заявки"
          value={stats.applications}
          href="/dashboard/applications"
          hint="Взаимодействия участников"
        />
        <StatsCard
          label="Документы на проверке"
          value={stats.documentsPending}
          href="/admin/verifications"
          hint={`Заявок на верификацию: ${stats.verificationsPending}`}
        />
      </div>
    </div>
  );
}
