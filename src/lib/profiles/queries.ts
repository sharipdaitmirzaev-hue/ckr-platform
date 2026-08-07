import { mapOpportunityRow } from "@/lib/opportunities/mappers";
import { mapProjectRow } from "@/lib/projects/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Opportunity, Project, UserRole } from "@/types";
import type {
  ExpertProfileRow,
  OpportunityRow,
  ProfileRow,
  ProjectRow,
} from "@/types/database";

export type PublicProfile = {
  id: string;
  fullName: string;
  companyName: string | null;
  website: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  showContact: boolean;
  isPublic: boolean;
  verificationStatus: ProfileRow["verification_status"];
  roles: UserRole[];
  avatarUrl: string | null;
};

export type PublicProfileBundle = {
  profile: PublicProfile;
  projects: Project[];
  opportunities: Opportunity[];
  expert: ExpertProfileRow | null;
};

function mapPublicProfile(
  row: ProfileRow,
  roles: UserRole[],
): PublicProfile {
  return {
    id: row.id,
    fullName: row.full_name || "Участник ЦКР",
    companyName: row.company_name,
    website: row.website,
    bio: row.bio,
    city: row.city,
    region: row.region,
    phone: row.show_contact ? row.phone : null,
    showContact: Boolean(row.show_contact),
    isPublic: row.is_public !== false,
    verificationStatus: row.verification_status ?? "unverified",
    roles: roles.filter((role) => role !== "admin"),
    avatarUrl: row.avatar_url,
  };
}

export async function getPublicProfile(
  id: string,
): Promise<PublicProfileBundle | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) return null;

  const row = profile as ProfileRow;
  if (row.is_blocked) return null;
  if (row.is_public === false) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", id);

  const roles = (roleRows ?? [])
    .map((item) => item.role as UserRole)
    .filter((role) => role !== "admin");

  const [projectsRes, opportunitiesRes, expertRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", id)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("opportunities")
      .select("*")
      .eq("owner_id", id)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("expert_profiles")
      .select("*")
      .eq("user_id", id)
      .eq("status", "published")
      .maybeSingle(),
  ]);

  return {
    profile: mapPublicProfile(row, roles),
    projects: ((projectsRes.data ?? []) as ProjectRow[]).map(mapProjectRow),
    opportunities: ((opportunitiesRes.data ?? []) as OpportunityRow[]).map(
      mapOpportunityRow,
    ),
    expert: (expertRes.data as ExpertProfileRow | null) ?? null,
  };
}
