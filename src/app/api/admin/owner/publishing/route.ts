import { withOiOwner } from "@/lib/lia/oi/http";
import { getControlledPublishService } from "@/lib/lia/oi/publish";

/** GET — queue «К публикации»; POST — queueEligible scan. */
export async function GET() {
  return withOiOwner(async () => {
    const svc = getControlledPublishService("memory");
    const items = await svc.listQueue(["queued", "change_review", "published"]);
    return {
      items,
      counts: {
        queued: items.filter((i) => i.publicationState === "queued").length,
        changeReview: items.filter((i) => i.publicationState === "change_review")
          .length,
        published: items.filter((i) => i.publicationState === "published")
          .length,
      },
    };
  });
}

export async function POST(req: Request) {
  return withOiOwner(async (userId) => {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const svc = getControlledPublishService("memory");
    if (body.action === "queue_eligible") {
      return svc.queueEligible(userId);
    }
    throw new Error("Unknown action");
  });
}
