import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import {
  getSearchRequest,
  listCandidatesForSearchRun,
} from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const req = await getSearchRequest(params.id);
  return { title: req ? `Поиск: ${req.query.slice(0, 60)}` : "Поиск Лии" };
}

export default async function LiaOiSearchRunPage({ params }: Props) {
  const req = await getSearchRequest(params.id);
  if (!req) notFound();
  const candidates = await listCandidatesForSearchRun(req.id);
  const stats = req.stats;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/owner/lia/search"
          className="text-sm text-accent hover:underline"
        >
          ← К поиску
        </Link>
        <h2 className="mt-4 font-display text-2xl text-foreground">
          {req.query}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {new Date(req.createdAt).toLocaleString("ru-RU")} ·{" "}
          {(req.searchMode ?? (req.stubMode ? "stub" : "live")).toUpperCase()}
          {req.providerLabel ? ` · ${req.providerLabel}` : ""}
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">Queries</dt>
          <dd className="text-foreground">{stats?.queriesRun ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Raw</dt>
          <dd className="text-foreground">{stats?.signalsRaw ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Filtered</dt>
          <dd className="text-foreground">{stats?.filteredOut ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Dedup</dt>
          <dd className="text-foreground">{stats?.afterDedup ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Analyzed</dt>
          <dd className="text-foreground">{stats?.analyzed ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">TOP / Rejected</dt>
          <dd className="text-foreground">
            {stats?.topOpportunities ?? "—"} / {stats?.rejected ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Provider errors</dt>
          <dd className="text-foreground">{stats?.providerErrors ?? 0}</dd>
        </div>
        <div>
          <dt className="text-muted">Duration</dt>
          <dd className="text-foreground">
            {req.durationMs != null ? `${req.durationMs} ms` : "—"}
          </dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h3 className="font-display text-lg text-foreground">Search Plan</h3>
        <p className="text-sm text-muted">
          intent={req.plan.intent} · budget_max=
          {req.plan.budgetMax
            ? `${Math.round(req.plan.budgetMax / 1_000_000)} млн ₽`
            : "—"}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {req.plan.queries.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-foreground">
          Результаты run ({candidates.length})
        </h3>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted">Нет сохранённых кандидатов.</p>
        ) : (
          candidates.map((c) => <OpportunityCard key={c.id} item={c} />)
        )}
      </section>
    </div>
  );
}
