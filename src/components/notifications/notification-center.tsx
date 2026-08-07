"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notificationTypeLabels } from "@/config/notifications";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import type { AppNotification } from "@/lib/notifications/mappers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type NotificationCenterProps = {
  notifications: AppNotification[];
};

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((item) => !item.isRead).length;

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted">
        Уведомлений пока нет. Здесь появятся заявки, сообщения и обновления
        проектов.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Непрочитанных: <span className="text-foreground">{unread}</span>
        </p>
        {unread > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await markAllNotificationsReadAction();
                router.refresh();
              });
            }}
          >
            Отметить все прочитанными
          </Button>
        ) : null}
      </div>

      <ul className="space-y-3">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={
              item.isRead
                ? "rounded-sm border border-border bg-background/30 px-4 py-3"
                : "rounded-sm border border-accent/30 bg-accent-muted/30 px-4 py-3"
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">
                {notificationTypeLabels[item.type] || item.type}
              </Badge>
              {!item.isRead ? <Badge variant="accent">Новое</Badge> : null}
              <span className="text-xs text-muted">
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </span>
            </div>
            <p className="mt-2 font-display text-base text-foreground">
              {item.title}
            </p>
            <p className="mt-1 text-sm text-muted">{item.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={item.href}
                className="text-sm text-accent hover:underline"
                onClick={() => {
                  if (!item.isRead) {
                    startTransition(async () => {
                      await markNotificationReadAction(item.id);
                    });
                  }
                }}
              >
                Перейти
              </Link>
              {!item.isRead ? (
                <button
                  type="button"
                  disabled={pending}
                  className="text-sm text-muted hover:text-foreground"
                  onClick={() => {
                    startTransition(async () => {
                      await markNotificationReadAction(item.id);
                      router.refresh();
                    });
                  }}
                >
                  Прочитано
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
