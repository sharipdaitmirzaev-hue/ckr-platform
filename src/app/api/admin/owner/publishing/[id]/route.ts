import { withOiOwner } from "@/lib/lia/oi/http";
import { getControlledPublishService } from "@/lib/lia/oi/publish";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withOiOwner(async () => {
    const svc = getControlledPublishService();
    const item = await svc.getQueueItem(id);
    if (!item) throw new Error("Не найдено");
    const audit = await svc.listAuditAsync(id);
    const published = await svc.getPublishedBySourceAsync(id);
    return { mode: svc.getMode(), item, audit, published };
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
    const svc = getControlledPublishService();
    const action = body.action || "";

    if (action === "approve") {
      const result = await svc.approve(
        id,
        userId,
        body.overrides as Parameters<typeof svc.approve>[2],
      );
      return {
        ok: true,
        action: "approve",
        mode: svc.getMode(),
        opportunityId: result.opportunity.id,
        projection: result.projection,
      };
    }

    if (action === "reject") {
      await svc.reject(id, userId, body.reason);
      return { ok: true, action: "reject", mode: svc.getMode() };
    }

    if (action === "edit") {
      const item = await svc.editDraft(
        id,
        userId,
        body.overrides as Parameters<typeof svc.editDraft>[2],
      );
      return { ok: true, action: "edit", mode: svc.getMode(), item };
    }

    if (action === "recheck") {
      await svc.requestRecheck(id, userId, body.reason);
      return { ok: true, action: "recheck", mode: svc.getMode() };
    }

    if (action === "apply_changes") {
      const opp = await svc.applyPendingChanges(id, userId);
      return {
        ok: true,
        action: "apply_changes",
        mode: svc.getMode(),
        opportunityId: opp.id,
      };
    }

    if (action === "reject_changes") {
      await svc.rejectPendingChanges(id, userId);
      return { ok: true, action: "reject_changes", mode: svc.getMode() };
    }

    if (action === "rediscovery") {
      const { getCandidate } = await import("@/lib/lia/oi/store");
      const c = await getCandidate(id);
      if (!c) throw new Error("LIA OI не найдена");
      const result = await svc.onRediscovery(c);
      return { ok: true, action: "rediscovery", mode: svc.getMode(), result };
    }

    throw new Error(
      "Unknown action. Use approve|reject|edit|recheck|apply_changes|reject_changes|rediscovery",
    );
  });
}
