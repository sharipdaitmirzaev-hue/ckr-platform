import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LiaResultLink } from "@/types/lia";

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

export async function searchProjects(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, summary, description, category, region")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(40);

  const tokens = tokenize(query);
  const rows = (data ?? [])
    .map((row) => {
      const blob = `${row.title} ${row.summary} ${row.description} ${row.category} ${row.region}`;
      return {
        score: tokens.length ? scoreText(blob, tokens) : 1,
        item: {
          type: "project" as const,
          id: row.id,
          title: row.title,
          summary: excerpt(row.summary || row.description || ""),
          href: `/project/${row.id}`,
        },
      };
    })
    .filter((row) => (tokens.length ? row.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows.map((row) => row.item);
}

export async function searchOpportunities(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
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
    /земл|помещен|недвиж|аренд|площад|land|premises/i.test(query);

  const rows = (data ?? [])
    .map((row) => {
      const blob = `${row.title} ${row.description} ${row.type} ${row.region} ${row.city}`;
      let score = tokens.length ? scoreText(blob, tokens) : 1;
      if (
        prefersProperty &&
        (row.type === "land" || row.type === "premises")
      ) {
        score += 2;
      }
      return {
        score,
        item: {
          type: "opportunity" as const,
          id: row.id,
          title: row.title,
          summary: excerpt(row.description || ""),
          href: `/opportunity/${row.id}`,
        },
      };
    })
    .filter((row) => (tokens.length || prefersProperty ? row.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows.map((row) => row.item);
}

export async function searchInvestments(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
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
  const rows = (data ?? [])
    .map((row) => {
      const blob = `${row.title} ${row.description} ${row.investment_type} ${(row.regions ?? []).join(" ")} ${(row.categories ?? []).join(" ")}`;
      return {
        score: tokens.length ? scoreText(blob, tokens) : 1,
        item: {
          type: "investment" as const,
          id: row.id,
          title: row.title,
          summary: excerpt(
            `${row.description} · ${new Intl.NumberFormat("ru-RU").format(Number(row.amount_min))}–${new Intl.NumberFormat("ru-RU").format(Number(row.amount_max))} ${row.currency}`,
          ),
          href: `/investment/${row.id}`,
        },
      };
    })
    .filter((row) => (tokens.length ? row.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows.map((row) => row.item);
}

export async function searchExperts(
  query: string,
  limit = 5,
): Promise<LiaResultLink[]> {
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
  const rows = (data ?? [])
    .map((row) => {
      const profiles = row.profiles as unknown as
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null;
      const profile = Array.isArray(profiles) ? profiles[0] : profiles;
      const name = profile?.full_name || "Эксперт ЦКР";
      const blob = `${name} ${row.headline} ${row.description} ${row.services} ${row.specialization} ${row.region}`;
      return {
        score: tokens.length ? scoreText(blob, tokens) : 1,
        item: {
          type: "expert" as const,
          id: row.id,
          title: `${name} — ${row.headline || row.specialization}`,
          summary: excerpt(row.description || row.services || ""),
          href: `/expert/${row.id}`,
        },
      };
    })
    .filter((row) => (tokens.length ? row.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows.map((row) => row.item);
}
