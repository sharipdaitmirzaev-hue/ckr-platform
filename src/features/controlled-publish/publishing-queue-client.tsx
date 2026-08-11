"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PublicationQueueItem } from "@/types/lia-controlled-publish";

function money(n: number | null | undefined) {
  if (n == null) return "UNKNOWN";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)} млн ₽`;
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

type SortKey = "best" | "newest";

export function PublishingQueueClient({
  items,
}: {
  items: PublicationQueueItem[];
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("best");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (typeFilter !== "ALL") {
      list = list.filter(
        (i) =>
          (i.opportunityType || "").toUpperCase().includes(typeFilter) ||
          (i.draft.type || "").toLowerCase().includes(typeFilter.toLowerCase()),
      );
    }
    if (tierFilter !== "ALL") {
      list = list.filter((i) => i.publishabilityTier === tierFilter);
    }
    if (regionFilter.trim()) {
      const r = regionFilter.trim().toLowerCase();
      list = list.filter((i) => (i.region || i.draft.region || "").toLowerCase().includes(r));
    }
    if (industryFilter.trim()) {
      const ind = industryFilter.trim().toLowerCase();
      list = list.filter((i) =>
        (i.industry || i.draft.industry || "").toLowerCase().includes(ind),
      );
    }
    if (sort === "newest") {
      list = list.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
    }
    // "best" already sorted server-side; keep order
    return list;
  }, [items, sort, typeFilter, tierFilter, regionFilter, industryFilter]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function bulkReject() {
    if (!selectedIds.length) return;
    if (!confirm(`Отклонить ${selectedIds.length} карточек? (без публикации)`)) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/owner/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_many",
          ids: selectedIds,
          reason: "bulk_reject_owner",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "error");
      setMsg(
        `Отклонено: ${json.data?.rejected ?? 0}` +
          (json.data?.skipped?.length
            ? `, пропущено (уже published): ${json.data.skipped.length}`
            : ""),
      );
      setSelected({});
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <label className="flex items-center gap-1">
          Сортировка
          <select
            className="border border-border bg-background px-2 py-1"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="best">Лучшее качество</option>
            <option value="newest">Новые</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Тип
          <select
            className="border border-border bg-background px-2 py-1"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Все</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="PROCUREMENT">CONTRACT</option>
            <option value="AUCTION">AUCTION</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Пригодность
          <select
            className="border border-border bg-background px-2 py-1"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="ALL">Все</option>
            <option value="READY_TO_REVIEW">READY_TO_REVIEW</option>
            <option value="NEEDS_ENRICHMENT">NEEDS_ENRICHMENT</option>
            <option value="WEAK_SOURCE">WEAK_SOURCE</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </label>
        <input
          className="border border-border bg-background px-2 py-1"
          placeholder="Регион"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        />
        <input
          className="border border-border bg-background px-2 py-1"
          placeholder="Отрасль"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !selectedIds.length}
          onClick={bulkReject}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Отклонить выбранные ({selectedIds.length})
        </button>
        <p className="text-xs text-muted">
          Bulk publish недоступен — каждая публикация только индивидуально.
        </p>
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </div>

      {!filtered.length ? (
        <p className="text-sm text-muted">Нет карточек по фильтрам.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article
              key={item.liaOiId}
              className="space-y-2 border-b border-border py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[item.liaOiId])}
                      onChange={(e) =>
                        setSelected((s) => ({
                          ...s,
                          [item.liaOiId]: e.target.checked,
                        }))
                      }
                      disabled={item.publicationState === "published"}
                      aria-label="Выбрать"
                    />
                    <Badge variant="accent">{item.publicationState}</Badge>
                    <Badge>{item.qualityLabelRu || "—"}</Badge>
                    <Badge>{item.publishabilityTier || "—"}</Badge>
                    <Badge>{item.opportunityType || "OTHER"}</Badge>
                    <Badge>{item.pageType || "?"}</Badge>
                    <Badge>{item.draft.sourceLabel}</Badge>
                  </div>
                  <h2 className="font-display text-xl text-foreground">
                    <Link
                      href={`/admin/owner/publishing/${item.liaOiId}`}
                      className="hover:text-accent"
                    >
                      {item.draft.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {[item.region || item.draft.region, item.industry || item.draft.industry]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · "}
                    {money(item.draft.price)}
                    {item.draft.deadlineAt
                      ? ` · дедлайн ${new Date(item.draft.deadlineAt).toLocaleDateString("ru-RU")}`
                      : " · deadline UNKNOWN"}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>Pub {item.publishabilityScore ?? "—"}</p>
                  <p>DQ {item.draft.dataQualityScore ?? "—"}</p>
                  <p>
                    seen{" "}
                    {new Date(item.lastSeenAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/90">
                {item.draft.ownerWhyUseful[0]}
              </p>
              {item.officialUrl ? (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Официальный источник →
                </a>
              ) : null}
              {item.pendingChanges.length ? (
                <p className="text-sm text-amber-800">
                  Обнаружено изменение:{" "}
                  {item.pendingChanges.map((c) => c.field).join(", ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
