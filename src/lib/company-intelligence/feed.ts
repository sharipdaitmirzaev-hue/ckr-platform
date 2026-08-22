/**
 * Company feed — «Возможности для компании» via existing Feed v1 + org Need Profiles.
 * No Matching Engine.
 */

import type { NeedProfile } from "@/types/need-profile";
import type { PersonalizedFeedService } from "@/lib/personalized-feed/service";

export type CompanyFeedBundle = {
  organizationId: string;
  needsUsed: Array<{ id: string; intentType: string; title: string }>;
  recommendations: Array<{
    needId: string;
    intentType: string;
    score: number;
    title: string;
    region?: string | null;
    itemType: string;
    itemId: string;
    explanation: unknown;
  }>;
  coverageNotes: string[];
};

/**
 * Aggregate Feed v1 for all ACTIVE organization-owned need profiles.
 */
export async function getCompanyFeed(input: {
  organizationId: string;
  ownerUserId: string;
  needs: NeedProfile[];
  feed: PersonalizedFeedService;
  limitPerNeed?: number;
}): Promise<CompanyFeedBundle> {
  const active = input.needs.filter(
    (n) =>
      n.ownerType === "organization" &&
      n.ownerId === input.organizationId &&
      n.status === "ACTIVE",
  );
  const recommendations: CompanyFeedBundle["recommendations"] = [];
  const coverageNotes: string[] = [];
  const needsUsed: CompanyFeedBundle["needsUsed"] = [];

  for (const need of active) {
    needsUsed.push({
      id: need.id,
      intentType: String(need.intentType),
      title: need.title,
    });
    const res = await input.feed.getFeedForNeedProfile({
      need,
      ownerId: input.ownerUserId,
      limit: input.limitPerNeed ?? 8,
    });
    coverageNotes.push(
      `${need.intentType}: coverage=${res.diagnostics.coverage}, candidates=${res.diagnostics.candidateCount}`,
    );
    for (const r of res.recommendations) {
      recommendations.push({
        needId: need.id,
        intentType: String(need.intentType),
        score: r.score,
        title: r.candidate.title,
        region: r.candidate.region,
        itemType: r.candidate.itemType,
        itemId: r.candidate.id,
        explanation: r.explanation,
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  return {
    organizationId: input.organizationId,
    needsUsed,
    recommendations: recommendations.slice(0, 30),
    coverageNotes,
  };
}
