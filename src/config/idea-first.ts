/** Stage 4H/4I — Idea-first public entry & progressive cabinet */

export const IDEA_FORM = {
  title: "Расскажите нам вашу идею",
  subtitle:
    "Опишите своими словами, что хотите сделать. Не нужно выбирать тип проекта, отрасль или бюджет — ЦКР разберётся с этим позже. Регистрация не нужна.",
  cta: "Расскажите нам вашу идею",
  submit: "Далее",
  nameLabel: "Имя",
  ideaLabel: "Расскажите, что вы хотите сделать",
  ideaPlaceholder:
    "Например: хочу построить небольшую гостиницу в Дагестане. Ищу землю и инвестора.",
  contactTitle: "Как с вами связаться?",
  contactPrompt:
    "Оставьте любой удобный способ связи, если хотите получить ответ ЦКР. Достаточно одного.",
  contactPhoneLabel: "Телефон / WhatsApp",
  contactEmailLabel: "Электронная почта",
  contactTelegramLabel: "Telegram",
  contactSubmit: "Отправить идею",
  contactSkip: "Продолжить без контактов",
  thanksTitle: "Спасибо, {name}. Мы получили вашу идею.",
  thanksBody: "ЦКР рассмотрит её и определит, чем может помочь.",
  thanksNext:
    "Создайте аккаунт, чтобы следить за рассмотрением идеи, получать ответы ЦКР и продолжить работу.",
  createCabinet: "Создать аккаунт",
  doLater: "Сделать это позже",
  leaveContact: "Оставить контакт",
  contactOptional: "Не сейчас",
  maxIdeaLength: 8000,
  minIdeaLength: 20,
  minNameLength: 2,
  claimCookie: "ckr_idea_claim",
  claimHours: 72,
} as const;

export const CKR_ACCESS_LEVELS = ["basic", "standard", "advanced"] as const;
export type CkrAccessLevel = (typeof CKR_ACCESS_LEVELS)[number];

export function isCkrAccessLevel(v: string): v is CkrAccessLevel {
  return (CKR_ACCESS_LEVELS as readonly string[]).includes(v);
}
