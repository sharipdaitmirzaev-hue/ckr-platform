"use server";

import { IDEA_FORM } from "@/config/idea-first";
import { decodeClaimCookie } from "@/lib/idea-first/security";
import { claimPublicIdea } from "@/lib/idea-first/submit";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** After login/register — claim anonymous IDEA from httpOnly cookie. */
export async function claimIdeaFromCookieAction(): Promise<void> {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/ckr-requests?claim=1");

  const jar = cookies();
  const claim = decodeClaimCookie(jar.get(IDEA_FORM.claimCookie)?.value);
  if (!claim) {
    redirect("/dashboard/ckr-requests");
  }

  const result = await claimPublicIdea({
    requestId: claim.requestId,
    claimToken: claim.token,
  });

  jar.delete(IDEA_FORM.claimCookie);

  if (!result.ok) {
    redirect(
      `/dashboard/ckr-requests?claimError=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(`/dashboard/ckr-requests/${result.requestId}?claimed=1`);
}
