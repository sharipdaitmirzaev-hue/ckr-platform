import { INTENT_LABELS, NEED_INTENT_TYPES } from "@/types/need-profile";

/** Onboarding cards — Napartner-simple first screen. */
export const NEED_ONBOARDING_CARDS = [
  { intentType: "INVEST", label: "Вложить деньги" },
  { intentType: "SEEK_INVESTMENT", label: "Найти инвестора" },
  { intentType: "BUY_BUSINESS", label: "Купить бизнес" },
  { intentType: "SELL_BUSINESS", label: "Продать бизнес" },
  { intentType: "SEEK_PROJECT", label: "Найти проект" },
  { intentType: "SEEK_PARTNER", label: "Найти партнёра" },
  { intentType: "SEEK_SUPPLIER", label: "Найти поставщика" },
  { intentType: "SEEK_BUYER", label: "Найти покупателя" },
  { intentType: "BUY_PROPERTY", label: "Найти помещение/землю" },
  { intentType: "SELL_PROPERTY", label: "Продать помещение/землю" },
  { intentType: "SEEK_EQUIPMENT", label: "Найти оборудование" },
  { intentType: "SELL_EQUIPMENT", label: "Продать оборудование" },
  { intentType: "SEEK_SUPPORT", label: "Найти господдержку" },
  { intentType: "SEEK_CONTRACT", label: "Найти контракт/заказ" },
  { intentType: "DEMAND", label: "Другое" },
] as const;

export function intentLabel(code: string): string {
  return INTENT_LABELS[code] || code;
}

export { NEED_INTENT_TYPES };
