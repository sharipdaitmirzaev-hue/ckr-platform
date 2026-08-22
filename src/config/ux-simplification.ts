/**
 * UX Simplification B (BALANCED) — presentation vocabulary.
 * No backend changes. Raw codes stay in DB.
 */

export const CLIENT_STATUS_LABELS = {
  received: "Получено",
  reviewing: "Рассматриваем",
  in_progress: "В работе",
  need_info: "Нужна информация",
  has_result: "Есть результат",
  done: "Завершено",
} as const;

/** Need profile status → client/operator human label. */
export function humanNeedStatus(status: string): string {
  switch (String(status).toUpperCase()) {
    case "DRAFT":
      return CLIENT_STATUS_LABELS.received;
    case "ACTIVE":
      return CLIENT_STATUS_LABELS.in_progress;
    case "PAUSED":
      return CLIENT_STATUS_LABELS.need_info;
    case "FULFILLED":
      return CLIENT_STATUS_LABELS.has_result;
    case "ARCHIVED":
      return CLIENT_STATUS_LABELS.done;
    default:
      return CLIENT_STATUS_LABELS.in_progress;
  }
}

export const UX_CTA = {
  sendIdea: "Отправить идею",
  newRequest: "Новое обращение",
  open: "Открыть",
  replyCkr: "Ответить ЦКР",
  findVariants: "Найти варианты",
  showClient: "Показать клиенту",
  save: "Сохранить",
  details: "Подробнее",
  login: "Войти",
} as const;
