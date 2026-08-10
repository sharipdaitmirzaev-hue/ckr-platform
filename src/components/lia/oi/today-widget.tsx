import { StatsCard } from "@/components/admin/stats-card";
import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import { LiaOiStubBanner } from "@/components/lia/oi/stub-banner";
import type { LiaOiCandidate, LiaOiTodayStats } from "@/types/lia-oi";
import Link from "next/link";

export function LiaTodayWidget({
  stats,
  recommended,
}: {
  stats: LiaOiTodayStats;
  recommended: LiaOiCandidate[];
}) {
  return (
    <section className="space-y-4 rounded-sm border border-border bg-surface/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            Лия сегодня
          </p>
          <h3 className="mt-2 font-display text-2xl text-foreground">
            Что Лия нашла для ЦКР
          </h3>
        </div>
        <Link
          href="/admin/owner/lia"
          className="text-sm text-accent hover:underline"
        >
          Открыть Центр возможностей
        </Link>
      </div>

      <LiaOiStubBanner />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard label="Сигналов (stub)" value={stats.signalsScanned} />
        <StatsCard label="После dedup" value={stats.newAfterDedup} />
        <StatsCard label="Проанализировано" value={stats.analyzed} />
        <StatsCard label="Заслуживают внимания" value={stats.worthAttention} />
        <StatsCard label="Высокий приоритет" value={stats.highPriority} />
        <StatsCard label="Новых гипотез" value={stats.newHypotheses} />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Лия рекомендует посмотреть
        </p>
        {recommended.length === 0 ? (
          <p className="text-sm text-muted">
            Пока нет карточек. Запустите поиск в Центре возможностей.
          </p>
        ) : (
          recommended.slice(0, 3).map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))
        )}
      </div>
    </section>
  );
}
