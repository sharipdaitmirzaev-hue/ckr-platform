import { listHypotheses, getCandidate } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Гипотезы Лии" };

export default async function LiaOiHypothesesPage() {
  const items = listHypotheses();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Гипотезы Лии</h2>
      <p className="text-sm text-muted">
        Этап 1: простые гипотезы из нескольких stub-сигналов. Полный Synthesis
        Engine — этап 4.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Гипотез пока нет.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((h) => (
            <li
              key={h.id}
              className="rounded-sm border border-border bg-surface p-4"
            >
              <p className="font-display text-lg text-foreground">{h.title}</p>
              <p className="mt-2 text-sm text-muted">{h.summary}</p>
              {h.investmentScale ? (
                <p className="mt-2 text-sm text-foreground">
                  Масштаб: {h.investmentScale}
                </p>
              ) : null}
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                Чего не хватает
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                {h.missingPieces.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {h.supportingCandidateIds.map((id) => {
                  const c = getCandidate(id);
                  return c ? (
                    <Link
                      key={id}
                      href={`/admin/owner/lia/opportunities/${id}`}
                      className="text-accent hover:underline"
                    >
                      {c.title.replace(/^\[STUB\]\s*/, "").slice(0, 40)}…
                    </Link>
                  ) : null;
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
