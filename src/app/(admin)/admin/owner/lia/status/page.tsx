import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { getTodayStats } from "@/lib/lia/oi/pipeline";
import {
  listAssignments,
  listCandidates,
  listReports,
  listSearchRequests,
} from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Состояние разведки" };

export default async function LiaOiStatusPage() {
  const provider = getInternetSearchProvider();
  const mode = resolveOiSearchMode();
  const today = getTodayStats();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-foreground">
        Состояние разведки
      </h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Режим</dt>
          <dd className="mt-1 text-foreground">{mode.bannerTitle}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Провайдер</dt>
          <dd className="mt-1 text-foreground">
            {provider.id} · {provider.mode} · {provider.label}
          </dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Карточек в store</dt>
          <dd className="mt-1 text-foreground">{listCandidates().length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Отчётов</dt>
          <dd className="mt-1 text-foreground">{listReports().length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Поручений</dt>
          <dd className="mt-1 text-foreground">{listAssignments().length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Поисковых запросов</dt>
          <dd className="mt-1 text-foreground">{listSearchRequests().length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">High priority</dt>
          <dd className="mt-1 text-foreground">{today.highPriority}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">LIVE доступен</dt>
          <dd className="mt-1 text-foreground">
            {mode.liveAvailable ? "да" : "нет (нужен API key)"}
          </dd>
        </div>
      </dl>
      <div className="rounded-sm border border-border p-4 text-sm text-muted">
        <p className="text-foreground">Лимиты / quota (Stage 2A)</p>
        <pre className="mt-2 whitespace-pre-wrap">
          {JSON.stringify(LIA_OI_BUDGETS, null, 2)}
        </pre>
        <p className="mt-3">
          Persistence: in-memory. SQL Stage 1 не применяется (этап 2B). Matching /
          Synthesis / Scheduler — позже.
        </p>
      </div>
    </div>
  );
}
