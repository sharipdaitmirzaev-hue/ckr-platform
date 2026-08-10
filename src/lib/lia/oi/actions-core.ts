import { oiId } from "@/lib/lia/oi/id";
import {
  addAssignment,
  addFeedback,
  getCandidate,
  updateAssignment,
  upsertCandidates,
} from "@/lib/lia/oi/store";
import type {
  LiaOiAssignment,
  LiaOiAssignmentKind,
  LiaOiCandidate,
  LiaOiFeedback,
  LiaOiFeedbackEvent,
  LiaOiStatus,
} from "@/types/lia-oi";

const feedbackToStatus: Partial<Record<LiaOiFeedbackEvent, LiaOiStatus>> = {
  INTERESTED: "INTERESTING",
  SAVE: "SAVED",
  REJECT: "REJECTED",
  DEEP_RESEARCH: "DEEP_RESEARCH",
  CREATE_PROJECT: "PROJECT_CREATED",
  PUBLISH: "PUBLISHED",
};

export function applyFeedback(input: {
  candidateId: string;
  event: LiaOiFeedbackEvent;
  reason?: string;
  userId: string;
}): { feedback: LiaOiFeedback; candidate: LiaOiCandidate } {
  const candidate = getCandidate(input.candidateId);
  if (!candidate) throw new Error("Возможность не найдена");

  const nextStatus = feedbackToStatus[input.event] ?? candidate.status;
  const updated: LiaOiCandidate = {
    ...candidate,
    status: nextStatus,
    lastSeenAt: new Date().toISOString(),
  };
  upsertCandidates([updated]);

  const feedback: LiaOiFeedback = {
    id: oiId("fb"),
    candidateId: input.candidateId,
    event: input.event,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
  };
  addFeedback(feedback);
  return { feedback, candidate: updated };
}

export function createAssignment(input: {
  candidateId: string;
  kind: LiaOiAssignmentKind;
  instruction: string;
  userId: string;
}): LiaOiAssignment {
  const candidate = getCandidate(input.candidateId);
  if (!candidate) throw new Error("Возможность не найдена");

  const resultSummary = [
    `Поручение «${input.kind}» выполнено в stub-режиме.`,
    `Объект: ${candidate.title}.`,
    input.instruction.trim()
      ? `Инструкция владельца: ${input.instruction.trim()}`
      : "",
    "Результат предварительный: рекомендуется проверить факты на этапе 2 (live search).",
    candidate.nextStep,
  ]
    .filter(Boolean)
    .join(" ");

  const assignment: LiaOiAssignment = {
    id: oiId("asg"),
    candidateId: input.candidateId,
    kind: input.kind,
    instruction: input.instruction.trim() || input.kind,
    status: "done",
    resultSummary,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdBy: input.userId,
  };
  addAssignment(assignment);

  upsertCandidates([
    {
      ...candidate,
      status: "DEEP_RESEARCH",
      lastSeenAt: new Date().toISOString(),
    },
  ]);

  return assignment;
}

export function completeAssignmentManual(assignment: LiaOiAssignment) {
  updateAssignment({
    ...assignment,
    status: "done",
    completedAt: new Date().toISOString(),
  });
}
