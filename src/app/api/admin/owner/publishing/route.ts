import { withOiOwner } from "@/lib/lia/oi/http";
import { getControlledPublishService } from "@/lib/lia/oi/publish";

/** GET — queue «К публикации»; POST — queueEligible / queue_one. */
export async function GET() {
  return withOiOwner(async () => {
    const svc = getControlledPublishService();
    const items = await svc.listQueue([
      "queued",
      "change_review",
      "published",
      "rejected",
      "archived",
    ]);
    return {
      mode: svc.getMode(),
      items,
      counts: {
        queued: items.filter((i) => i.publicationState === "queued").length,
        changeReview: items.filter((i) => i.publicationState === "change_review")
          .length,
        published: items.filter((i) => i.publicationState === "published")
          .length,
        rejected: items.filter((i) => i.publicationState === "rejected").length,
        archived: items.filter((i) => i.publicationState === "archived").length,
      },
    };
  });
}

export async function POST(req: Request) {
  return withOiOwner(async (userId) => {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      id?: string;
      ids?: string[];
      reason?: string;
    };
    const svc = getControlledPublishService();
    if (body.action === "queue_eligible") {
      return { mode: svc.getMode(), ...(await svc.queueEligible(userId)) };
    }
    if (body.action === "queue_one") {
      if (!body.id) throw new Error("id required");
      return { mode: svc.getMode(), ...(await svc.queueOne(body.id, userId)) };
    }
    if (body.action === "reject_many") {
      if (!body.ids?.length) throw new Error("ids required");
      // Bulk reject only — never bulk publish
      return {
        mode: svc.getMode(),
        ...(await svc.rejectMany(body.ids, userId, body.reason)),
      };
    }
    throw new Error("Unknown action");
  });
}
