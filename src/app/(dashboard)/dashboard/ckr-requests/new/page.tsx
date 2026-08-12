import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { CreateCkrRequestForm } from "@/features/ckr-inbox/components/create-ckr-request-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMyOrganizations } from "@/lib/partners/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Новое обращение в ЦКР" };
export const dynamic = "force-dynamic";

export default async function NewCkrRequestPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/ckr-requests/new");
  const orgs = await listMyOrganizations(current.user.id);
  const primary = orgs[0]?.organization;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/ckr-requests"
        className="text-sm text-accent hover:underline"
      >
        ← Мои обращения
      </Link>
      <SectionHeading
        title="Обращение в ЦКР"
        description="Заявка попадёт в рабочий inbox команды ЦКР. Matching не запускается."
      />
      <Card variant="surface" className="p-5">
        <CreateCkrRequestForm
          organizationId={primary?.id}
          organizationName={primary?.name}
        />
      </Card>
    </div>
  );
}
