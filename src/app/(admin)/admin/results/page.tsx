import { OutcomeChart } from "@/components/outcomes/outcome-chart";
import { ProjectOutcomeTable } from "@/components/outcomes/project-outcome-table";
import { ResultsCard } from "@/components/outcomes/results-card";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getCkrEfficiencyMetrics,
  listAllProjectResults,
} from "@/lib/outcomes/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Результаты ЦКР" };

export const dynamic = "force-dynamic";

function formatDays(value: number | null) {
  if (value === null) return "—";
  return `${value} дн.`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)} ₽`;
}

export default async function AdminResultsPage() {
  const [efficiency, results] = await Promise.all([
    getCkrEfficiencyMetrics(),
    listAllProjectResults(80),
  ]);

  const overviewChart = [
    { label: "Создано", value: efficiency.projectsCreated },
    { label: "Активные", value: efficiency.projectsActive },
    { label: "Завершено", value: efficiency.projectsCompleted },
    { label: "Сделки", value: efficiency.dealsCount },
    { label: "Партнёры", value: efficiency.partnersCount },
  ];

  const efficiencyChart = [
    {
      label: "Roadmap %",
      value: efficiency.avgRoadmapCompletionPercent,
    },
    {
      label: "Этапы %",
      value: efficiency.avgMilestonesCompletedPercent,
    },
    {
      label: "Успешность %",
      value: efficiency.projectSuccessRate,
    },
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Результаты ЦКР"
        title="Эффективность сопровождения"
        description="Измерение итогов проектов и качества работы ЦКР: KPI, сделки, roadmap и фактические результаты."
      />

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Общие показатели
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ResultsCard
            label="Проектов создано"
            value={efficiency.projectsCreated}
            href="/admin/projects"
          />
          <ResultsCard
            label="Проектов завершено"
            value={efficiency.projectsCompleted}
          />
          <ResultsCard
            label="Активных проектов"
            value={efficiency.projectsActive}
          />
          <ResultsCard label="Сделок" value={efficiency.dealsCount} />
          <ResultsCard
            label="Инвестиции / суммы сделок"
            value={formatMoney(efficiency.investmentSum)}
            hint="Сумма amount по сделкам"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Эффективность</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResultsCard
            label="Среднее время сопровождения"
            value={formatDays(efficiency.avgAccompanimentDays)}
            hint="От создания до последнего обновления"
          />
          <ResultsCard
            label="Время до первой сделки"
            value={formatDays(efficiency.avgDaysToFirstDeal)}
          />
          <ResultsCard
            label="Выполнение roadmap"
            value={`${efficiency.avgRoadmapCompletionPercent}%`}
          />
          <ResultsCard
            label="Успешность проектов"
            value={`${efficiency.projectSuccessRate}%`}
            hint="Доля completed среди завершённых/архивных"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ResultsCard
            label="Партнёров (active)"
            value={efficiency.partnersCount}
            href="/partner"
          />
          <ResultsCard
            label="Идея → запуск"
            value={formatDays(efficiency.avgDaysIdeaToLaunch)}
            hint="Среднее по active/completed"
          />
          <ResultsCard
            label="Прогресс этапов (milestones)"
            value={`${efficiency.avgMilestonesCompletedPercent}%`}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="p-5">
          <OutcomeChart title="Обзор портфеля" items={overviewChart} />
        </Card>
        <Card variant="surface" className="p-5">
          <OutcomeChart title="Эффективность (%)" items={efficiencyChart} />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Результаты проектов
        </h2>
        <Card variant="surface" className="p-5">
          <ProjectOutcomeTable rows={results} />
        </Card>
      </section>
    </div>
  );
}
