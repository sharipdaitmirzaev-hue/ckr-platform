import { ApplicationsList } from "@/components/applications/applications-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { markNotificationsReadAction } from "@/features/applications/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  countUnreadNotifications,
  listMyApplications,
} from "@/lib/applications/queries";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Заявки" };

type ApplicationsPageProps = {
  searchParams?: { tab?: string };
};

export default async function DashboardApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const tab = searchParams?.tab === "outgoing" ? "outgoing" : "incoming";
  const [{ incoming, outgoing }, unread] = await Promise.all([
    listMyApplications(current.user.id),
    countUnreadNotifications(current.user.id),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Заявки"
        description="Входящие и исходящие взаимодействия по проектам и возможностям. После принятия заявки позже откроется чат."
      />

      {unread > 0 ? (
        <div className="flex flex-col gap-3 rounded-sm border border-accent/30 bg-accent-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-accent">Новых уведомлений: {unread}</p>
          <form action={markNotificationsReadAction}>
            <Button type="submit" size="sm" variant="outline">
              Отметить прочитанными
            </Button>
          </form>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Link
          href="/dashboard/applications?tab=incoming"
          className={cn(
            "rounded-sm px-3 py-2 text-sm transition-colors",
            tab === "incoming"
              ? "bg-accent-muted text-accent"
              : "text-muted hover:text-foreground",
          )}
        >
          Входящие
          <Badge variant="soft" className="ml-2">
            {incoming.length}
          </Badge>
        </Link>
        <Link
          href="/dashboard/applications?tab=outgoing"
          className={cn(
            "rounded-sm px-3 py-2 text-sm transition-colors",
            tab === "outgoing"
              ? "bg-accent-muted text-accent"
              : "text-muted hover:text-foreground",
          )}
        >
          Исходящие
          <Badge variant="soft" className="ml-2">
            {outgoing.length}
          </Badge>
        </Link>
      </div>

      {tab === "incoming" ? (
        <ApplicationsList
          items={incoming}
          emptyText="Входящих заявок пока нет. Они появятся, когда участники откликнутся на ваши проекты или возможности."
        />
      ) : (
        <ApplicationsList
          items={outgoing}
          emptyText="Вы ещё не отправляли заявок. Откройте проект или возможность и предложите сотрудничество."
        />
      )}
    </div>
  );
}
