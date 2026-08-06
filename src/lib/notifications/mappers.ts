import type { NotificationRow } from "@/types/database";
import { hrefForNotification } from "@/config/notifications";

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedType: string | null;
  relatedId: string | null;
  applicationId: string | null;
  link: string | null;
  href: string;
  isRead: boolean;
  createdAt: string;
};

export function mapNotificationRow(row: NotificationRow): AppNotification {
  const message = row.message || row.body || "";
  const isRead =
    typeof row.is_read === "boolean" ? row.is_read : Boolean(row.read_at);

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message,
    relatedType: row.related_type ?? null,
    relatedId: row.related_id ?? null,
    applicationId: row.application_id,
    link: row.link,
    href: hrefForNotification({
      link: row.link,
      relatedType: row.related_type,
      relatedId: row.related_id,
      applicationId: row.application_id,
    }),
    isRead,
    createdAt: row.created_at,
  };
}
