import { needHash, normalizeRegion } from "@/lib/need-profile/id";
import type { CreateNeedProfileInput, NeedIntentType } from "@/types/need-profile";

export function buildNeedFingerprint(input: {
  intentType: NeedIntentType;
  ownerType: string;
  ownerId: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  regions?: string[];
  industries?: string[];
  title?: string;
}): string {
  const regions = (input.regions || [])
    .map(normalizeRegion)
    .map((r) => r.toLowerCase())
    .sort()
    .join("|");
  const industries = (input.industries || [])
    .map((i) => i.toLowerCase().trim())
    .sort()
    .join("|");
  return needHash(
    [
      input.ownerType,
      input.ownerId,
      input.intentType,
      input.budgetMin ?? "",
      input.budgetMax ?? "",
      regions,
      industries,
      (input.title || "").toLowerCase().trim().slice(0, 80),
    ].join("::"),
  );
}

export function fingerprintFromCreate(input: CreateNeedProfileInput): string {
  return buildNeedFingerprint(input);
}
