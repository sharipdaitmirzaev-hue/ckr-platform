import type { Organization } from "@/types";
import type { NeedProfile } from "@/types/need-profile";
import { toPublicOrganizationFields, canSeeTier } from "@/lib/company-intelligence/privacy";
import { computeCompanyQuality } from "@/lib/company-intelligence/quality";
import { buildCompanyTimeline } from "@/lib/company-intelligence/timeline";
import type {
  CompanyIntelligenceCard,
  CompanyLinkedBundle,
  CompanyViewerRole,
  LiaCompanyEnrichmentDraft,
} from "@/lib/company-intelligence/types";

const SECTIONS = [
  "О компании",
  "Что предлагает",
  "Что ищет",
  "Проекты",
  "Возможности",
  "Сделки",
  "Команда",
  "Связи",
  "Лия",
  "История",
] as const;

export function buildCompanyIntelligenceCard(input: {
  organization: Organization;
  viewerRole: CompanyViewerRole;
  linked?: Partial<CompanyLinkedBundle>;
  events?: Parameters<typeof buildCompanyTimeline>[0]["events"];
  demandSignals?: { confirmedDemand: number; potentialBuyer: number };
}): CompanyIntelligenceCard {
  const org = input.organization;
  const linked: CompanyLinkedBundle = {
    projects: input.linked?.projects || [],
    opportunities: input.linked?.opportunities || [],
    investments: input.linked?.investments || [],
    needs: input.linked?.needs || [],
    members: input.linked?.members || [],
    graphNodeId: input.linked?.graphNodeId ?? null,
    graphEdges: input.linked?.graphEdges || [],
  };
  const activeNeeds = linked.needs.filter((n) => n.status === "ACTIVE");
  const quality = computeCompanyQuality({
    organization: org,
    activeNeedsCount: activeNeeds.length,
    publicOffersCount: linked.opportunities.length + linked.investments.length,
    graphLinksCount: linked.graphEdges.length + (linked.graphNodeId ? 1 : 0),
  });

  const dem = input.demandSignals || { confirmedDemand: 0, potentialBuyer: 0 };
  const card: CompanyIntelligenceCard = {
    organization: org,
    viewerRole: input.viewerRole,
    publicView: toPublicOrganizationFields(org),
    linked,
    timeline: buildCompanyTimeline({
      organization: org,
      viewer: input.viewerRole,
      events: input.events,
      needsCount: activeNeeds.length,
      projectsCount: linked.projects.length,
    }),
    sections: [...SECTIONS],
  };

  if (canSeeTier(input.viewerRole, "CKR_ONLY")) {
    card.internal = {
      quality,
      demandSignals: {
        ...dem,
        noteRu:
          dem.confirmedDemand > 0
            ? `Лия/каталог: ${dem.confirmedDemand} confirmed demand, ${dem.potentialBuyer} potential buyers (INFERENCE отдельно).`
            : "Confirmed demand пока не найдены; potential buyer ≠ заказчик.",
      },
    };
  }
  if (canSeeTier(input.viewerRole, "OWNER_ONLY") && card.internal) {
    card.internal.ownerNotes = org.ownerNotes || "";
    card.internal.liaDraft = (org.liaEnrichmentDraft as LiaCompanyEnrichmentDraft | null) || null;
  }

  return card;
}

/** Filter needs owned by this organization. */
export function organizationNeeds(
  orgId: string,
  needs: NeedProfile[],
): NeedProfile[] {
  return needs.filter(
    (n) => n.ownerType === "organization" && n.ownerId === orgId,
  );
}
