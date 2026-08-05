"use client";

import { SolutionPanel } from "@/components/lia/solution-panel";
import { Button } from "@/components/ui/button";
import {
  analyzeProjectWithLiaAction,
  type LiaAnalyzeActionState,
} from "@/features/lia/actions";
import type { SolutionReport } from "@/types/lia";
import { useState, useTransition } from "react";

type ProjectLiaActionsProps = {
  projectId: string;
  initialReport?: SolutionReport | null;
};

export function ProjectLiaActions({
  projectId,
  initialReport = null,
}: ProjectLiaActionsProps) {
  const [report, setReport] = useState<SolutionReport | null>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(mode: "analyze" | "find_solutions") {
    setError(null);
    startTransition(async () => {
      const result: LiaAnalyzeActionState = await analyzeProjectWithLiaAction(
        projectId,
        mode,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.report) {
        setReport(result.report);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => run("analyze")}
          disabled={pending}
          variant="outline"
        >
          {pending ? "Лия анализирует…" : "Анализ Лией"}
        </Button>
        <Button
          type="button"
          onClick={() => run("find_solutions")}
          disabled={pending}
        >
          {pending ? "Ищем решения…" : "Найти решения"}
        </Button>
      </div>

      <p className="text-xs text-muted">
        Лия только рекомендует: не создаёт заявки и не изменяет проект без
        подтверждения. Внешние источники помечены отдельно.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {report ? <SolutionPanel report={report} /> : null}
    </div>
  );
}
