/**
 * Stage 4P — Request → Action → Result vocabulary.
 * Client never sees raw enums.
 */

export const CKR_ACTION_TYPES = [
  "CONTACT",
  "SEND_OFFER",
  "APPLY",
  "REQUEST_INFO",
  "SCHEDULE_MEETING",
  "TRANSFER_TO_CLIENT",
  "OTHER",
] as const;

export type CkrActionType = (typeof CKR_ACTION_TYPES)[number];

export const ckrActionTypeLabels: Record<CkrActionType, string> = {
  CONTACT: "Связаться",
  SEND_OFFER: "Отправить предложение",
  APPLY: "Подать заявку / откликнуться",
  REQUEST_INFO: "Запросить информацию",
  SCHEDULE_MEETING: "Назначить встречу",
  TRANSFER_TO_CLIENT: "Передать клиенту",
  OTHER: "Другое",
};

export const CKR_ACTION_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "WAITING",
  "DONE",
  "CANCELLED",
] as const;

export type CkrActionStatus = (typeof CKR_ACTION_STATUSES)[number];

export const ckrActionStatusLabels: Record<CkrActionStatus, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидание",
  DONE: "Выполнено",
  CANCELLED: "Отменено",
};

/** Human labels for CLIENT UI (never raw enums). */
export const ckrActionStatusPublic: Record<CkrActionStatus, string> = {
  TODO: "Готовимся к шагу",
  IN_PROGRESS: "Сейчас выполняем",
  WAITING: "Ждём ответа",
  DONE: "Шаг выполнен",
  CANCELLED: "Шаг отменён",
};

export const CKR_ACTION_PARTIES = ["CKR", "CLIENT", "EXTERNAL"] as const;
export type CkrActionParty = (typeof CKR_ACTION_PARTIES)[number];

export const ckrActionPartyLabels: Record<CkrActionParty, string> = {
  CKR: "ЦКР",
  CLIENT: "Клиент",
  EXTERNAL: "Внешняя сторона",
};

export const CKR_OUTCOME_CODES = [
  "SUCCESS",
  "PARTIAL",
  "NO_RESULT",
  "REJECTED",
  "NOT_RELEVANT",
  "UNKNOWN",
] as const;

export type CkrOutcomeCode = (typeof CKR_OUTCOME_CODES)[number];

export const ckrOutcomeLabels: Record<CkrOutcomeCode, string> = {
  SUCCESS: "Успех",
  PARTIAL: "Частичный результат",
  NO_RESULT: "Без результата",
  REJECTED: "Отказ",
  NOT_RELEVANT: "Не подходит",
  UNKNOWN: "Пока неясно",
};

export const ckrOutcomePublic: Record<CkrOutcomeCode, string> = {
  SUCCESS: "Есть положительный результат",
  PARTIAL: "Есть частичный результат",
  NO_RESULT: "Пока без результата",
  REJECTED: "Сторона отказалась",
  NOT_RELEVANT: "Вариант не подошёл",
  UNKNOWN: "Результат уточняется",
};

export const CKR_CLIENT_CTAS = [
  "WANT_CONTACT",
  "INTERESTED",
  "NOT_SUITABLE",
  "NEED_CKR_HELP",
] as const;

export type CkrClientCta = (typeof CKR_CLIENT_CTAS)[number];

export const ckrClientCtaLabels: Record<CkrClientCta, string> = {
  WANT_CONTACT: "Хочу связаться",
  INTERESTED: "Интересно",
  NOT_SUITABLE: "Не подходит",
  NEED_CKR_HELP: "Нужна помощь ЦКР",
};

export const ACTION_EVENT = {
  created: "ACTION_CREATED",
  status: "ACTION_STATUS_CHANGED",
  outcome: "ACTION_OUTCOME_RECORDED",
  clientCta: "CLIENT_ACTION_CTA",
} as const;

export function isCkrActionType(v: string): v is CkrActionType {
  return (CKR_ACTION_TYPES as readonly string[]).includes(v);
}

export function isCkrActionStatus(v: string): v is CkrActionStatus {
  return (CKR_ACTION_STATUSES as readonly string[]).includes(v);
}

export function isCkrOutcomeCode(v: string): v is CkrOutcomeCode {
  return (CKR_OUTCOME_CODES as readonly string[]).includes(v);
}

export function isCkrClientCta(v: string): v is CkrClientCta {
  return (CKR_CLIENT_CTAS as readonly string[]).includes(v);
}

export function isCkrActionParty(v: string): v is CkrActionParty {
  return (CKR_ACTION_PARTIES as readonly string[]).includes(v);
}
