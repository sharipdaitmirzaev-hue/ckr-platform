import { getCurrentUser, type CurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export async function requireAdmin(): Promise<CurrentUser> {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/admin/verifications");
  }

  if (!current.roles.includes("admin")) {
    redirect("/dashboard");
  }

  return current;
}
