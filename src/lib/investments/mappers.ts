import type {
  InvestmentOffer,
  InvestmentOfferStatus,
  InvestmentType,
} from "@/types";
import type { InvestmentOfferRow } from "@/types/database";

export function mapInvestmentOfferRow(row: InvestmentOfferRow): InvestmentOffer {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    amountMin: Number(row.amount_min),
    amountMax: Number(row.amount_max),
    currency: row.currency,
    regions: row.regions ?? [],
    categories: row.categories ?? [],
    investmentType: row.investment_type as InvestmentType,
    status: row.status as InvestmentOfferStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
