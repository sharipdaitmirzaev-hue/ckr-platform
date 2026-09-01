import { addMoney, inferenceMoney, money, unknownMoney } from "@/lib/ckr-own-ideas/money";
import type {
  OwnIdeaComponent,
  OwnIdeaEconomics,
  OwnIdeaMoney,
} from "@/types/ckr-own-ideas";

const DISCLAIMER =
  "Ориентировочный расчёт. Не является гарантией прибыли, одобрения кредита или безрисковой инвестицией. Часть данных требует проверки.";

function unknownCount(items: OwnIdeaMoney[]): number {
  return items.filter((i) => i.kind === "UNKNOWN" || i.amount == null).length;
}

export function computeRoughEconomics(
  components: OwnIdeaComponent[],
): OwnIdeaEconomics {
  const assets = components.filter((c) => c.kind === "ASSET" && c.found);
  const demand = components.filter((c) => c.kind === "DEMAND" && c.found);
  const capital = components.filter((c) => c.kind === "CAPITAL" && c.found);

  const capex = assets.reduce(
    (acc, c) => (c.amount ? addMoney(acc, c.amount) : acc),
    unknownMoney("стоимость актива не подтверждена"),
  );
  const revenue = demand.reduce(
    (acc, c) => (c.amount ? addMoney(acc, c.amount) : acc),
    unknownMoney("выручка контракта не подтверждена"),
  );
  const financing = capital.reduce(
    (acc, c) => (c.amount ? addMoney(acc, c.amount) : acc),
    unknownMoney("финансирование не подтверждено"),
  );

  const workingCapital =
    capex.amount != null
      ? inferenceMoney(Math.round(capex.amount * 0.1), "оборотный капитал ~10% CAPEX, оценка")
      : unknownMoney("оборотный капитал неизвестен");

  const variableCosts =
    revenue.amount != null
      ? inferenceMoney(
          Math.round(revenue.amount * 0.35),
          "основные переменные расходы ~35% выручки, оценка",
        )
      : unknownMoney("переменные расходы неизвестны");

  const fixedCosts = unknownMoney("постоянные расходы не заданы — не выдуманы");
  const financingCost = unknownMoney(
    "ставка / лизинговый платёж неизвестны — не обещаем одобрение",
  );

  let profit: OwnIdeaMoney = unknownMoney("прибыль нельзя посчитать без FACT/INFERENCE входа");
  const criticalUnknown =
    fixedCosts.kind === "UNKNOWN" || financingCost.kind === "UNKNOWN";
  if (revenue.amount != null && capex.amount != null && !criticalUnknown) {
    const costs = (variableCosts.amount ?? 0) + (fixedCosts.amount ?? 0);
    profit = inferenceMoney(
      revenue.amount - costs - (workingCapital.amount ?? 0),
      "ориентировочная прибыль = выручка − известные расходы − оборотный капитал",
    );
  } else if (revenue.amount != null && capex.amount != null && criticalUnknown) {
    profit = unknownMoney(
      "чистая прибыль не считается: топливо/налог/зарплата/ставка UNKNOWN — не создаём ложную точность",
    );
  }

  let marginPct: OwnIdeaMoney = unknownMoney("маржа неизвестна");
  if (profit.amount != null && revenue.amount && revenue.amount > 0) {
    marginPct = inferenceMoney(
      Math.round((profit.amount / revenue.amount) * 1000) / 10,
      "ориентировочная маржа",
    );
  }

  let paybackMonths: OwnIdeaMoney = unknownMoney("окупаемость неизвестна");
  const entry =
    capex.amount != null
      ? (capex.amount ?? 0) + (workingCapital.amount ?? 0)
      : null;
  if (entry != null && profit.amount != null && profit.amount > 0) {
    paybackMonths = inferenceMoney(
      Math.max(1, Math.round((entry / profit.amount) * 12)),
      "примерный срок окупаемости, мес.",
    );
  }

  const items = [
    capex,
    workingCapital,
    financing,
    revenue,
    variableCosts,
    fixedCosts,
    financingCost,
    profit,
  ];
  const unknowns = unknownCount(items);

  let scenarios: OwnIdeaEconomics["scenarios"] = null;
  if (profit.amount != null && unknowns <= 3) {
    scenarios = {
      conservative: inferenceMoney(Math.round(profit.amount * 0.7), "консервативный"),
      base: inferenceMoney(profit.amount, "базовый"),
      optimistic: inferenceMoney(Math.round(profit.amount * 1.2), "оптимистичный"),
    };
  }

  return {
    capex: capex.amount == null ? capex : money(capex.amount, capex.kind, capex.note),
    workingCapital,
    financing,
    revenue,
    variableCosts,
    fixedCosts,
    financingCost,
    profit,
    marginPct,
    paybackMonths,
    scenarios,
    unknownCount: unknowns,
    disclaimer: DISCLAIMER,
  };
}

export function isNegativeEconomics(e: OwnIdeaEconomics): boolean {
  if (e.revenue.amount == null || e.capex.amount == null) return false;
  const costs = (e.variableCosts.amount ?? 0) + (e.fixedCosts.amount ?? 0);
  return e.revenue.amount - costs <= 0 || e.revenue.amount < e.capex.amount * 0.7;
}

export function formatMoneyRu(m: OwnIdeaMoney): string {
  if (m.amount == null || m.kind === "UNKNOWN") return "UNKNOWN";
  const mln = m.amount / 1_000_000;
  const prefix = m.kind === "INFERENCE" ? "~" : "";
  if (mln >= 0.1) return `${prefix}${mln.toFixed(1)} млн`;
  return `${prefix}${m.amount.toLocaleString("ru-RU")} ₽`;
}

export function formatPaybackMonths(m: OwnIdeaMoney): string {
  if (m.amount == null || m.kind === "UNKNOWN") return "UNKNOWN";
  const prefix = m.kind === "INFERENCE" ? "~" : "";
  return `${prefix}${m.amount} мес`;
}

export function hasGuaranteedProfitWording(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("гарантированная прибыль") ||
    t.includes("безрисковая") ||
    t.includes("одобренный кредит")
  );
}
