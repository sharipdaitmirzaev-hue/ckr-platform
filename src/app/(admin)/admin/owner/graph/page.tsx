import { EdgeOwnerActions } from "@/components/business-graph/edge-owner-actions";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { loadStage3aFixtureScenario } from "@/lib/business-graph/fixtures/stage3a-scenario";
import { resolveBusinessGraphStoreMode } from "@/lib/business-graph/mode";
import {
  createMemoryBusinessGraphService,
  getBusinessGraphService,
  setBusinessGraphServiceForTests,
} from "@/lib/business-graph/service";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Business Graph" };

type SearchParams = Promise<{ q?: string; node?: string }>;

export default async function OwnerBusinessGraphPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireLiaOiOwner();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const nodeId = (sp.node || "").trim();

  let storeMode: "memory" | "supabase" = "memory";
  let usingFixture = false;

  try {
    storeMode = resolveBusinessGraphStoreMode();
  } catch {
    storeMode = "memory";
  }

  const svc =
    storeMode === "supabase"
      ? getBusinessGraphService("supabase")
      : getBusinessGraphService("memory");

  if (storeMode === "memory") {
    const existing = await svc.findNodes({ limit: 1 });
    if (existing.length === 0) {
      const seeded = await loadStage3aFixtureScenario(
        createMemoryBusinessGraphService(),
      );
      setBusinessGraphServiceForTests(seeded.service);
    }
    usingFixture = true;
  }

  const graph = getBusinessGraphService(storeMode === "supabase" ? "supabase" : "memory");

  const nodes = q
    ? await graph.findNodes({ q, limit: 40 })
    : await graph.findNodes({ limit: 40 });
  const selected =
    (nodeId ? await graph.getNode(nodeId) : null) || nodes[0] || null;
  const neighbors = selected ? await graph.getNeighbors(selected.id) : null;
  const aliases = selected ? await graph.listAliases(selected.id) : [];
  const history = selected ? await graph.getNodeHistory(selected.id) : [];
  const sources = selected ? await graph.listNodeSources(selected.id) : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Владелец · Business Graph
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Graph Viewer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Поиск узлов, карточка, связи, provenance и история. Matching Engine не
          активен. Store: <span className="text-foreground">{storeMode}</span>
          {usingFixture ? " · fixture scenario" : ""}.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/owner" className="text-accent hover:underline">
            ← Кабинет владельца
          </Link>
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск node…"
          className="min-w-[220px] flex-1 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Найти
        </button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <h2 className="font-display text-lg text-foreground">Узлы</h2>
          <ul className="space-y-1 text-sm">
            {nodes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/admin/owner/graph?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    node: n.id,
                  }).toString()}`}
                  className={
                    selected?.id === n.id
                      ? "font-medium text-accent"
                      : "text-foreground hover:underline"
                  }
                >
                  <span className="text-xs text-muted">{n.nodeType}</span>
                  <br />
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-6">
          {!selected ? (
            <p className="text-sm text-muted">Узел не выбран.</p>
          ) : (
            <>
              <div className="space-y-3 border-b border-border pb-6">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {selected.nodeType} · {selected.visibility} · {selected.status}
                </p>
                <h2 className="font-display text-2xl text-foreground">
                  {selected.title}
                </h2>
                <p className="text-sm text-muted">{selected.description}</p>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Источник</dt>
                    <dd>
                      {selected.sourceType || "—"} / {selected.sourceId || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Internal</dt>
                    <dd>
                      {selected.internalEntityType || "—"} /{" "}
                      {selected.internalEntityId || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Регион</dt>
                    <dd>
                      {[selected.country, selected.region, selected.city]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Data confidence</dt>
                    <dd>{selected.dataConfidence}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Data quality</dt>
                    <dd>{selected.dataQualityScore}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Attractiveness</dt>
                    <dd>{selected.opportunityAttractiveness ?? "—"}</dd>
                  </div>
                </dl>
                {aliases.length > 0 ? (
                  <p className="text-sm text-muted">
                    Aliases: {aliases.map((a) => a.alias).join("; ")}
                  </p>
                ) : null}
                {sources.length > 0 ? (
                  <ul className="text-sm text-muted">
                    {sources.map((s) => (
                      <li key={s.id}>
                        {s.sourceType}
                        {s.title ? ` — ${s.title}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl text-foreground">
                  Исходящие связи
                </h3>
                <EdgeList
                  items={neighbors?.outgoing || []}
                  direction="out"
                  q={q}
                  selectedNodeId={selected.id}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl text-foreground">
                  Входящие связи
                </h3>
                <EdgeList
                  items={neighbors?.incoming || []}
                  direction="in"
                  q={q}
                  selectedNodeId={selected.id}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-xl text-foreground">История</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-muted">Событий нет.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {history.map((e) => (
                      <li key={e.id} className="text-muted">
                        <span className="text-foreground">{e.eventType}</span>
                        {" · "}
                        {e.actorKind}
                        {" · "}
                        {e.createdAt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function EdgeList({
  items,
  direction,
  q,
  selectedNodeId,
}: {
  items: Array<{
    edge: {
      id: string;
      relationshipType: string;
      confidence: number;
      provenanceType: string;
      reasoningSummary: string;
      source?: string | null;
      createdByKind: string;
      createdAt: string;
      status: string;
      ownerComment?: string | null;
    };
    node: { id: string; title: string; nodeType: string };
  }>;
  direction: "in" | "out";
  q: string;
  selectedNodeId: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Нет связей.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map(({ edge, node }) => (
        <li
          key={edge.id}
          className="border-b border-border pb-3 text-sm last:border-0"
        >
          <p className="text-foreground">
            {direction === "out" ? "→" : "←"}{" "}
            <span className="font-medium">{edge.relationshipType}</span>{" "}
            <Link
              href={`/admin/owner/graph?${new URLSearchParams({
                ...(q ? { q } : {}),
                node: node.id,
              }).toString()}`}
              className="text-accent hover:underline"
            >
              [{node.nodeType}] {node.title}
            </Link>
          </p>
          <p className="mt-1 text-muted">
            confidence {edge.confidence} · {edge.provenanceType} ·{" "}
            {edge.status} · {edge.createdByKind}
          </p>
          {edge.reasoningSummary ? (
            <p className="mt-1 text-muted">{edge.reasoningSummary}</p>
          ) : null}
          {edge.ownerComment ? (
            <p className="mt-1 text-xs text-foreground">
              Owner: {edge.ownerComment}
            </p>
          ) : null}
          {edge.source ? (
            <p className="mt-1 text-xs text-muted">source: {edge.source}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{edge.createdAt}</p>
          <EdgeOwnerActions edgeId={edge.id} nodeId={selectedNodeId} />
        </li>
      ))}
    </ul>
  );
}
