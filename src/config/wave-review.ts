/** Closed Wave Review (этап 44). */

export const NEXT_WAVE_DECISIONS = [
  "continue_closed",
  "expand_beta",
  "public_ready",
  "needs_improvement",
] as const;

export type NextWaveDecision = (typeof NEXT_WAVE_DECISIONS)[number];

export const nextWaveDecisionLabels: Record<NextWaveDecision, string> = {
  continue_closed: "Продолжить closed wave",
  expand_beta: "Расширить beta",
  public_ready: "Готовы к public",
  needs_improvement: "Нужны улучшения",
};

export const nextWaveDecisionHints: Record<NextWaveDecision, string> = {
  continue_closed:
    "Держать Closed Wave 1 — ТИНДА active: донастроить сценарии и цели.",
  expand_beta:
    "Расширить когорту closed/beta при стабильных целях и без critical блокеров.",
  public_ready:
    "Метрики и UX достаточны для планирования public / Wave 2.",
  needs_improvement:
    "Сначала закрыть product_improvements и failed-цели — запуск следующей волны рано.",
};

export function isNextWaveDecision(value: string): value is NextWaveDecision {
  return (NEXT_WAVE_DECISIONS as readonly string[]).includes(value);
}
