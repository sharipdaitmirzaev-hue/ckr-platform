import { listHypotheses, getCandidate } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Гипотезы Лии" };

export default async function LiaOiHypothesesPage() {
  const items = await listHypotheses();
  const supportLinks = await Promise.all(
    items.map(async (h) => {
      const links = await Promise.all(
        h.supportingCandidateIds.map(async (id) => {
          const c = await getCandidate(id);
          return c
            ? {
                id,
                title: c.title.replace(/^\[STUB\]\s*/, "").slice(0, 40),
              }
            : null;
        }),
      );
      return { hypId: h.id, links: links.filter(Boolean) as { id: string; title: string }[] };
    }),
  );
  const byHyp = new Map(supportLinks.map((x) => [x.hypId, x.links]));

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Гипотезы Лии</h2>
      <p className="text-sm text-muted">
        Простые гипотезы из нескольких сигналов. Полный Synthesis Engine —
        отдельный этап.
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
                {(byHyp.get(h.id) ?? []).map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/owner/lia/opportunities/${c.id}`}
                    className="text-accent hover:underline"
                  >
                    {c.title}…
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
