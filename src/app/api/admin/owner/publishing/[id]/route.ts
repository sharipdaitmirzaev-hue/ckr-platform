import { withOiOwner } from "@/lib/lia/oi/http";
import {
  getControlledPublishService,
  canPersistControlledPublish,
  syncApproveToSupabase,
  persistOiPublicationMeta,
  persistPublicationEvent,
} from "@/lib/lia/oi/publish";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withOiOwner(async () => {
    const svc = getControlledPublishService("memory");
    const item = await svc.getQueueItem(id);
    if (!item) throw new Error("Не найдено");
    const audit = svc.listAudit(id);
    const published = svc.getPublishedBySource(id);
    return { item, audit, published };
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withOiOwner(async (userId) => {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      reason?: string;
      overrides?: Record<string, unknown>;
    };
    const svc = getControlledPublishService("memory");
    const action = body.action || "";

    if (action === "approve") {
      const result = await svc.approve(
        id,
        userId,
        body.overrides as Parameters<typeof svc.approve>[2],
      );
      if (canPersistControlledPublish()) {
        const item = await svc.getQueueItem(id);
        await syncApproveToSupabase({
          liaOiId: id,
          opportunity: result.opportunity,
          lockedFields: item?.lockedFields || [],
          actorUserId: userId,
          projection: result.projection,
          draft: item!.draft,
        });
      }
      return {
        ok: true,
        action: "approve",
        opportunityId: result.opportunity.id,
        projection: result.projection,
        persisted: canPersistControlledPublish(),
      };
    }

    if (action === "reject") {
      const meta = await svc.reject(id, userId, body.reason);
      if (canPersistControlledPublish()) {
        await persistOiPublicationMeta({
          liaOiId: id,
          publicationState: "rejected",
          marketplaceOpportunityId: meta.marketplaceOpportunityId,
          lockedFields: meta.lockedFields,
          pendingChanges: meta.pendingChanges,
          actorUserId: userId,
        });
        await persistPublicationEvent({
          liaOiId: id,
          marketplaceOpportunityId: meta.marketplaceOpportunityId,
          actorUserId: userId,
          action: "reject",
          reason: body.reason || null,
          beforeSnapshot: {},
          afterSnapshot: { publicationState: "rejected" },
          publicProjection: {},
        });
      }
      return { ok: true, action: "reject" };
    }

    if (action === "edit") {
      const item = await svc.editDraft(
        id,
        userId,
        body.overrides as Parameters<typeof svc.editDraft>[2],
      );
      return { ok: true, action: "edit", item };
    }

    if (action === "recheck") {
      await svc.requestRecheck(id, userId, body.reason);
      return { ok: true, action: "recheck" };
    }

    if (action === "apply_changes") {
      const opp = await svc.applyPendingChanges(id, userId);
      return { ok: true, action: "apply_changes", opportunityId: opp.id };
    }

    if (action === "reject_changes") {
      await svc.rejectPendingChanges(id, userId);
      return { ok: true, action: "reject_changes" };
    }

    throw new Error(
      "Unknown action. Use approve|reject|edit|recheck|apply_changes|reject_changes",
    );
  });
}
