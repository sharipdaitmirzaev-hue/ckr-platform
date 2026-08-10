import { listReports } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Отчёты Лии" };

export default async function LiaOiReportsPage() {
  const reports = listReports();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Отчёты</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-muted">Отчётов пока нет.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-sm border border-border bg-surface p-4"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {r.kind} · stub
              </p>
              <h3 className="mt-2 font-display text-lg text-foreground">
                {r.title}
              </h3>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">
                {r.body}
              </pre>
              {r.candidateIds[0] ? (
                <Link
                  href={`/admin/owner/lia/opportunities/${r.candidateIds[0]}`}
                  className="mt-3 inline-block text-sm text-accent hover:underline"
                >
                  Открыть первую карточку
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
