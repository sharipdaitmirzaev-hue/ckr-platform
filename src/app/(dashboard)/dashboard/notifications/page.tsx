import { NotificationCenter } from "@/components/notifications/notification-center";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listNotifications } from "@/lib/notifications/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Уведомления" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/notifications");

  const notifications = await listNotifications(current.user.id, 50);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Коммуникации"
        title="Уведомления"
        description="События по заявкам, сообщениям, проектам, сделкам и документам. Видны только ваши уведомления."
      />
      <Card variant="surface" className="p-5 sm:p-6">
        <NotificationCenter notifications={notifications} />
      </Card>
    </div>
  );
}
