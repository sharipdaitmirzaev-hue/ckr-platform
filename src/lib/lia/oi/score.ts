import type {
  LiaOiCandidate,
  LiaOiPriority,
  LiaOiScore,
  LiaOiScoreBreakdown,
  LiaOiSearchPlan,
} from "@/types/lia-oi";

function clamp(n: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n));
}

export function emptyScore(): LiaOiScore {
  return {
    overall: 0,
    confidence: 0,
    breakdown: {
      market: 0,
      economics: 0,
      location: 0,
      demand: 0,
      competition: 0,
      execution: 0,
      legal: 0,
      sourceConfidence: 0,
      dataCompleteness: 0,
      strategicFit: 0,
    },
    explanation: ["Оценка ещё не выполнена."],
    priority: "NORMAL",
  };
}

function priorityFrom(overall: number, confidence: number): LiaOiPriority {
  if (overall >= 75 && confidence >= 55) return "HIGH_PRIORITY";
  if (overall >= 60) return "INTERESTING";
  return "NORMAL";
}

/** Explainable scoring: потенциал и достоверность раздельно. */
export function scoreCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): LiaOiScore {
  const explanation: string[] = [];
  const b: LiaOiScoreBreakdown = {
    market: 5,
    economics: 5,
    location: 5,
    demand: 5,
    competition: 5,
    execution: 5,
    legal: 4,
    sourceConfidence: 3,
    dataCompleteness: 4,
    strategicFit: 5,
  };

  // Stub sources → низкая sourceConfidence
  if (candidate.sources.every((s) => s.isStub)) {
    b.sourceConfidence = 3;
    explanation.push(
      "Источник stub/demo: уверенность в данных ограничена (не live-интернет).",
    );
  }

  const price = candidate.investmentRequired ?? candidate.askingPrice;
  if (price != null) {
    b.dataCompleteness = clamp(b.dataCompleteness + 2);
    b.economics = clamp(6 + (price >= 100_000 && price <= 100_000_000 ? 2 : 0));
    explanation.push(
      `Указан ориентир цены/инвестиций: ${price.toLocaleString("ru-RU")} ₽ (FACT из stub).`,
    );
  } else {
    b.economics = 4;
    b.dataCompleteness = clamp(b.dataCompleteness - 1);
    explanation.push("Цена/инвестиции не указаны — economics снижен (UNKNOWN).");
  }

  if (plan?.budgetMax && price != null) {
    if (price <= plan.budgetMax) {
      b.strategicFit = clamp(b.strategicFit + 3);
      explanation.push("Вписывается в бюджет запроса владельца.");
    } else if (price <= plan.budgetMax * 1.25) {
      b.strategicFit = clamp(b.strategicFit + 1);
      explanation.push("Чуть выше бюджета запроса — возможен торг/доля.");
    } else {
      b.strategicFit = clamp(b.strategicFit - 2);
      explanation.push("Существенно выше бюджета запроса.");
    }
  }

  if (candidate.region && plan?.regions?.length) {
    const hit = plan.regions.some(
      (r) =>
        r === "Россия" ||
        candidate.region?.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(candidate.region!.toLowerCase()),
    );
    if (hit) {
      b.location = 8;
      explanation.push(`Регион совпадает с планом поиска (${candidate.region}).`);
    }
  }

  if (candidate.sources.length > 1) {
    b.sourceConfidence = clamp(b.sourceConfidence + 1);
    explanation.push(
      `Найдено в ${candidate.sources.length} источниках (после dedup).`,
    );
  }

  if (/туризм|гостиниц|производ|логист/i.test(candidate.industry ?? "")) {
    b.market = 7;
    b.demand = 6;
  }

  // Legal всегда осторожно на stub
  b.legal = 4;
  explanation.push(
    "Юридическая чистота не проверена — требуется due diligence (UNKNOWN).",
  );

  const weights: Array<keyof LiaOiScoreBreakdown> = [
    "market",
    "economics",
    "location",
    "demand",
    "competition",
    "execution",
    "legal",
    "sourceConfidence",
    "dataCompleteness",
    "strategicFit",
  ];
  const avg =
    weights.reduce((sum, key) => sum + b[key], 0) / weights.length;
  const overall = Math.round(avg * 10);
  const confidence = Math.round(
    ((b.sourceConfidence + b.dataCompleteness + b.legal) / 3) * 10,
  );

  explanation.push(
    `Потенциал ${overall}/100 и уверенность ${confidence}/100 — разные шкалы.`,
  );

  return {
    overall,
    confidence,
    breakdown: b,
    explanation,
    priority: priorityFrom(overall, confidence),
  };
}
