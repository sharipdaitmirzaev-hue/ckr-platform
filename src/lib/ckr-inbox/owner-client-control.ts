import type { CkrRequestStatus, CkrRequestType } from "@/config/ckr-inbox";
import { ckrRequestStatusLabels } from "@/config/ckr-inbox";
import {
  describeCkrNow,
  describeHumanStatus,
  describeWhatYouNeed,
} from "@/lib/ckr-inbox/client-presentation";

export const PUBLIC_ACTIVITY_MAX_LEN = 280;
export const NEXT_STEP_PUBLIC_MAX_LEN = 400;
export const CLIENT_MESSAGE_MAX_LEN = 2000;

/** Canonical idle copy clients see when nothing is required. */
export const IDLE_WHAT_YOU_NEED =
  "Пока ничего. ЦКР работает с вашим обращением.";

export const PUBLIC_ACTIVITY_TEMPLATES = [
  "ЦКР изучает ваше обращение.",
  "ЦКР ищет покупателей.",
  "ЦКР ищет инвестора.",
  "ЦКР подбирает подходящие проекты.",
  "ЦКР ищет поставщиков.",
  "ЦКР проверяет доступные меры поддержки.",
  "ЦКР рассматривает найденные варианты.",
] as const;

export const NEXT_STEP_TEMPLATES = [
  "Пока ничего. Мы работаем с вашим обращением.",
  "Уточните бюджет.",
  "Уточните регион.",
  "Добавьте контакт для связи.",
  "Пришлите дополнительную информацию.",
  "Посмотрите найденные варианты и сообщите, какие интересны.",
] as const;

export const CLIENT_MESSAGE_TEMPLATES = [
  "Ваше обращение принято в работу.",
  "Нам нужна дополнительная информация.",
  "Мы нашли несколько вариантов и продолжаем проверку.",
  "Работа по вашему обращению завершена.",
] as const;

export type OwnerScenarioId =
  | "accepted_in_work"
  | "need_info"
  | "found_options";

export type OwnerScenario = {
  id: OwnerScenarioId;
  label: string;
  status?: CkrRequestStatus;
  publicActivityText?: string;
  /** null = clear next step; undefined = leave unchanged */
  nextStepPublic?: string | null;
  clientMessage?: string;
  description: string;
};

export const OWNER_SCENARIOS: OwnerScenario[] = [
  {
    id: "accepted_in_work",
    label: "Приняли в работу",
    status: "IN_PROGRESS",
    publicActivityText: "ЦКР начал работу с вашим обращением.",
    clientMessage: "Ваше обращение принято в работу.",
    description: "Статус → В работе, публичная активность и сообщение клиенту.",
  },
  {
    id: "need_info",
    label: "Нужна информация",
    status: "WAITING_CLIENT",
    clientMessage: "Нам нужно уточнить несколько деталей по вашему обращению.",
    description:
      "Статус → Ждём клиента. Укажите next step перед применением.",
  },
  {
    id: "found_options",
    label: "Нашли варианты",
    publicActivityText: "ЦКР подобрал варианты по вашему запросу.",
    description: "Обновляет «Сейчас ЦКР», статус не меняет автоматически.",
  },
];

/** Strip HTML / control chars; plain text only. */
export function sanitizePublicText(
  raw: string,
  maxLen: number,
): { ok: true; text: string } | { ok: false; error: string } {
  let text = String(raw ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  text = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  if (text.length > maxLen) {
    return {
      ok: false,
      error: `Текст слишком длинный (макс. ${maxLen} символов).`,
    };
  }
  return { ok: true, text };
}

export function resolvePublicActivityMode(
  publicActivityText?: string | null,
): "AUTO" | "CUSTOM" {
  return (publicActivityText || "").trim() ? "CUSTOM" : "AUTO";
}

export function waitingClientNeedsNextStepWarning(input: {
  status: CkrRequestStatus;
  nextStepPublic?: string | null;
}): boolean {
  if (input.status !== "WAITING_CLIENT") return false;
  return !(input.nextStepPublic || "").trim();
}

export type ClientFacingPreview = {
  statusLabel: string;
  humanStatus: string;
  ckrNow: string;
  ckrNowMode: "AUTO" | "CUSTOM";
  whatYouNeed: string;
  needsAction: boolean;
  lastClientMessage: string;
};

export function buildClientFacingPreview(input: {
  status: CkrRequestStatus;
  requestType: CkrRequestType;
  organizationName?: string | null;
  publicActivityText?: string | null;
  nextStepPublic?: string | null;
  lastClientMessage?: string | null;
}): ClientFacingPreview {
  const ckrNow = describeCkrNow({
    requestType: input.requestType,
    status: input.status,
    organizationName: input.organizationName,
    publicActivityText: input.publicActivityText,
  });
  const need = describeWhatYouNeed({
    status: input.status,
    nextStepPublic: input.nextStepPublic,
  });
  return {
    statusLabel: ckrRequestStatusLabels[input.status],
    humanStatus: describeHumanStatus({
      status: input.status,
      requestType: input.requestType,
    }),
    ckrNow,
    ckrNowMode: resolvePublicActivityMode(input.publicActivityText),
    whatYouNeed: need.text,
    needsAction: need.needsAction,
    lastClientMessage: (input.lastClientMessage || "").trim() || "—",
  };
}

export function describeScenarioChanges(
  scenario: OwnerScenario,
  current: {
    status: CkrRequestStatus;
    publicActivityText: string;
    nextStepPublic: string;
  },
  nextStepOverride?: string,
): string[] {
  const lines: string[] = [];
  if (scenario.status && scenario.status !== current.status) {
    lines.push(
      `Статус: ${ckrRequestStatusLabels[current.status]} → ${ckrRequestStatusLabels[scenario.status]}`,
    );
  }
  if (scenario.publicActivityText !== undefined) {
    lines.push(`Сейчас ЦКР: «${scenario.publicActivityText}»`);
  }
  if (scenario.id === "need_info") {
    const step = (nextStepOverride || current.nextStepPublic || "").trim();
    lines.push(
      step
        ? `Что нужно от вас: «${step}»`
        : "Что нужно от вас: (укажите текст перед применением)",
    );
  } else if (scenario.nextStepPublic !== undefined) {
    lines.push(
      scenario.nextStepPublic === null || scenario.nextStepPublic === ""
        ? "Что нужно от вас: сброс (ничего не требуется)"
        : `Что нужно от вас: «${scenario.nextStepPublic}»`,
    );
  }
  if (scenario.clientMessage) {
    lines.push(`Сообщение клиенту: «${scenario.clientMessage}»`);
  }
  return lines;
}
