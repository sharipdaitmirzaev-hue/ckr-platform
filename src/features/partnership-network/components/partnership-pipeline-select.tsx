"use client";

import {
  PARTNERSHIP_PIPELINE_STAGES,
  partnershipPipelineStageLabels,
  type PartnershipPipelineStage,
} from "@/config/partnership-network";
import { updatePartnershipPipelineAction } from "@/features/partnership-network/actions";

type Props = {
  partnershipId: string;
  stage: PartnershipPipelineStage;
  disabled?: boolean;
};

export function PartnershipPipelineSelect({
  partnershipId,
  stage,
  disabled,
}: Props) {
  if (disabled || partnershipId.startsWith("org-")) {
    return (
      <span className="text-xs text-muted">
        {partnershipPipelineStageLabels[stage]}
      </span>
    );
  }

  return (
    <form action={updatePartnershipPipelineAction}>
      <input type="hidden" name="partnershipId" value={partnershipId} />
      <select
        name="pipelineStage"
        defaultValue={stage}
        className="h-9 rounded-sm border border-border bg-surface px-2 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {PARTNERSHIP_PIPELINE_STAGES.map((s) => (
          <option key={s} value={s}>
            {partnershipPipelineStageLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
