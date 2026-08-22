import type { CkrRequestStatus, CkrRequestType } from "@/config/ckr-inbox";
import type { CkrRequest, CkrRequestEvent } from "@/types/ckr-inbox";

/** Human status — never expose raw codes to clients. */
export function describeHumanStatus(input: {
  status: CkrRequestStatus;
  requestType?: CkrRequestType;
}): string {
  const isIdea = input.requestType === "IDEA";
  switch (input.status) {
    case "NEW":
      return isIdea ? "Мы получили вашу идею" : "Мы получили ваше обращение";
    case "IN_REVIEW":
      return isIdea
        ? "ЦКР изучает вашу идею"
        : "ЦКР изучает ваше обращение";
    case "ACCEPTED":
      return "Мы готовы продолжить работу";
    case "IN_PROGRESS":
      return "ЦКР работает над вашим обращением";
    case "WAITING_CLIENT":
      return "Нам нужна информация от вас";
    case "WAITING_EXTERNAL":
      return "ЦКР согласовывает детали";
    case "COMPLETED":
      return "Работа по обращению завершена";
    case "REJECTED":
    case "CANCELLED":
      return "Обращение закрыто";
    default:
      return "ЦКР работает с вашим обращением";
  }
}

/** Human «Сейчас ЦКР» — no raw backend status codes. */
export function describeCkrNow(input: {
  requestType: CkrRequestType;
  status: CkrRequestStatus;
  organizationName?: string | null;
  /** Stage 4K CUSTOM override; empty → AUTO (deterministic). */
  publicActivityText?: string | null;
}): string {
  const custom = (input.publicActivityText || "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (custom) return custom;

  const org = (input.organizationName || "").trim();
  const shortOrg = shortenOrgName(org);
  const { requestType: type, status } = input;

  if (status === "COMPLETED") {
    return shortOrg
      ? `ЦКР завершил работу по обращению «${shortOrg}».`
      : "ЦКР завершил работу по вашему обращению.";
  }
  if (status === "REJECTED" || status === "CANCELLED") {
    return "ЦКР закрыл обращение.";
  }
  if (status === "WAITING_CLIENT") {
    return "ЦКР ждёт уточнений от вас.";
  }
  if (status === "WAITING_EXTERNAL") {
    return "ЦКР согласовывает детали с внешней стороной.";
  }

  if (type === "IDEA") {
    if (status === "NEW" || status === "IN_REVIEW") {
      return "ЦКР изучает вашу идею.";
    }
    return "ЦКР работает с вашей идеей.";
  }

  if (type === "FIND_BUYER") {
    return shortOrg
      ? `ЦКР ищет покупателей для ${shortOrg}.`
      : "ЦКР ищет покупателей.";
  }
  if (type === "FIND_INVESTOR" || type === "INVESTMENT") {
    return shortOrg
      ? `ЦКР подбирает возможные источники финансирования для ${shortOrg}.`
      : "ЦКР подбирает возможные источники финансирования.";
  }
  if (type === "FIND_SUPPLIER") {
    return shortOrg
      ? `ЦКР ищет поставщика для ${shortOrg}.`
      : "ЦКР ищет поставщика.";
  }
  if (type === "FIND_PARTNER") {
    return shortOrg
      ? `ЦКР ищет партнёра для ${shortOrg}.`
      : "ЦКР ищет партнёра.";
  }
  if (type === "PROPERTY") {
    return "ЦКР ищет подходящие помещения.";
  }
  if (type === "EXPERT") {
    return "ЦКР подбирает эксперта.";
  }
  if (type === "PROJECT") {
    return "ЦКР уточняет информацию по вашему проекту.";
  }

  if (status === "NEW" || status === "IN_REVIEW") {
    return "ЦКР изучает ваше обращение.";
  }
  return "ЦКР работает с вашим обращением.";
}

/** «Что нужно от вас» */
export function describeWhatYouNeed(input: {
  status: CkrRequestStatus;
  nextStepPublic?: string | null;
}): { needsAction: boolean; text: string } {
  const custom = (input.nextStepPublic || "").trim();
  if (input.status === "WAITING_CLIENT") {
    return {
      needsAction: true,
      text: custom || "Уточните информацию — ЦКР ждёт ваш ответ.",
    };
  }
  if (custom) {
    const idle =
      /пока ничего|не требуется|работаем с вашим|цкр работает/i.test(custom);
    return { needsAction: !idle, text: custom };
  }
  if (
    input.status === "COMPLETED" ||
    input.status === "REJECTED" ||
    input.status === "CANCELLED"
  ) {
    return {
      needsAction: false,
      text: "От вас ничего не требуется. Обращение закрыто.",
    };
  }
  return {
    needsAction: false,
    text: "Пока ничего. ЦКР работает с вашим обращением.",
  };
}

/** @deprecated alias — use describeWhatYouNeed().text */
export function describeNextStepPublic(input: {
  status: CkrRequestStatus;
  nextStepPublic?: string | null;
}): string {
  return describeWhatYouNeed(input).text;
}

export type ClientProgressStep = "received" | "review" | "work" | "result";

export function progressStepForStatus(status: CkrRequestStatus): ClientProgressStep {
  if (status === "NEW") return "received";
  if (status === "IN_REVIEW" || status === "ACCEPTED") return "review";
  if (
    status === "IN_PROGRESS" ||
    status === "WAITING_CLIENT" ||
    status === "WAITING_EXTERNAL"
  ) {
    return "work";
  }
  return "result";
}

export const CLIENT_PROGRESS_LABELS: Record<ClientProgressStep, string> = {
  received: "Получено",
  review: "Изучаем",
  work: "Работаем",
  result: "Результат",
};

export const CLIENT_PROGRESS_ORDER: ClientProgressStep[] = [
  "received",
  "review",
  "work",
  "result",
];

/** Short title for list/cards — never technical. */
export function describeRequestTitle(input: {
  subject?: string | null;
  body?: string | null;
  requestType: CkrRequestType;
  organizationName?: string | null;
}): string {
  const org = shortenOrgName((input.organizationName || "").trim());
  if (org) return org;
  const subject = (input.subject || "").trim();
  if (
    subject &&
    !/^Партнёрство/i.test(subject) &&
    !/^Идея ·/i.test(subject) &&
    subject.length <= 80
  ) {
    return subject;
  }
  const body = (input.body || "").trim().replace(/\s+/g, " ");
  if (body) {
    return body.length > 72 ? `${body.slice(0, 72).trim()}…` : body;
  }
  return input.requestType === "IDEA" ? "Ваша идея" : "Обращение в ЦКР";
}

export function shortenOrgName(name: string): string {
  if (!name) return "";
  // ООО "Тинда" → ТИНДА for familiar display when short brand-like
  const quoted = name.match(/["«]([^"»]+)["»]/);
  if (quoted?.[1]) {
    const brand = quoted[1].trim();
    if (brand.length <= 24) return brand.toLocaleUpperCase("ru-RU");
  }
  return name;
}

export function humanizeClientEvent(event: CkrRequestEvent): string | null {
  const type = event.eventType;
  const title = (event.title || "").trim();

  // Hide internal technical events even if somehow CLIENT-visible
  if (
    [
      "NEED_CREATED",
      "NEED_LINKED",
      "LIA_BRIEF",
      "TASK_CREATED",
      "DEAL_CREATED",
      "ASSIGNED",
      "CONTACT_ADDED",
    ].includes(type)
  ) {
    return null;
  }

  if (type === "APPLICATION_CREATED" || /создан/i.test(title)) {
    return "Вы отправили обращение";
  }
  if (type === "CLAIMED") {
    return "Обращение привязано к вашему кабинету";
  }
  if (type === "STATUS_CHANGED") {
    if (/IN_REVIEW|на рассмотрении/i.test(title + event.detail)) {
      return "ЦКР принял обращение в работу";
    }
    if (/IN_PROGRESS|в работе/i.test(title + event.detail)) {
      return "ЦКР начал работу по обращению";
    }
    if (/WAITING_CLIENT/i.test(title + event.detail)) {
      return "ЦКР запросил дополнительную информацию";
    }
    if (/COMPLETED/i.test(title + event.detail)) {
      return "Работа по обращению завершена";
    }
    return "Статус обращения обновлён";
  }
  if (type === "CANDIDATE_SHARED") {
    return event.detail
      ? `ЦКР нашёл новый вариант: ${event.detail}`
      : "ЦКР нашёл новый вариант";
  }
  if (type === "CLIENT_MESSAGE") {
    if (/дополнил/i.test(title)) return "Вы дополнили идею";
    if (/написал/i.test(title) || /сообщени/i.test(title)) {
      return title;
    }
    return title || "Сообщение по обращению";
  }
  if (type === "PUBLIC_ACTIVITY_UPDATED" || type === "NEXT_STEP_UPDATED") {
    return "ЦКР обновил информацию по вашему обращению.";
  }
  if (type === "COMMENT_ADDED") {
    return null;
  }
  // Prefer human titles already written for CLIENT visibility
  if (title && !/[A-Z_]{3,}/.test(title)) return title;
  return title || null;
}

/** Detect Stage 4L owner-shared demand candidate message (CLIENT comment body). */
export function isSharedCandidateMessage(body: string): boolean {
  return /ЦКР нашёл вариант, который может быть вам интересен/i.test(body || "");
}

export function formatClientDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

/** Attention-first sort for multi-request dashboards. */
export function sortRequestsForClient(items: CkrRequest[]): CkrRequest[] {
  const rank = (s: CkrRequestStatus) => {
    switch (s) {
      case "WAITING_CLIENT":
        return 0;
      case "NEW":
        return 1;
      case "IN_REVIEW":
        return 2;
      case "ACCEPTED":
        return 3;
      case "IN_PROGRESS":
        return 4;
      case "WAITING_EXTERNAL":
        return 5;
      case "COMPLETED":
        return 6;
      default:
        return 7;
    }
  };
  return [...items].sort((a, b) => {
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
