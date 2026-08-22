"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContentGapActions(props: {
  scenarioId: string;
  intentType: string;
  regions: string[];
  industries: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function findMore() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/owner/content-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "targeted_discovery",
          scenarioId: props.scenarioId,
          intentType: props.intentType,
          regions: props.regions,
          industries: props.industries,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "error");
      const d = json.data;
      const perf =
        Array.isArray(d?.sourcePerformanceRu) && d.sourcePerformanceRu.length
          ? ` ${d.sourcePerformanceRu.slice(0, 3).join("; ")}.`
          : "";
      setMsg(
        `Запуск (${d?.plannerVersion ?? "v2"}): queries ${d?.queriesUsed ?? "—"}, results ${d?.results ?? "—"}, enriched ${d?.enriched ?? "—"}, publishable ${d?.publishable ?? "—"}.${perf} Без автопубликации.`,
      );
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={findMore}
        className="rounded-sm bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Поиск…" : "Найти ещё варианты"}
      </button>
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
    </div>
  );
}
