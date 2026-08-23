import { CKR_OWN_IDEAS_FORBIDDEN } from "@/config/ckr-own-ideas";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export function assertOwnerOnly(idea: CkrOwnIdea) {
  if (idea.visibility !== "OWNER_ONLY") {
    throw new Error("Own idea visibility must stay OWNER_ONLY on Stage 4Q");
  }
}

export function assertNoAutoActions(metrics: OwnIdeaRunMetrics) {
  if (
    metrics.autoPublish ||
    metrics.autoOutreach ||
    metrics.matchingEdges ||
    metrics.scheduler ||
    metrics.clientRequestUsed
  ) {
    throw new Error("Forbidden auto-action or Scheduler/Matching flag set");
  }
}

export function publicProjectionForbidden(): null {
  return null;
}

export function forbiddenFlags() {
  return { ...CKR_OWN_IDEAS_FORBIDDEN };
}
