import { StatsCard } from "@/components/admin/stats-card";
import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import {
  getRecommendedCandidates,
  getTodayStats,
} from "@/lib/lia/oi/pipeline";
import { listHypotheses } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Лия — Центр возможностей" };

export default async function LiaOiOverviewPage() {
  const stats = await getTodayStats();
  const recommended = await getRecommendedCandidates(5);
  const hypotheses = await listHypotheses();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Лия сегодня</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Сигналов просмотрено (stub)" value={stats.signalsScanned} />
          <StatsCard label="Новых после dedup" value={stats.newAfterDedup} />
          <StatsCard label="Проанализировано" value={stats.analyzed} />
          <StatsCard label="Заслуживают внимания" value={stats.worthAttention} />
          <StatsCard label="Высокий приоритет" value={stats.highPriority} />
          <StatsCard label="Новых гипотез" value={stats.newHypotheses} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl text-foreground">
            Лия рекомендует посмотреть
          </h2>
          <Link
            href="/admin/owner/lia/opportunities"
            className="text-sm text-accent hover:underline"
          >
            Вся лента
          </Link>
        </div>
        <div className="space-y-3">
          {recommended.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl text-foreground">Гипотезы Лии</h2>
          <Link
            href="/admin/owner/lia/hypotheses"
            className="text-sm text-accent hover:underline"
          >
            Все гипотезы
          </Link>
        </div>
        {hypotheses.length === 0 ? (
          <p className="text-sm text-muted">Пока нет гипотез для текущего seed.</p>
        ) : (
          <ul className="space-y-3">
            {hypotheses.slice(0, 2).map((h) => (
              <li
                key={h.id}
                className="rounded-sm border border-border bg-surface p-4"
              >
                <p className="font-medium text-foreground">{h.title}</p>
                <p className="mt-2 text-sm text-muted">{h.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">
        Нужен новый поиск? Откройте{" "}
        <Link href="/admin/owner/lia/search" className="text-accent hover:underline">
          Поиск
        </Link>
        .
      </p>
    </div>
  );
}
