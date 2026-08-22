"use client";

import { Button } from "@/components/ui/button";
import {
  liaOiAssignmentLabels,
  liaOiFeedbackLabels,
} from "@/config/lia-oi";
import type { LiaOiAssignmentKind, LiaOiFeedbackEvent } from "@/types/lia-oi";
import { useRouter } from "next/navigation";
import { useState } from "react";

const feedbackEvents: LiaOiFeedbackEvent[] = [
  "INTERESTED",
  "SAVE",
  "DEEP_RESEARCH",
  "REJECT",
];

const assignmentKinds: LiaOiAssignmentKind[] = [
  "DEEP_CHECK",
  "CHECK_MARKET",
  "FIND_INVESTOR",
  "CHECK_SUPPORT",
  "CKR_ANGLE",
];

export function OpportunityActions({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [kind, setKind] = useState<LiaOiAssignmentKind>("DEEP_CHECK");

  async function sendFeedback(event: LiaOiFeedbackEvent) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lia/oi/opportunities/${candidateId}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка");
      setMessage(`Статус обновлён: ${liaOiFeedbackLabels[event]}`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  async function sendAssignment() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lia/oi/opportunities/${candidateId}/assignment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, instruction }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка");
      setMessage("Поручение выполнено (stub). См. раздел «Поручения».");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-sm border border-border bg-surface p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Решение владельца
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {feedbackEvents.map((event) => (
            <Button
              key={event}
              type="button"
              size="sm"
              variant={event === "REJECT" ? "outline" : "primary"}
              disabled={pending}
              onClick={() => sendFeedback(event)}
            >
              {liaOiFeedbackLabels[event]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Поручить Лии
        </p>
        <select
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as LiaOiAssignmentKind)}
        >
          {assignmentKinds.map((k) => (
            <option key={k} value={k}>
              {liaOiAssignmentLabels[k]}
            </option>
          ))}
        </select>
        <textarea
          className="min-h-[80px] w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          placeholder="Дополнительная инструкция (необязательно)"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => sendAssignment()}
        >
          Отправить поручение
        </Button>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
