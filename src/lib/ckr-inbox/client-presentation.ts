import type { CkrRequestStatus, CkrRequestType } from "@/config/ckr-inbox";

/** Human «Сейчас ЦКР» — no raw backend status codes. */
export function describeCkrNow(input: {
  requestType: CkrRequestType;
  status: CkrRequestStatus;
  organizationName?: string | null;
}): string {
  const org = (input.organizationName || "").trim();
  const { requestType: type, status } = input;

  if (status === "COMPLETED") {
    return org
      ? `Завершил работу по обращению «${org}»`
      : "Завершил работу по вашему обращению";
  }
  if (status === "REJECTED" || status === "CANCELLED") {
    return "Закрыл обращение";
  }
  if (status === "WAITING_CLIENT") {
    return "Ждёт уточнений от вас";
  }
  if (status === "WAITING_EXTERNAL") {
    return "Согласовывает детали с внешней стороной";
  }

  if (type === "IDEA") {
    if (status === "NEW" || status === "IN_REVIEW") {
      return "Оценивает вашу идею";
    }
    return "Работает с вашей идеей";
  }

  if (type === "FIND_BUYER") {
    return org ? `Ищет покупателей для ${org}` : "Ищет покупателей";
  }
  if (type === "FIND_INVESTOR" || type === "INVESTMENT") {
    return org ? `Ищет инвестора для ${org}` : "Ищет инвестора";
  }
  if (type === "FIND_SUPPLIER") {
    return org ? `Ищет поставщика для ${org}` : "Ищет поставщика";
  }
  if (type === "FIND_PARTNER") {
    return org ? `Ищет партнёра для ${org}` : "Ищет партнёра";
  }
  if (type === "PROPERTY") {
    return "Помогает с помещением или землёй";
  }
  if (type === "EXPERT") {
    return "Подбирает эксперта";
  }

  if (status === "NEW" || status === "IN_REVIEW") {
    return "Рассматривает ваше обращение";
  }
  return "Работает с вашим обращением";
}

/** Human «Следующий шаг» fallback when operator left next_step_public empty. */
export function describeNextStepPublic(input: {
  status: CkrRequestStatus;
  nextStepPublic?: string | null;
}): string {
  const custom = (input.nextStepPublic || "").trim();
  if (custom) return custom;

  switch (input.status) {
    case "WAITING_CLIENT":
      return "Уточните информацию — ЦКР ждёт ваш ответ.";
    case "WAITING_EXTERNAL":
      return "От вас пока ничего не требуется. ЦКР согласовывает детали.";
    case "COMPLETED":
      return "Обращение завершено. Если нужна новая помощь — расскажите идею.";
    case "REJECTED":
    case "CANCELLED":
      return "Обращение закрыто. Можно создать новое.";
    default:
      return "От вас пока ничего не требуется. ЦКР работает с вашим обращением.";
  }
}
