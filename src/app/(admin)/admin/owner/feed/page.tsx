import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import { allIntentMappings } from "@/lib/personalized-feed/mapping";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Feed v1 · диагностика" };
export const dynamic = "force-dynamic";

export default async function OwnerFeedDiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; need?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name")
    .order("created_at", { ascending: true })
    .limit(20);

  const ownerId = sp.user || profiles?.[0]?.id || "";
  const mappings = allIntentMappings();

  let diagnostics = null as Awaited<
    ReturnType<
      ReturnType<typeof getPersonalizedFeedService>["getOwnerDiagnostics"]
    >
  > | null;
  let error: string | null = null;
  if (ownerId) {
    try {
      const svc = getPersonalizedFeedService("supabase");
      diagnostics = await svc.getOwnerDiagnostics({
        ownerId,
        needProfileId: sp.need || null,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "error";
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Владелец"
        title="Feed v1 · диагностика"
        description="Качество персональной ленты до Matching Engine. LIA OI / Graph OWNER_ONLY в user Feed не показываются."
      />

      <p className="text-sm text-muted">
        <Link href="/admin/owner" className="text-accent hover:underline">
          ← Кабинет владельца
        </Link>
      </p>

      <section className="space-y-2">
        <p className="text-sm text-muted">Пользователь</p>
        <div className="flex flex-wrap gap-2">
          {(profiles || []).map((p) => (
            <Link
              key={p.id}
              href={`/admin/owner/feed?user=${p.id}`}
              className={`rounded-sm border px-2 py-1 text-xs ${
                ownerId === p.id
                  ? "border-accent text-accent"
                  : "border-border text-foreground"
              }`}
            >
              {p.full_name || p.id.slice(0, 8)}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xl">Intent coverage</h3>
        <div className="flex flex-wrap gap-2">
          {mappings.map((m) => (
            <Badge key={m.intentType}>
              {m.intentType}: {m.coverage}
            </Badge>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {diagnostics ? (
        <section className="space-y-4">
          <h3 className="font-display text-xl">Метрики</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["candidates", diagnostics.candidateCount],
              ["filtered", diagnostics.filteredCount],
              ["recommended", diagnostics.recommendedCount],
              ["dedup", diagnostics.dedupCount],
              ["unknown_price", diagnostics.unknownPriceCount],
              ["unknown_region", diagnostics.unknownRegionCount],
              ["internal", diagnostics.internalCount],
              ["external", diagnostics.externalCount],
            ].map(([k, v]) => (
              <div key={String(k)} className="border-b border-border py-2">
                <p className="text-xs text-muted">{k}</p>
                <p className="text-2xl text-foreground">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">
            score avg {diagnostics.scoreDistribution.avg} (min{" "}
            {diagnostics.scoreDistribution.min} / max{" "}
            {diagnostics.scoreDistribution.max})
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted">
            {JSON.stringify(diagnostics.scoreDistribution.buckets, null, 2)}
          </pre>

          <h3 className="font-display text-xl">Top recommendations</h3>
          <ul className="space-y-4">
            {diagnostics.top.map((t, i) => (
              <li key={`${t.title}-${i}`} className="space-y-1 border-b border-border pb-3">
                <p className="text-sm text-foreground">
                  {t.title} · {t.sourceLabel} · score {t.score}
                </p>
                <p className="text-xs text-muted">{t.explanation.why}</p>
                <pre className="text-xs text-muted">
                  {JSON.stringify(t.breakdown, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
