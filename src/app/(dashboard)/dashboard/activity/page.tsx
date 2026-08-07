import { ActivityFeed } from "@/components/activity/activity-feed";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listActivityFeed } from "@/lib/activity/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Активность" };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/activity");

  const items = await listActivityFeed(current.user.id, 40);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Коммуникации"
        title="Лента активности"
        description="События по вашим проектам: создание, статусы, участники, документы, этапы."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <ActivityFeed items={items} />
      </Card>
    </div>
  );
}
