import { withOiOwner } from "@/lib/lia/oi/http";
import { applyFeedback } from "@/lib/lia/oi/actions-core";
import { LIA_OI_FEEDBACK_EVENTS } from "@/types/lia-oi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(request: Request, context: Ctx) {
  return withOiOwner(async (userId) => {
    const body = (await request.json().catch(() => ({}))) as {
      event?: string;
      reason?: string;
    };
    if (
      !body.event ||
      !(LIA_OI_FEEDBACK_EVENTS as readonly string[]).includes(body.event)
    ) {
      throw new Error("Некорректный тип feedback.");
    }
    return applyFeedback({
      candidateId: context.params.id,
      event: body.event as (typeof LIA_OI_FEEDBACK_EVENTS)[number],
      reason: body.reason,
      userId,
    });
  });
}
