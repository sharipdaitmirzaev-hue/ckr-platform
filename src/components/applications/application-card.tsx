import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  applicationStatusLabels,
  applicationTargetLabels,
  ownerActionStatuses,
} from "@/config/applications";
import { updateApplicationStatusAction } from "@/features/applications/actions";
import type { ApplicationListItem } from "@/lib/applications/queries";
import Link from "next/link";

type ApplicationCardProps = {
  application: ApplicationListItem;
};

function targetHref(application: ApplicationListItem) {
  if (application.targetType === "project") {
    return `/project/${application.targetId}`;
  }
  if (application.targetType === "opportunity") {
    return `/opportunity/${application.targetId}`;
  }
  if (application.targetType === "investment") {
    return `/investment/${application.targetId}`;
  }
  if (application.targetType === "expert") {
    return `/expert/${application.targetId}`;
  }
  return null;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const href = targetHref(application);
  const isIncoming = application.direction === "incoming";
  const canAct =
    isIncoming &&
    application.status !== "closed" &&
    application.status !== "rejected";

  return (
    <Card as="article" variant="surface" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {applicationTargetLabels[application.targetType]}
        </Badge>
        <Badge variant="soft">
          {applicationStatusLabels[application.status]}
        </Badge>
        <Badge variant="default">
          {isIncoming ? "Входящая" : "Исходящая"}
        </Badge>
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground">
          {application.targetTitle || "Объект заявки"}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {isIncoming
            ? `От: ${application.fromUserName || "Участник ЦКР"}`
            : "Вы отправили заявку"}
        </p>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
        {application.message}
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {href ? (
          <Link
            href={href}
            className="text-sm text-accent transition-colors hover:underline"
          >
            Открыть объект
          </Link>
        ) : null}
        <span className="text-xs text-muted">
          {new Date(application.createdAt).toLocaleString("ru-RU")}
        </span>
      </div>

      {canAct ? (
        <div className="flex flex-wrap gap-2">
          {ownerActionStatuses
            .filter((status) => status !== application.status)
            .map((status) => (
              <form key={status} action={updateApplicationStatusAction}>
                <input
                  type="hidden"
                  name="applicationId"
                  value={application.id}
                />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  size="sm"
                  variant={status === "accepted" ? "primary" : "outline"}
                >
                  {applicationStatusLabels[status]}
                </Button>
              </form>
            ))}
        </div>
      ) : null}

      {application.status === "accepted" ? (
        <p className="text-xs text-accent">
          Заявка принята.{" "}
          <a href="/messages" className="underline-offset-2 hover:underline">
            Открыть сообщения
          </a>
        </p>
      ) : null}
    </Card>
  );
}
