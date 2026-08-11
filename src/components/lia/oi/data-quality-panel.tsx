"use client";

import { Button } from "@/components/ui/button";
import { liaOiMatchingReadinessLabels } from "@/config/lia-oi";
import type { LiaOiMatchingReadiness } from "@/types/lia-oi";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELD_LABELS: Record<string, string> = {
  official_url: "официальный источник",
  lot_id: "lot id",
  procurement_id: "procurement id",
  program_id: "program id",
  region: "регион",
  starting_price: "начальная цена",
  current_price: "текущая цена",
  nmck: "НМЦК",
  support_amount: "размер поддержки",
  asking_price: "цена",
  deadline_at: "дедлайн",
  auction_status: "статус торгов",
  procurement_stage: "этап закупки",
  organizer: "организатор",
  customer: "заказчик",
  operator: "оператор",
  support_type: "тип поддержки",
};

function label(field: string): string {
  return FIELD_LABELS[field] || field;
}

export function DataQualityPanel(props: {
  candidateId: string;
  dataQualityScore?: number;
  matchingReadiness?: LiaOiMatchingReadiness;
  confirmedFields?: string[];
  unknownFields?: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const readiness = props.matchingReadiness || "NOT_READY";
  const score = props.dataQualityScore ?? 0;
  const confirmed = props.confirmedFields || [];
  const unknown = props.unknownFields || [];

  async function reEnrich() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lia/oi/opportunities/${props.candidateId}/enrich`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка");
      setMessage(
        `Обновлено: ${liaOiMatchingReadinessLabels[json.data.matchingReadiness as LiaOiMatchingReadiness] || json.data.matchingReadiness}, quality ${json.data.dataQualityScore}`,
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3 rounded-sm border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-foreground">
            Качество данных
          </h3>
          <p className="mt-1 text-sm text-muted">
            К Matching:{" "}
            <span className="text-foreground">
              {liaOiMatchingReadinessLabels[readiness]}
            </span>
            {" · "}
            score {score}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={reEnrich}
        >
          {pending ? "Обновление…" : "Обновить данные"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Подтверждено
          </p>
          {confirmed.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {confirmed.map((f) => (
                <li key={f}>{label(f)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Нет подтверждённых полей</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Неизвестно
          </p>
          {unknown.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {unknown.map((f) => (
                <li key={f}>{label(f)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Ключевые поля заполнены</p>
          )}
        </div>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </section>
  );
}
