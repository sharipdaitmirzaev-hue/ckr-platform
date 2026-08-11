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

export async function applyFeedback(input: {
  candidateId: string;
  event: LiaOiFeedbackEvent;
  reason?: string;
  userId: string;
}): Promise<{ feedback: LiaOiFeedback; candidate: LiaOiCandidate }> {
  const candidate = await getCandidate(input.candidateId);
  if (!candidate) throw new Error("Возможность не найдена");

  const nextStatus = feedbackToStatus[input.event] ?? candidate.status;
  const now = new Date().toISOString();
  const updated: LiaOiCandidate = {
    ...candidate,
    status: nextStatus,
    lastSeenAt: now,
    ownerLocked: true,
    ownerStatusSetAt: now,
    ownerStatusSetBy: input.userId,
  };
  await upsertCandidates([updated], { reason: "owner_update" });

  const feedback: LiaOiFeedback = {
    id: oiId("fb"),
    candidateId: input.candidateId,
    event: input.event,
    reason: input.reason,
    createdAt: now,
    createdBy: input.userId,
  };
  await addFeedback(feedback);
  return { feedback, candidate: updated };
}

export async function createAssignment(input: {
  candidateId: string;
  kind: LiaOiAssignmentKind;
  instruction: string;
  userId: string;
}): Promise<LiaOiAssignment> {
  const candidate = await getCandidate(input.candidateId);
  if (!candidate) throw new Error("Возможность не найдена");

  const resultSummary = [
    `Поручение «${input.kind}» выполнено в stub-режиме.`,
    `Объект: ${candidate.title}.`,
    input.instruction.trim()
      ? `Инструкция владельца: ${input.instruction.trim()}`
      : "",
    "Результат предварительный: рекомендуется проверить факты на live-источнике.",
    candidate.nextStep,
  ]
    .filter(Boolean)
    .join(" ");

  const now = new Date().toISOString();
  const assignment: LiaOiAssignment = {
    id: oiId("asg"),
    candidateId: input.candidateId,
    kind: input.kind,
    instruction: input.instruction.trim() || input.kind,
    status: "COMPLETED",
    resultSummary,
    createdAt: now,
    completedAt: now,
    createdBy: input.userId,
  };
  await addAssignment(assignment);

  await upsertCandidates(
    [
      {
        ...candidate,
        status: "DEEP_RESEARCH",
        lastSeenAt: now,
        ownerLocked: true,
        ownerStatusSetAt: now,
        ownerStatusSetBy: input.userId,
      },
    ],
    { reason: "owner_update" },
  );

  return assignment;
}

export async function completeAssignmentManual(assignment: LiaOiAssignment) {
  await updateAssignment({
    ...assignment,
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
  });
}
