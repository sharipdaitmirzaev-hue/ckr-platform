import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export default async function AdminIndexPage() {
  const current = await getCurrentUser();
  if (current?.roles.includes("admin")) {
    redirect("/admin/owner");
  }
  redirect("/admin/dashboard");
}
