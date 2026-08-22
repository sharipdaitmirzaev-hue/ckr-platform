/** Stage 4G — CKR Inbox / Заявки */

export const CKR_REQUEST_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "ACCEPTED",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "WAITING_EXTERNAL",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export type CkrRequestStatus = (typeof CKR_REQUEST_STATUSES)[number];

export const ckrRequestStatusLabels: Record<CkrRequestStatus, string> = {
  NEW: "Новая",
  IN_REVIEW: "На рассмотрении",
  ACCEPTED: "Принята",
  IN_PROGRESS: "В работе",
  WAITING_CLIENT: "Ждём клиента",
  WAITING_EXTERNAL: "Ждём внешнюю сторону",
  COMPLETED: "Завершена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
};

export const CKR_REQUEST_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

export type CkrRequestPriority = (typeof CKR_REQUEST_PRIORITIES)[number];

export const ckrRequestPriorityLabels: Record<CkrRequestPriority, string> = {
  LOW: "Низкий",
  NORMAL: "Обычный",
  HIGH: "Высокий",
  URGENT: "Срочный",
};

export const CKR_REQUEST_TYPES = [
  "GENERAL",
  "INVESTMENT",
  "FIND_INVESTOR",
  "FIND_BUYER",
  "FIND_SUPPLIER",
  "FIND_PARTNER",
  "PROPERTY",
  "BUSINESS",
  "PROJECT",
  "PROCUREMENT",
  "SUPPORT",
  "EXPERT",
  "CKR_SERVICE",
  "IDEA",
  "OTHER",
] as const;

export type CkrRequestType = (typeof CKR_REQUEST_TYPES)[number];

export const ckrRequestTypeLabels: Record<CkrRequestType, string> = {
  GENERAL: "Общее обращение",
  INVESTMENT: "Инвестиции",
  FIND_INVESTOR: "Найти инвестора",
  FIND_BUYER: "Найти покупателя",
  FIND_SUPPLIER: "Найти поставщика",
  FIND_PARTNER: "Найти партнёра",
  PROPERTY: "Недвижимость / актив",
  BUSINESS: "Бизнес",
  PROJECT: "Проект",
  PROCUREMENT: "Закупка",
  SUPPORT: "Поддержка / меры",
  EXPERT: "Эксперт",
  CKR_SERVICE: "Услуга ЦКР",
  IDEA: "Идея",
  OTHER: "Другое",
};

export const CKR_REQUEST_SOURCES = [
  "direct",
  "partnership",
  "marketplace_application",
  "verification",
  "need_profile",
  "manual",
  "public_idea_form",
  "other",
] as const;

export type CkrRequestSource = (typeof CKR_REQUEST_SOURCES)[number];

export const ckrRequestSourceLabels: Record<CkrRequestSource, string> = {
  direct: "Кабинет",
  partnership: "Партнёрство",
  marketplace_application: "Заявка marketplace",
  verification: "Верификация",
  need_profile: "Need Profile",
  manual: "Вручную",
  public_idea_form: "Сайт ЦКР · без регистрации",
  other: "Другое",
};

export const CKR_COMMENT_VISIBILITIES = ["INTERNAL", "CLIENT"] as const;
export type CkrCommentVisibility = (typeof CKR_COMMENT_VISIBILITIES)[number];

export const CKR_REQUEST_EVENT_TYPES = [
  "APPLICATION_CREATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "COMMENT_ADDED",
  "NEED_CREATED",
  "NEED_LINKED",
  "TASK_CREATED",
  "DEAL_CREATED",
  "CLIENT_MESSAGE",
  "LIA_BRIEF",
  "CLAIMED",
  "CONTACT_ADDED",
  "COMPLETED",
  "REJECTED",
  "PUBLIC_ACTIVITY_UPDATED",
  "NEXT_STEP_UPDATED",
] as const;

export type CkrRequestEventType = (typeof CKR_REQUEST_EVENT_TYPES)[number];

export function isCkrRequestStatus(v: string): v is CkrRequestStatus {
  return (CKR_REQUEST_STATUSES as readonly string[]).includes(v);
}

export function isCkrRequestPriority(v: string): v is CkrRequestPriority {
  return (CKR_REQUEST_PRIORITIES as readonly string[]).includes(v);
}

export function isCkrRequestType(v: string): v is CkrRequestType {
  return (CKR_REQUEST_TYPES as readonly string[]).includes(v);
}

export function partnershipTypeToCkrRequestType(
  type: string,
): CkrRequestType {
  switch (type) {
    case "supplier":
      return "FIND_BUYER";
    case "investment":
      return "INVESTMENT";
    case "expert":
      return "EXPERT";
    case "technology":
      return "FIND_PARTNER";
    default:
      return "FIND_PARTNER";
  }
}

export function intentDraftFromRequestType(
  type: CkrRequestType,
): { intentType: string; hint: string } {
  switch (type) {
    case "FIND_BUYER":
      return { intentType: "SEEK_BUYER", hint: "Поиск покупателей / сбыт" };
    case "FIND_SUPPLIER":
      return { intentType: "SEEK_SUPPLIER", hint: "Поиск поставщика" };
    case "FIND_PARTNER":
      return { intentType: "SEEK_PARTNER", hint: "Поиск партнёра" };
    case "FIND_INVESTOR":
    case "INVESTMENT":
      return { intentType: "SEEK_INVESTOR", hint: "Поиск инвестора" };
    case "SUPPORT":
      return { intentType: "SEEK_SUPPORT", hint: "Меры поддержки" };
    case "PROCUREMENT":
      return { intentType: "SEEK_CONTRACT", hint: "Контракт / закупка" };
    case "IDEA":
      return { intentType: "SEEK_PARTNER", hint: "Идея — уточнить intent после review" };
    default:
      return { intentType: "SEEK_PARTNER", hint: "Общий запрос" };
  }
}
