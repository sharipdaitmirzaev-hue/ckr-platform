import type { ProjectDraft } from "@/types/lia";
import type { Project } from "@/types";

/** Безопасная передача черновика в форму через query string. */
export function projectDraftToSearchParams(draft: ProjectDraft): string {
  const params = new URLSearchParams();
  params.set("lia", "1");
  params.set("title", draft.title.slice(0, 160));
  params.set("summary", draft.summary.slice(0, 400));
  params.set("description", draft.description.slice(0, 4000));
  params.set("category", draft.category.slice(0, 80));
  params.set("region", draft.region.slice(0, 120));
  params.set(
    "investmentRequired",
    String(Math.max(0, draft.investment_required)),
  );
  params.set("currency", draft.currency || "RUB");
  params.set("stage", draft.stage || "idea");
  return params.toString();
}

export function projectDraftFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): Partial<Project> | null {
  if (searchParams.lia !== "1" && searchParams.lia !== "true") {
    if (!searchParams.title) return null;
  }

  const read = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : "";
  };

  const title = read("title").trim();
  if (!title) return null;

  const investment = Number(read("investmentRequired") || "0");

  return {
    title: title.slice(0, 160),
    summary: read("summary").slice(0, 400),
    description: read("description").slice(0, 4000),
    category: read("category").slice(0, 80) || "production",
    region: read("region").slice(0, 120),
    investmentRequired: Number.isFinite(investment) ? investment : 0,
    currency: read("currency") || "RUB",
    stage: (read("stage") as Project["stage"]) || "idea",
    status: "draft",
  };
}

export function normalizeProjectDraft(draft: ProjectDraft): ProjectDraft {
  return {
    title: draft.title.trim().slice(0, 160),
    summary: draft.summary.trim().slice(0, 400),
    description: draft.description.trim().slice(0, 12000),
    category: draft.category.trim().slice(0, 80),
    region: draft.region.trim().slice(0, 120),
    investment_required: Math.max(0, Number(draft.investment_required) || 0),
    stage: draft.stage || "idea",
    currency: draft.currency || "RUB",
    assets: draft.assets,
    needs: draft.needs,
  };
}
