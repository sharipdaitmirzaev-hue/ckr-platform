/**
 * Fixture scenario Stage 3A:
 * CAPITAL + PROPERTY + EQUIPMENT + SUPPORT + DEMAND + PROJECT → OPPORTUNITY
 */

import { getBusinessGraphService } from "@/lib/business-graph/service";
import type { BusinessEdge, BusinessNode } from "@/types/business-graph";

export type Stage3aScenarioResult = {
  nodes: Record<string, BusinessNode>;
  edges: BusinessEdge[];
  opportunityId: string;
};

export function loadStage3aFixtureScenario(): Stage3aScenarioResult {
  const g = getBusinessGraphService();
  g.resetForTests();

  const capital = g.createOrUpdateNode({
    nodeType: "CAPITAL",
    title: "Инвестор — лимит 30 млн ₽",
    description: "Частный инвестор, бюджет до 30 млн рублей",
    region: "Россия",
    visibility: "OWNER_ONLY",
    dataConfidence: 80,
    dataQualityScore: 70,
    structuredData: { budgetMax: 30_000_000, currency: "RUB" },
    sourceType: "fixture",
    sourceId: "capital-30m",
  }).node;

  const property = g.createOrUpdateNode({
    nodeType: "PROPERTY",
    title: "Производственная площадка 1200 м²",
    description: "Площадка под пищевое производство",
    region: "Нижегородская область",
    visibility: "OWNER_ONLY",
    dataConfidence: 90,
    dataQualityScore: 75,
    structuredData: { areaSqm: 1200, purpose: "production" },
    sourceType: "fixture",
    sourceId: "property-nn-1200",
  }).node;

  const equipment = g.createOrUpdateNode({
    nodeType: "EQUIPMENT",
    title: "Линия розлива",
    description: "Производственная линия розлива напитков",
    region: "Нижегородская область",
    visibility: "OWNER_ONLY",
    dataConfidence: 85,
    dataQualityScore: 60,
    sourceType: "fixture",
    sourceId: "equip-line-1",
  }).node;

  const support = g.createOrUpdateNode({
    nodeType: "SUPPORT",
    title: "Льготное финансирование МСП",
    description: "Программа поддержки малого производства",
    region: "Россия",
    visibility: "OWNER_ONLY",
    dataConfidence: 75,
    dataQualityScore: 55,
    sourceType: "fixture",
    sourceId: "support-msp-1",
  }).node;

  const demand = g.createOrUpdateNode({
    nodeType: "DEMAND",
    title: "Закупка напитков — НМЦК 12.5 млн",
    description: "Государственная закупка питьевой воды и напитков",
    region: "Московская область",
    visibility: "OWNER_ONLY",
    dataConfidence: 95,
    dataQualityScore: 80,
    structuredData: { procurement_id: "0373100043226000123", nmck: 12_500_000 },
    sourceType: "fixture",
    sourceId: "demand-eis-1",
  }).node;

  const project = g.createOrUpdateNode({
    nodeType: "PROJECT",
    title: "Производство напитков на площадке",
    description: "Производственный проект ЦКР",
    region: "Нижегородская область",
    visibility: "INTERNAL",
    dataConfidence: 88,
    dataQualityScore: 72,
    internalEntityType: "projects",
    internalEntityId: "fixture-project-1",
    sourceType: "fixture",
    sourceId: "project-drinks-1",
  }).node;

  const opportunity = g.createOrUpdateNode({
    nodeType: "OPPORTUNITY",
    title: "Возможность: производство + площадка + спрос + капитал",
    description:
      "Собранная конструкция: капитал, площадка, оборудование, поддержка и спрос вокруг производственного проекта.",
    region: "Нижегородская область",
    visibility: "OWNER_ONLY",
    dataConfidence: 70,
    dataQualityScore: 65,
    opportunityAttractiveness: 61,
    sourceType: "fixture",
    sourceId: "opp-construct-1",
  }).node;

  const edgeSpecs: Array<{
    from: BusinessNode;
    to: BusinessNode;
    type:
      | "CAN_FINANCE"
      | "SUITABLE_FOR"
      | "REQUIRED_BY"
      | "SUPPORTED_BY"
      | "CREATES_DEMAND_FOR"
      | "DERIVED_FROM";
    provenance: "FACT" | "INFERENCE" | "ESTIMATE";
    confidence: number;
    summary: string;
  }> = [
    {
      from: capital,
      to: project,
      type: "CAN_FINANCE",
      provenance: "ESTIMATE",
      confidence: 70,
      summary: "Бюджет инвестора покрывает масштаб проекта (оценка).",
    },
    {
      from: property,
      to: project,
      type: "SUITABLE_FOR",
      provenance: "INFERENCE",
      confidence: 72,
      summary: "Площадь и назначение площадки совместимы с производством.",
    },
    {
      from: equipment,
      to: project,
      type: "REQUIRED_BY",
      provenance: "INFERENCE",
      confidence: 68,
      summary: "Линия розлива нужна для выбранного продукта.",
    },
    {
      from: support,
      to: project,
      type: "SUPPORTED_BY",
      provenance: "ESTIMATE",
      confidence: 55,
      summary: "Возможна применимость программы МСП (требует проверки).",
    },
    {
      from: demand,
      to: project,
      type: "CREATES_DEMAND_FOR",
      provenance: "FACT",
      confidence: 90,
      summary: "Официальная закупка с НМЦК подтверждает спрос.",
    },
  ];

  const edges = edgeSpecs.map((spec) =>
    g.createOrUpdateEdge({
      sourceNodeId: spec.from.id,
      targetNodeId: spec.to.id,
      relationshipType: spec.type,
      provenanceType: spec.provenance,
      confidence: spec.confidence,
      reasoningSummary: spec.summary,
      status: "ACTIVE",
      matchClass:
        spec.provenance === "FACT"
          ? "HARD"
          : spec.provenance === "INFERENCE"
            ? "SOFT"
            : "HYPOTHESIS",
      createdByKind: "LIA",
      source: "fixture-stage3a",
    }).edge,
  );

  for (const part of [capital, property, equipment, support, demand, project]) {
    edges.push(
      g.createOrUpdateEdge({
        sourceNodeId: opportunity.id,
        targetNodeId: part.id,
        relationshipType: "DERIVED_FROM",
        provenanceType: "INFERENCE",
        confidence: 75,
        reasoningSummary: "Элемент собранной бизнес-возможности.",
        status: "ACTIVE",
        matchClass: "HYPOTHESIS",
        createdByKind: "LIA",
        source: "fixture-stage3a",
      }).edge,
    );
  }

  g.addAlias(capital.id, "Инвестор 30 млн", "fixture");
  g.addAlias(demand.id, "Закупка ЕИС 0373100043226000123", "fixture");

  return {
    nodes: {
      capital,
      property,
      equipment,
      support,
      demand,
      project,
      opportunity,
    },
    edges,
    opportunityId: opportunity.id,
  };
}
