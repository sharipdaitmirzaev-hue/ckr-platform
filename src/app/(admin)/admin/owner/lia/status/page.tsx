import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { getTodayStats } from "@/lib/lia/oi/pipeline";
import { getSourceHealthSnapshot } from "@/lib/lia/oi/sources/registry";
import {
  describeOiStoreMode,
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
  const today = await getTodayStats();
  const storeMode = describeOiStoreMode();
  const [candidates, reports, assignments, searches, sourceHealth] =
    await Promise.all([
      listCandidates(),
      listReports(),
      listAssignments(),
      listSearchRequests(),
      getSourceHealthSnapshot(),
    ]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-foreground">
        Состояние разведки
      </h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Режим поиска</dt>
          <dd className="mt-1 text-foreground">{mode.bannerTitle}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Провайдер</dt>
          <dd className="mt-1 text-foreground">
            {provider.id} · {provider.mode} · {provider.label}
          </dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Persistence store</dt>
          <dd className="mt-1 text-foreground">{storeMode.label}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Карточек в store</dt>
          <dd className="mt-1 text-foreground">{candidates.length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Отчётов</dt>
          <dd className="mt-1 text-foreground">{reports.length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Поручений</dt>
          <dd className="mt-1 text-foreground">{assignments.length}</dd>
        </div>
        <div className="rounded-sm border border-border p-4">
          <dt className="text-muted">Поисковых запросов</dt>
          <dd className="mt-1 text-foreground">{searches.length}</dd>
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
      <section className="rounded-sm border border-border p-4 text-sm">
        <p className="text-foreground">Состояние источников (Stage 2C)</p>
        <ul className="mt-2 space-y-1 text-muted">
          <li>
            Serper general · {mode.liveAvailable ? "OK/LIVE-ready" : "stub/key missing"}
          </li>
          {sourceHealth.map((h) => (
            <li key={h.id}>
              {h.label}: {h.health}
              {h.official ? " · официальный" : ""}
            </li>
          ))}
        </ul>
      </section>
      <div className="rounded-sm border border-border p-4 text-sm text-muted">
        <p className="text-foreground">Лимиты / quota</p>
        <pre className="mt-2 whitespace-pre-wrap">
          {JSON.stringify(LIA_OI_BUDGETS, null, 2)}
        </pre>
        <p className="mt-3">
          Stage 2B: store layer готов (memory|supabase). SQL migrations
          подготовлены, но не применены к production без отдельного
          подтверждения. Matching / Synthesis / Scheduler — позже.
        </p>
      </div>
    </div>
  );
}
