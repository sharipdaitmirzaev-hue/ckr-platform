import { getCurrentUser, type CurrentUser } from "@/lib/auth/get-current-user";
import {
  listMyOrganizations,
  type PartnerContext,
} from "@/lib/partners/queries";
import { redirect } from "next/navigation";

export type PartnerSession = CurrentUser & {
  organizations: PartnerContext[];
  primary: PartnerContext | null;
};

/** Авторизованный пользователь для кабинета /partner. */
export async function requirePartnerUser(): Promise<PartnerSession> {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login?next=/partner");
  }

  const organizations = await listMyOrganizations(current.user.id);
  return {
    ...current,
    organizations,
    primary: organizations[0] ?? null,
  };
}

/** Требует членство хотя бы в одной организации. */
export async function requirePartnerMembership(): Promise<
  PartnerSession & { primary: PartnerContext }
> {
  const session = await requirePartnerUser();
  if (!session.primary) {
    redirect("/partner?setup=1");
  }
  return session as PartnerSession & { primary: PartnerContext };
}
