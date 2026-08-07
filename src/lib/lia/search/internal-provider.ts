import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InternalMatch, LiaResultLink } from "@/types/lia";
import type { InternalSearchProvider } from "@/lib/lia/search/types";

function excerpt(text: string, max = 140) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,.;:!?\-/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 8);
}

function scoreText(haystack: string, tokens: string[]) {
  const value = haystack.toLowerCase();
  return tokens.reduce(
    (score, token) => (value.includes(token) ? score + 1 : score),
    0,
  );
}

function toMatchScore(raw: number, tokens: number) {
  if (tokens <= 0) return 0.35;
  return Math.min(1, raw / Math.max(tokens, 1));
}

function toLiaResultLink(match: InternalMatch): LiaResultLink {
  return {
    type: match.type,
    id: match.id,
    title: match.title,
    summary: match.description,
    href: match.href,
  };
}

/**
 * Внутренний поиск по каталогам ЦКР:
 * projects, opportunities, investment_offers, expert_profiles.
 */
export class CkrInternalSearchProvider implements InternalSearchProvider {
  id = "ckr-internal";
  label = "Каталоги ЦКР";
  kind = "internal" as const;

  async searchProjects(query: string, limit = 5): Promise<InternalMatch[]> {
    if (!hasSupabaseEnv()) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, title, summary, description, category, region")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(40);

    const tokens = tokenize(query);
    return (data ?? [])
      .map((row) => {
        const blob = `${row.title} ${row.summary} ${row.description} ${row.category} ${row.region}`;
        const raw = tokens.length ? scoreText(blob, tokens) : 1;
        return {
          raw,
          item: {
            id: row.id as string,
            title: row.title as string,
            type: "project" as const,
            href: `/project/${row.id}`,
            description: excerpt(
              (row.summary as string) || (row.description as string) || "",
            ),
            matchScore: toMatchScore(raw, tokens.length),
          },
        };
      })
      .filter((row) => (tokens.length ? row.raw > 0 : true))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, limit)
      .map((row) => row.item);
  }

  async searchOpportunities(
    query: string,
    limit = 5,
  ): Promise<InternalMatch[]> {
    if (!hasSupabaseEnv()) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("opportunities")
      .select("id, title, description, type, region, city")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(40);

    const tokens = tokenize(query);
    const prefersProperty =
      /земл|помещен|недвиж|аренд|площад|land|premises|оборуд/i.test(query);

    return (data ?? [])
      .map((row) => {
        const blob = `${row.title} ${row.description} ${row.type} ${row.region} ${row.city}`;
        let raw = tokens.length ? scoreText(blob, tokens) : 1;
        if (
          prefersProperty &&
          (row.type === "land" ||
            row.type === "premises" ||
            row.type === "equipment")
        ) {
          raw += 2;
        }
        return {
          raw,
          item: {
            id: row.id as string,
            title: row.title as string,
            type: "opportunity" as const,
            href: `/opportunity/${row.id}`,
            description: excerpt((row.description as string) || ""),
            matchScore: toMatchScore(raw, tokens.length + (prefersProperty ? 2 : 0)),
          },
        };
      })
      .filter((row) => (tokens.length || prefersProperty ? row.raw > 0 : true))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, limit)
      .map((row) => row.item);
  }

  async searchInvestments(query: string, limit = 5): Promise<InternalMatch[]> {
    if (!hasSupabaseEnv()) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("investment_offers")
      .select(
        "id, title, description, investment_type, regions, categories, amount_min, amount_max, currency",
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(40);

    const tokens = tokenize(query);
    return (data ?? [])
      .map((row) => {
        const blob = `${row.title} ${row.description} ${row.investment_type} ${(row.regions ?? []).join(" ")} ${(row.categories ?? []).join(" ")}`;
        const raw = tokens.length ? scoreText(blob, tokens) : 1;
        return {
          raw,
          item: {
            id: row.id as string,
            title: row.title as string,
            type: "investment" as const,
            href: `/investment/${row.id}`,
            description: excerpt(
              `${row.description} · ${new Intl.NumberFormat("ru-RU").format(Number(row.amount_min))}–${new Intl.NumberFormat("ru-RU").format(Number(row.amount_max))} ${row.currency}`,
            ),
            matchScore: toMatchScore(raw, tokens.length),
          },
        };
      })
      .filter((row) => (tokens.length ? row.raw > 0 : true))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, limit)
      .map((row) => row.item);
  }

  async searchExperts(query: string, limit = 5): Promise<InternalMatch[]> {
    if (!hasSupabaseEnv()) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("expert_profiles")
      .select(
        "id, headline, description, services, specialization, region, profiles:user_id ( full_name )",
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(40);

    const tokens = tokenize(query);
    return (data ?? [])
      .map((row) => {
        const profiles = row.profiles as unknown as
          | { full_name: string | null }
          | { full_name: string | null }[]
          | null;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        const name = profile?.full_name || "Эксперт ЦКР";
        const blob = `${name} ${row.headline} ${row.description} ${row.services} ${row.specialization} ${row.region}`;
        const raw = tokens.length ? scoreText(blob, tokens) : 1;
        return {
          raw,
          item: {
            id: row.id as string,
            title: `${name} — ${row.headline || row.specialization}`,
            type: "expert" as const,
            href: `/expert/${row.id}`,
            description: excerpt(
              (row.description as string) || (row.services as string) || "",
            ),
            matchScore: toMatchScore(raw, tokens.length),
          },
        };
      })
      .filter((row) => (tokens.length ? row.raw > 0 : true))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, limit)
      .map((row) => row.item);
  }
}

export const internalSearchProvider = new CkrInternalSearchProvider();

/** Адаптеры для совместимости со старым API LiaResultLink[]. */
export async function searchProjects(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
  const rows = await internalSearchProvider.searchProjects(query, limit);
  return rows.map(toLiaResultLink);
}

export async function searchOpportunities(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
  const rows = await internalSearchProvider.searchOpportunities(query, limit);
  return rows.map(toLiaResultLink);
}

export async function searchInvestments(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
  const rows = await internalSearchProvider.searchInvestments(query, limit);
  return rows.map(toLiaResultLink);
}

export async function searchExperts(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
  const rows = await internalSearchProvider.searchExperts(query, limit);
  return rows.map(toLiaResultLink);
}
