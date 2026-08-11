/**
 * Stage 4F — Top-10 real Dagestan seed candidates for manual owner seed.
 * NOT auto-imported to production. Public sources only; UNKNOWN stays UNKNOWN.
 */

export type DagestanSeedCandidate = {
  id: string;
  name: string;
  type: "company" | "government" | "supplier" | "other";
  industry: string;
  region: string;
  city?: string;
  source: string;
  sourceUrl: string;
  whyUseful: string;
  couldOffer: string;
  couldNeed: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
};

export const DAGESTAN_SEED_CANDIDATES: DagestanSeedCandidate[] = [
  {
    id: "seed_dag_mb05",
    name: "Центр «Мой бизнес» Республики Дагестан (ГАУ ЦПП РД)",
    type: "government",
    industry: "support",
    region: "Дагестан",
    city: "Махачкала",
    source: "official site",
    sourceUrl: "https://mb05.ru/",
    whyUseful: "Оператор мер поддержки МСП — якорь SEEK_SUPPORT.",
    couldOffer: "консультации, программы поддержки, сопровождение",
    couldNeed: "кейсы предпринимателей, партнёры по обучению",
    confidence: "HIGH",
    notes: "Не путать с выдуманным mbdag.ru",
  },
  {
    id: "seed_dag_invest_portal",
    name: "Инвестиционный портал Республики Дагестан",
    type: "government",
    industry: "investment",
    region: "Дагестан",
    city: "Махачкала",
    source: "official portal",
    sourceUrl: "https://dagestaninvest.ru/",
    whyUseful: "Каталог инвестпроектов для INVEST / SEEK_PROJECT.",
    couldOffer: "инвестпроекты, площадки, сопровождение «одно окно»",
    couldNeed: "инвесторы, соинвесторы",
    confidence: "HIGH",
    notes: "67+ проектов на портале — seed отдельных проектов вручную",
  },
  {
    id: "seed_dag_msp_agency",
    name: "Агентство по предпринимательству и инвестициям РД",
    type: "government",
    industry: "investment",
    region: "Дагестан",
    city: "Махачкала",
    source: "official site",
    sourceUrl: "https://mspinvestrd.ru/",
    whyUseful: "Оператор политики МСП/инвестиций.",
    couldOffer: "субсидии МСП, инвестсопровождение",
    couldNeed: "заявки бизнеса",
    confidence: "HIGH",
    notes: "",
  },
  {
    id: "seed_dag_minec",
    name: "Министерство экономики и территориального развития РД",
    type: "government",
    industry: "government",
    region: "Дагестан",
    city: "Махачкала",
    source: "official subdomain",
    sourceUrl: "https://minec.e-dag.ru/",
    whyUseful: "Официальные объявления/экономика региона.",
    couldOffer: "программы развития, объявления",
    couldNeed: "—",
    confidence: "HIGH",
    notes: "Не выдумывать ИНН органа",
  },
  {
    id: "seed_dag_mcx",
    name: "Министерство сельского хозяйства и продовольствия РД",
    type: "government",
    industry: "agriculture",
    region: "Дагестан",
    city: "Махачкала",
    source: "official site",
    sourceUrl: "https://mcxrd.ru/",
    whyUseful: "АПК/переработка — food & beverage цепочка.",
    couldOffer: "меры поддержки АПК",
    couldNeed: "поставщики/переработчики (как контекст экосистемы)",
    confidence: "HIGH",
    notes: "",
  },
  {
    id: "seed_dag_cpp",
    name: "Центр поддержки предпринимательства РД",
    type: "government",
    industry: "support",
    region: "Дагестан",
    city: "Махачкала",
    source: "official site",
    sourceUrl: "https://cppdag.ru/",
    whyUseful: "Связан с Мой бизнес; региональные меры.",
    couldOffer: "региональная поддержка",
    couldNeed: "—",
    confidence: "MEDIUM",
    notes: "Проверить актуальность программ перед seed opportunity",
  },
  {
    id: "seed_dag_beverage_cluster",
    name: "Производители напитков / воды Дагестана (кластер для ручного отбора)",
    type: "company",
    industry: "beverage",
    region: "Дагестан",
    source: "productcenter catalog (public)",
    sourceUrl: "https://productcenter.ru/producers/r-dagiestan-riesp-166/catalog-napitki",
    whyUseful: "SEEK_BUYER / SUPPLY beverages — выбрать 2–3 реальные фирмы с сайтом.",
    couldOffer: "вода, соки, напитки оптом",
    couldNeed: "дистрибьюторы, HoReCa, госконтракты",
    confidence: "MEDIUM",
    notes: "НЕ импортировать каталог целиком — только конкретные компании с provenance",
  },
  {
    id: "seed_dag_horeca",
    name: "Гостиницы / санатории Дагестана (potential buyers)",
    type: "company",
    industry: "hospitality",
    region: "Дагестан",
    source: "public tourism listings",
    sourceUrl: "https://e-dag.ru/",
    whyUseful: "POTENTIAL_BUYER для воды/продуктов — INFERENCE, не FACT demand.",
    couldOffer: "размещение, питание",
    couldNeed: "поставки продуктов и напитков",
    confidence: "LOW",
    notes: "Seed только с официальным сайтом конкретной гостиницы",
  },
  {
    id: "seed_dag_logistics",
    name: "Логистические / складские операторы Махачкала (ручной отбор)",
    type: "company",
    industry: "logistics",
    region: "Дагестан",
    city: "Махачкала",
    source: "public business listings",
    sourceUrl: "https://e-dag.ru/",
    whyUseful: "Связка SUPPLY↔DEMAND и площадки.",
    couldOffer: "склад, перевозка",
    couldNeed: "грузоотправители, арендаторы",
    confidence: "LOW",
    notes: "Требует ручной верификации сайта/ИНН",
  },
  {
    id: "seed_dag_food_procurement_signal",
    name: "Сигнал закупки продуктов питания (Kontur/EIS) — уже в marketplace",
    type: "other",
    industry: "food",
    region: "Дагестан",
    source: "marketplace opportunity 5cedf341…",
    sourceUrl: "https://zakupki.kontur.ru/0303300064726000936",
    whyUseful: "CONFIRMED_DEMAND якорь для beverage SUPPLY companies.",
    couldOffer: "—",
    couldNeed: "поставка продуктов питания",
    confidence: "MEDIUM",
    notes: "Не компания — opportunity; связать Graph NEEDS/BUYS после seed компаний",
  },
];

export function listDagestanSeedCandidates() {
  return DAGESTAN_SEED_CANDIDATES.slice();
}
