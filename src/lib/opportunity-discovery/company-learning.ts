/**
 * Stage 4O — company learning proposals (no auto-write to Company Intelligence).
 * Reuse organizations.lia_enrichment_draft pattern conceptually.
 */

export type CompanyFactProposal = {
  field: string;
  value: string;
  source: "client_message" | "owner_note" | "discovery";
  confidence: "FACT" | "INFERENCE";
  status: "PROPOSED";
};

const PRODUCT_HINT =
  /(?:продаём|продаем|поставляем|ассортимент|чай|кофе|напитк|молочн|продукт)/i;
const LOGISTICS_HINT =
  /(?:доставк|логистик|минимальн(?:ая|ый)?\s*парт|moq|коробк)/i;
const REGION_HINT = /(?:дагестан|скфо|махачкал|весь\s+регион)/i;

/**
 * Extract draft facts from client text. Never auto-applies to organization.
 */
export function proposeCompanyFactsFromText(text: string): CompanyFactProposal[] {
  const t = text.trim();
  if (!t) return [];
  const out: CompanyFactProposal[] = [];

  if (PRODUCT_HINT.test(t)) {
    out.push({
      field: "products_services",
      value: t.slice(0, 280),
      source: "client_message",
      confidence: "INFERENCE",
      status: "PROPOSED",
    });
  }
  if (LOGISTICS_HINT.test(t)) {
    out.push({
      field: "logistics_notes",
      value: t.slice(0, 280),
      source: "client_message",
      confidence: "INFERENCE",
      status: "PROPOSED",
    });
  }
  if (REGION_HINT.test(t)) {
    out.push({
      field: "service_regions",
      value: t.slice(0, 280),
      source: "client_message",
      confidence: "INFERENCE",
      status: "PROPOSED",
    });
  }

  return out;
}

export const COMPANY_LEARNING_RULE =
  "client answer → owner sees proposed facts → owner confirms → organization updated. No automatic Company Intelligence mutation.";
