import type { Organization } from "@/types";
import type { CompanyTimelineItem, CompanyViewerRole } from "@/lib/company-intelligence/types";
import { canSeeTier } from "@/lib/company-intelligence/privacy";

export function buildCompanyTimeline(input: {
  organization: Organization;
  viewer: CompanyViewerRole;
  events?: Array<{
    id: string;
    created_at?: string;
    createdAt?: string;
    event_type?: string;
    eventType?: string;
    title: string;
    detail?: string;
    visibility?: string;
  }>;
  needsCount?: number;
  projectsCount?: number;
}): CompanyTimelineItem[] {
  const o = input.organization;
  const items: CompanyTimelineItem[] = [
    {
      id: `created-${o.id}`,
      at: o.createdAt || new Date(0).toISOString(),
      eventType: "created",
      title: "Создана в ЦКР",
      detail: o.name,
      visibility: "PUBLIC",
    },
  ];
  if (o.updatedAt && o.updatedAt !== o.createdAt) {
    items.push({
      id: `updated-${o.id}`,
      at: o.updatedAt,
      eventType: "requisites_updated",
      title: "Обновлены реквизиты / профиль",
      detail: "",
      visibility: "CKR_ONLY",
    });
  }
  if ((input.needsCount || 0) > 0) {
    items.push({
      id: `needs-${o.id}`,
      at: o.updatedAt || o.createdAt || new Date().toISOString(),
      eventType: "need_added",
      title: `Потребности: ${input.needsCount}`,
      detail: "Need Profiles организации",
      visibility: "CKR_ONLY",
    });
  }
  if ((input.projectsCount || 0) > 0) {
    items.push({
      id: `projects-${o.id}`,
      at: o.updatedAt || o.createdAt || new Date().toISOString(),
      eventType: "project_linked",
      title: `Проекты: ${input.projectsCount}`,
      detail: "",
      visibility: "PUBLIC",
    });
  }
  for (const e of input.events || []) {
    items.push({
      id: e.id,
      at: e.created_at || e.createdAt || new Date().toISOString(),
      eventType: e.event_type || e.eventType || "event",
      title: e.title,
      detail: e.detail || "",
      visibility: (e.visibility as CompanyTimelineItem["visibility"]) || "CKR_ONLY",
    });
  }
  return items
    .filter((i) => canSeeTier(input.viewer, i.visibility))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}
