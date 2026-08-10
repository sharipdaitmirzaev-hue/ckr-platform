"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LiaOiSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Инвестор ищет проект до 30 млн рублей по России",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/lia/oi/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка поиска");
      const data = json.data;
      setSummary(
        `Готово (stub): сигналов ${data.signalsScanned}, после dedup ${data.afterDedup}, в ленту ${data.candidates.length}.`,
      );
      router.refresh();
      router.push("/admin/owner/lia/opportunities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-muted">Запрос владельца</span>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: Найди бизнес до 20 млн в Дагестане"
          required
          minLength={3}
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Ищем…" : "Запустить поиск (stub)"}
      </Button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {summary ? <p className="text-sm text-muted">{summary}</p> : null}
    </form>
  );
}
