import { withOiOwner } from "@/lib/lia/oi/http";
import { createAssignment } from "@/lib/lia/oi/actions-core";
import { LIA_OI_ASSIGNMENT_KINDS } from "@/types/lia-oi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(request: Request, context: Ctx) {
  return withOiOwner(async (userId) => {
    const body = (await request.json().catch(() => ({}))) as {
      kind?: string;
      instruction?: string;
    };
    const kind =
      body.kind &&
      (LIA_OI_ASSIGNMENT_KINDS as readonly string[]).includes(body.kind)
        ? body.kind
        : "CUSTOM";
    return createAssignment({
      candidateId: context.params.id,
      kind: kind as (typeof LIA_OI_ASSIGNMENT_KINDS)[number],
      instruction: body.instruction ?? "",
      userId,
    });
  });
}
