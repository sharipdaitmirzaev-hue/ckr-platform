import type { ProjectStatus } from "@/types";

/**
 * Разрешённые переходы жизненного цикла проекта.
 * Стадия бизнеса (idea/startup/…) — отдельное поле `stage`.
 */
export const PROJECT_LIFECYCLE_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  draft: ["moderation", "archived"],
  moderation: ["draft", "published", "archived"],
  published: ["active", "moderation", "archived"],
  active: ["completed", "archived"],
  completed: ["archived"],
  archived: ["draft"],
};

/** Статусы, видимые в публичном каталоге. */
export const PROJECT_CATALOG_STATUSES: readonly ProjectStatus[] = [
  "published",
  "active",
  "completed",
];

/** Статусы, на которые можно подать заявку. */
export const PROJECT_APPLICATION_STATUSES: readonly ProjectStatus[] = [
  "published",
  "active",
];

export function canTransitionProjectStatus(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  if (from === to) return true;
  return PROJECT_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function nextProjectStatuses(
  current: ProjectStatus,
): readonly ProjectStatus[] {
  return PROJECT_LIFECYCLE_TRANSITIONS[current];
}

/** Владелец может инициировать эти переходы без админа. */
export function ownerAllowedTransitions(
  current: ProjectStatus,
): readonly ProjectStatus[] {
  const next = PROJECT_LIFECYCLE_TRANSITIONS[current];
  if (current === "moderation") {
    // С модерации владелец может только отозвать в draft или архив
    return next.filter((status) => status === "draft" || status === "archived");
  }
  if (current === "published") {
    return next.filter(
      (status) => status === "active" || status === "archived",
    );
  }
  return next;
}

/** Админ/модератор может публиковать с модерации. */
export function adminAllowedTransitions(
  current: ProjectStatus,
): readonly ProjectStatus[] {
  return PROJECT_LIFECYCLE_TRANSITIONS[current];
}

export function isCatalogVisibleStatus(status: ProjectStatus): boolean {
  return PROJECT_CATALOG_STATUSES.includes(status);
}

export function acceptsApplications(status: ProjectStatus): boolean {
  return PROJECT_APPLICATION_STATUSES.includes(status);
}
