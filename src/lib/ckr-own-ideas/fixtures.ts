import type { OwnIdeaCatalog, OwnIdeaSignal } from "@/types/ckr-own-ideas";

function sig(
  partial: OwnIdeaSignal,
): OwnIdeaSignal {
  return {
    identityKey: partial.identityKey ?? partial.id,
    officialId: partial.officialId ?? null,
    canonicalUrl: partial.canonicalUrl ?? null,
    amount: partial.amount ?? null,
    claimKind: partial.claimKind ?? "FACT",
    sourceType: partial.sourceType ?? "fixture",
    sourceLabel: partial.sourceLabel ?? "fixture",
    sourceUrl: partial.sourceUrl ?? null,
    trustLevel: partial.trustLevel ?? "trusted_secondary",
    region: partial.region ?? "Дагестан",
    industry: partial.industry ?? null,
    tags: partial.tags ?? [],
    ...partial,
  };
}

/** Acceptance #1 — bankruptcy excavator + earthworks + no internal capital. */
export function tractorEarthworksCatalog(): OwnIdeaCatalog {
  const asset = sig({
    id: "sig-asset-excavator",
    kind: "ASSET",
    title: "Экскаватор с банкротных торгов",
    origin: "EXTERNAL",
    officialId: "LOT-EXC-4200",
    canonicalUrl: "https://torgi.example/lot-exc-4200",
    amount: 4_200_000,
    sourceType: "auction",
    sourceLabel: "Банкротные торги",
    sourceUrl: "https://torgi.example/lot-exc-4200",
    trustLevel: "official",
    industry: "construction",
  });
  const demand = sig({
    id: "sig-demand-earth",
    kind: "DEMAND",
    title: "Контракт на земляные работы",
    origin: "EXTERNAL",
    officialId: "CONTRACT-EARTH-8500",
    canonicalUrl: "https://zakupki.example/earth-8500",
    amount: 8_500_000,
    sourceType: "procurement",
    sourceLabel: "Закупка / контракт",
    sourceUrl: "https://zakupki.example/earth-8500",
    trustLevel: "official",
    industry: "construction",
  });
  const externalLease = sig({
    id: "sig-cap-lease",
    kind: "CAPITAL",
    title: "Лизинг спецтехники",
    origin: "EXTERNAL",
    amount: 4_200_000,
    claimKind: "INFERENCE",
    sourceType: "financing",
    sourceLabel: "Лизинговая программа",
    sourceUrl: "https://lease.example/spec",
    trustLevel: "trusted_secondary",
    industry: "construction",
  });
  return {
    signals: [asset, demand],
    internalResources: [],
    externalResources: [externalLease],
  };
}

/** Acceptance #2 — land + tourism demand + no capital. */
export function landTourismCatalog(): OwnIdeaCatalog {
  return {
    signals: [
      sig({
        id: "sig-land",
        kind: "LOCATION",
        title: "Земельный участок под турбазу",
        origin: "EXTERNAL",
        officialId: "LAND-TUR-1",
        amount: 6_000_000,
        sourceType: "property",
        sourceLabel: "Реестр участков",
        trustLevel: "government_open",
        industry: "tourism",
      }),
      sig({
        id: "sig-tourism-demand",
        kind: "DEMAND",
        title: "Туристический спрос / гостиничный проект",
        origin: "EXTERNAL",
        officialId: "TOUR-DEMAND-1",
        amount: 12_000_000,
        sourceType: "market",
        sourceLabel: "Региональный спрос",
        trustLevel: "regional_portal",
        industry: "tourism",
      }),
    ],
    internalResources: [],
    externalResources: [
      sig({
        id: "sig-investor",
        kind: "CAPITAL",
        title: "Инвестор hospitality",
        origin: "EXTERNAL",
        amount: 8_000_000,
        claimKind: "INFERENCE",
        sourceType: "investment",
        sourceLabel: "Инвестиционный интерес",
        trustLevel: "trusted_secondary",
        industry: "tourism",
      }),
    ],
  };
}

/** Acceptance #3 — procurement + no internal supplier + external manufacturer. */
export function procurementCatalog(): OwnIdeaCatalog {
  return {
    signals: [
      sig({
        id: "sig-buy",
        kind: "DEMAND",
        title: "Закупка консервированной продукции",
        origin: "EXTERNAL",
        officialId: "PROC-FOOD-1",
        amount: 3_000_000,
        sourceType: "procurement",
        sourceLabel: "Закупка",
        trustLevel: "official",
        industry: "food",
      }),
    ],
    internalResources: [],
    externalResources: [
      sig({
        id: "sig-factory",
        kind: "SUPPLY",
        title: "Производитель консервов",
        origin: "EXTERNAL",
        officialId: "SUP-FOOD-9",
        amount: 2_200_000,
        sourceType: "supplier",
        sourceLabel: "Каталог производителей",
        trustLevel: "trusted_secondary",
        industry: "food",
      }),
    ],
  };
}

/** Negative — asset 10M, contract 5M, costs dominate. */
export function negativeEconomicsCatalog(): OwnIdeaCatalog {
  return {
    signals: [
      sig({
        id: "sig-asset-10",
        kind: "ASSET",
        title: "Дорогой актив",
        origin: "EXTERNAL",
        officialId: "ASSET-10M",
        amount: 10_000_000,
        sourceType: "auction",
        sourceLabel: "Торги",
        trustLevel: "official",
        industry: "construction",
      }),
      sig({
        id: "sig-demand-5",
        kind: "DEMAND",
        title: "Контракт 5 млн",
        origin: "EXTERNAL",
        officialId: "CON-5M",
        amount: 5_000_000,
        sourceType: "procurement",
        sourceLabel: "Контракт",
        trustLevel: "official",
        industry: "construction",
      }),
    ],
    internalResources: [
      sig({
        id: "sig-cap-internal",
        kind: "CAPITAL",
        title: "Собственные средства пилота",
        origin: "INTERNAL_CKR",
        amount: 10_000_000,
        sourceType: "ckr_internal",
        sourceLabel: "Внутренний капитал",
        trustLevel: "ckr_internal",
        industry: "construction",
      }),
    ],
    externalResources: [],
  };
}

/** Missing financing — keep idea, do not delete. */
export function missingFinancingCatalog(): OwnIdeaCatalog {
  return {
    signals: [
      sig({
        id: "sig-asset-ok",
        kind: "ASSET",
        title: "Склад на торгах",
        origin: "EXTERNAL",
        officialId: "WH-1",
        amount: 3_000_000,
        sourceType: "auction",
        sourceLabel: "Торги",
        trustLevel: "official",
      }),
      sig({
        id: "sig-demand-ok",
        kind: "DEMAND",
        title: "Аренда склада ритейлом",
        origin: "EXTERNAL",
        officialId: "RENT-1",
        amount: 4_800_000,
        sourceType: "market",
        sourceLabel: "Спрос",
        trustLevel: "trusted_secondary",
      }),
    ],
    internalResources: [],
    externalResources: [],
  };
}

export function internalCapitalCatalog(): OwnIdeaCatalog {
  const base = tractorEarthworksCatalog();
  return {
    ...base,
    internalResources: [
      sig({
        id: "sig-internal-investor",
        kind: "CAPITAL",
        title: "Интерес инвестора ЦКР к спецтехнике",
        origin: "INTERNAL_CKR",
        amount: 5_000_000,
        sourceType: "investment_offer",
        sourceLabel: "investment_offers",
        trustLevel: "ckr_internal",
        industry: "construction",
      }),
    ],
    externalResources: [],
  };
}
