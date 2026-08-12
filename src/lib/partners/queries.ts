import {
  mapOrganizationMemberRow,
  mapOrganizationRow,
  mapPartnershipRow,
} from "@/lib/partners/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Organization,
  OrganizationMember,
  OrganizationMemberRole,
  Partnership,
} from "@/types";
import type {
  InvestmentOfferRow,
  OpportunityRow,
  OrganizationMemberRow,
  OrganizationRow,
  PartnershipRow,
  ProjectRow,
} from "@/types/database";

export type PartnerContext = {
  organization: Organization;
  membership: OrganizationMember;
  role: OrganizationMemberRole;
};

export async function listMyOrganizations(
  userId: string,
): Promise<PartnerContext[]> {
  if (!hasSupabaseEnv() || !userId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*, organizations(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    return data
      .map((row) => {
        const member = row as OrganizationMemberRow & {
          organizations: OrganizationRow | null;
        };
        if (!member.organizations) return null;
        const membership = mapOrganizationMemberRow(member);
        return {
          organization: mapOrganizationRow(member.organizations),
          membership,
          role: membership.role,
        } satisfies PartnerContext;
      })
      .filter((item): item is PartnerContext => Boolean(item));
  } catch {
    return [];
  }
}

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  if (!hasSupabaseEnv() || !id) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapOrganizationRow(data as OrganizationRow);
  } catch {
    return null;
  }
}

export async function getMembership(
  organizationId: string,
  userId: string,
): Promise<OrganizationMember | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return mapOrganizationMemberRow(data as OrganizationMemberRow);
  } catch {
    return null;
  }
}

export async function listOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organization_members")
      .select("*, profiles:user_id(full_name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => {
      const member = row as OrganizationMemberRow & {
        profiles?: { full_name: string } | null;
      };
      return mapOrganizationMemberRow(member, {
        fullName: member.profiles?.full_name,
      });
    });
  } catch {
    return [];
  }
}

export async function listPartnerships(
  organizationId: string,
): Promise<Partnership[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("partnerships")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as PartnershipRow[]).map(mapPartnershipRow);
  } catch {
    return [];
  }
}

export async function listOrganizationProjects(organizationId: string) {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as ProjectRow[];
  } catch {
    return [];
  }
}

export async function listOrganizationOpportunities(organizationId: string) {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as OpportunityRow[];
  } catch {
    return [];
  }
}

export async function listOrganizationInvestments(organizationId: string) {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("investment_offers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as InvestmentOfferRow[];
  } catch {
    return [];
  }
}

/** Public catalog: verified + listed (RLS). */
export async function listVerifiedOrganizations(limit = 100): Promise<Organization[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("verification_status", "verified")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as OrganizationRow[])
      .map(mapOrganizationRow)
      .filter((o) => o.isListed !== false);
  } catch {
    return [];
  }
}

export async function listOrganizationApplications(
  organizationId: string,
  memberUserIds: string[],
) {
  if (!hasSupabaseEnv()) return { incoming: [], outgoing: [] as never[] };
  try {
    const supabase = createClient();
    const projectIds = (
      await listOrganizationProjects(organizationId)
    ).map((item) => item.id);
    const opportunityIds = (
      await listOrganizationOpportunities(organizationId)
    ).map((item) => item.id);
    const investmentIds = (
      await listOrganizationInvestments(organizationId)
    ).map((item) => item.id);

    const targetIds = [...projectIds, ...opportunityIds, ...investmentIds];
    const { data: all } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = all ?? [];
    const outgoing = rows.filter((row) =>
      memberUserIds.includes(row.from_user_id),
    );
    const incoming = rows.filter(
      (row) =>
        targetIds.includes(row.target_id) &&
        !memberUserIds.includes(row.from_user_id),
    );
    return { incoming, outgoing };
  } catch {
    return { incoming: [], outgoing: [] };
  }
}
