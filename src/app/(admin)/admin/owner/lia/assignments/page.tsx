import { liaOiAssignmentLabels } from "@/config/lia-oi";
import { listAssignments, getCandidate } from "@/lib/lia/oi/store";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Поручения Лии" };

export default async function LiaOiAssignmentsPage() {
  const items = listAssignments();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Мои поручения</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Поручений пока нет. Откройте карточку возможности и нажмите «Поручить
          Лии».
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const cand = getCandidate(a.candidateId);
            return (
              <li
                key={a.id}
                className="rounded-sm border border-border bg-surface p-4"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {liaOiAssignmentLabels[a.kind]} · {a.status}
                </p>
                <p className="mt-2 text-sm text-foreground">{a.instruction}</p>
                <p className="mt-2 text-sm text-muted">{a.resultSummary}</p>
                {cand ? (
                  <Link
                    href={`/admin/owner/lia/opportunities/${cand.id}`}
                    className="mt-3 inline-block text-sm text-accent hover:underline"
                  >
                    {cand.title}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
