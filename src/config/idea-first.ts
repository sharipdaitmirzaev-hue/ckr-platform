/** Stage 4H — Idea-first public entry & progressive cabinet */

export const IDEA_FORM = {
  title: "Расскажите нам вашу идею",
  subtitle:
    "Не обязательно иметь готовый бизнес-план. Опишите своими словами, что хотите сделать, что у вас уже есть и чего не хватает. ЦКР изучит идею и предложит следующие шаги.",
  cta: "Рассказать идею",
  submit: "Отправить идею",
  nameLabel: "Ваше имя",
  ideaLabel: "Расскажите нам вашу идею",
  ideaPlaceholder:
    "Например: хочу открыть небольшое производство в Дагестане. Есть помещение и часть оборудования, но нужен инвестор и помощь с запуском.",
  thanksTitle: "Спасибо, {name}.",
  thanksBody: "Ваша идея передана в ЦКР.",
  thanksNext: "Мы изучим её и определим возможные следующие шаги.",
  contactPrompt: "Оставьте контакт, если хотите получить ответ ЦКР.",
  contactOptional: "Не сейчас",
  createCabinet: "Создать личный кабинет",
  leaveContact: "Оставить контакт",
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
