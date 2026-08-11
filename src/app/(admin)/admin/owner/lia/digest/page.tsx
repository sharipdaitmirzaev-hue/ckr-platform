import {
  buildDigestReport,
} from "@/lib/lia/oi/pipeline";
import { addReport, listCandidates, listReports } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Дайджест Лии" };

export default async function LiaOiDigestPage() {
  let digest = (await listReports()).find((r) => r.kind === "daily_digest");
  if (!digest) {
    digest = buildDigestReport(await listCandidates());
    await addReport(digest);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Ежедневный дайджест</h2>
      <article className="rounded-sm border border-border bg-surface p-5">
        <h3 className="font-display text-lg text-foreground">{digest.title}</h3>
        <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {digest.body}
        </pre>
      </article>
    </div>
  );
}
