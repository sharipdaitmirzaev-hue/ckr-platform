import { findMissingResource } from "@/lib/ckr-own-ideas/search";
import type { OwnIdeaSignal } from "@/types/ckr-own-ideas";

export const FINANCING_SAFE_WORDING =
  "потенциальный вариант финансирования — требует проверки, одобрение не обещано";

export function financingFitNote(signal: OwnIdeaSignal): string {
  const bits = [
    signal.amount != null ? `сумма ~${signal.amount.toLocaleString("ru-RU")} ₽` : "сумма UNKNOWN",
    signal.region ? `регион ${signal.region}` : "регион UNKNOWN",
    signal.industry ? `отрасль ${signal.industry}` : "отрасль UNKNOWN",
    FINANCING_SAFE_WORDING,
  ];
  return bits.join("; ");
}

export function searchFinancing(input: {
  query: string;
  amountNeeded: number | null;
  internal: OwnIdeaSignal[];
  external: OwnIdeaSignal[];
  context?: OwnIdeaSignal[];
}) {
  const result = findMissingResource({
    kind: "CAPITAL",
    query: input.query,
    internal: input.internal,
    external: input.external,
    context: input.context,
  });
  return {
    ...result,
    wording: FINANCING_SAFE_WORDING,
  };
}
