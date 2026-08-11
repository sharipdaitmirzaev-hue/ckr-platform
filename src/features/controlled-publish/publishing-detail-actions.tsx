"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  publicationState: string;
  initial: {
    title: string;
    description: string;
    type: string;
    region: string;
    city: string;
    price: number | null;
  };
  lockedFields: string[];
};

export function PublishingDetailActions({
  id,
  publicationState,
  initial,
  lockedFields,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [region, setRegion] = useState(initial.region);
  const [type, setType] = useState(initial.type);
  const [reason, setReason] = useState("");

  async function run(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/owner/publishing/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, ...extra }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "error");
      setMsg(`OK: ${action}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const overrides = { title, description, region, type };

  return (
    <section className="space-y-4 border border-border p-4">
      <h3 className="font-display text-lg">Действия владельца</h3>
      <p className="text-xs text-muted">
        Состояние: {publicationState}. Locked fields:{" "}
        {lockedFields.length ? lockedFields.join(", ") : "нет"}.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted">Название</span>
          <input
            className="w-full border border-border bg-transparent px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Регион</span>
          <input
            className="w-full border border-border bg-transparent px-2 py-1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-muted">Описание</span>
          <textarea
            className="w-full border border-border bg-transparent px-2 py-1"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Тип marketplace</span>
          <select
            className="w-full border border-border bg-transparent px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="support_program">support_program</option>
            <option value="procurement">procurement</option>
            <option value="auction_asset">auction_asset</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Причина (reject / recheck)</span>
          <input
            className="w-full border border-border bg-transparent px-2 py-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-sm bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
          onClick={() => run("approve", { overrides })}
        >
          Одобрить и опубликовать
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={() => run("edit", { overrides })}
        >
          Отредактировать
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={() => run("reject")}
        >
          Отклонить
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={() => run("recheck")}
        >
          На допроверку Лии
        </button>
        <button
          type="button"
          disabled={busy || publicationState !== "change_review"}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={() => run("apply_changes")}
        >
          Применить изменения
        </button>
        <button
          type="button"
          disabled={busy || publicationState !== "change_review"}
          className="rounded-sm border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={() => run("reject_changes")}
        >
          Отклонить изменения
        </button>
      </div>
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
    </section>
  );
}
