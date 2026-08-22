"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishingQueueActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function scan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/owner/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "queue_eligible" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "error");
      setMsg(
        `В очередь: ${json.data?.queued ?? 0}, пропущено: ${json.data?.skipped ?? 0}`,
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
        onClick={scan}
        className="rounded-sm bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Сканирование…" : "Quality gate → в очередь"}
      </button>
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
    </div>
  );
}
