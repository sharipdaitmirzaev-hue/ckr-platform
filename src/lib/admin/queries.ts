import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ExpertProfileStatus,
  InvestmentOfferStatus,
  ProjectStatus,
  PublishStatus,
  UserRole,
  VerificationStatus,
} from "@/types";
import type {
  ExpertProfileRow,
  InvestmentOfferRow,
  OpportunityRow,
  ProfileRow,
  ProjectRow,
  UserRoleRow,
} from "@/types/database";

export type AdminStats = {
  users: number;
  projects: number;
  opportunities: number;
  investments: number;
  applications: number;
  documentsPending: number;
  verificationsPending: number;
};

export type AdminUserListItem = {
  id: string;
  fullName: string;
  companyName: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  verificationStatus: VerificationStatus;
  isBlocked: boolean;
  roles: UserRole[];
  createdAt: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  if (!hasSupabaseEnv()) {
    return {
      users: 0,
      projects: 0,
      opportunities: 0,
      investments: 0,
      applications: 0,
      documentsPending: 0,
      verificationsPending: 0,
    };
  }

  const supabase = createClient();

  const [
    users,
    projects,
    opportunities,
    investments,
    applications,
    documentsPending,
    verificationsPending,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase
      .from("investment_offers")
      .select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    users: users.count ?? 0,
    projects: projects.count ?? 0,
    opportunities: opportunities.count ?? 0,
    investments: investments.count ?? 0,
    applications: applications.count ?? 0,
    documentsPending: documentsPending.count ?? 0,
    verificationsPending: verificationsPending.count ?? 0,
  };
}

export async function listAdminUsers(filters?: {
  q?: string | null;
}): Promise<AdminUserListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.q) {
    const safe = filters.q.replace(/[%*,]/g, "").trim();
    if (safe) {
      const q = `%${safe}%`;
      query = query.or(
        `full_name.ilike.${q},company_name.ilike.${q},city.ilike.${q},phone.ilike.${q}`,
      );
    }
  }

  const { data: profiles, error } = await query;
  if (error || !profiles) return [];

  const ids = profiles.map((row) => row.id);
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("*")
    .in("user_id", ids);

  const rolesByUser = new Map<string, UserRole[]>();
  ((roleRows ?? []) as UserRoleRow[]).forEach((row) => {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role);
    rolesByUser.set(row.user_id, list);
  });

  return (profiles as ProfileRow[]).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    companyName: profile.company_name,
    city: profile.city,
    region: profile.region,
    phone: profile.phone,
    verificationStatus: profile.verification_status ?? "unverified",
    isBlocked: Boolean(profile.is_blocked),
    roles: rolesByUser.get(profile.id) ?? [],
    createdAt: profile.created_at,
  }));
}

export async function getAdminUser(userId: string): Promise<AdminUserListItem | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);

  const typed = profile as ProfileRow;

  return {
    id: typed.id,
    fullName: typed.full_name,
    companyName: typed.company_name,
    city: typed.city,
    region: typed.region,
    phone: typed.phone,
    verificationStatus: typed.verification_status ?? "unverified",
    isBlocked: Boolean(typed.is_blocked),
    roles: ((roleRows ?? []) as UserRoleRow[]).map((row) => row.role),
    createdAt: typed.created_at,
  };
}

export type AdminProjectItem = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  region: string;
  status: ProjectStatus;
  verificationStatus: VerificationStatus;
  stage: string;
  updatedAt: string;
};

export async function listAdminProjects(filters?: {
  status?: ProjectStatus | null;
  verificationStatus?: VerificationStatus | null;
}): Promise<AdminProjectItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("projects")
    .select("*, profiles:owner_id ( full_name )")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const project = row as ProjectRow & {
      profiles: { full_name: string | null } | null;
    };
    return {
      id: project.id,
      title: project.title,
      ownerId: project.owner_id,
      ownerName: project.profiles?.full_name ?? null,
      region: project.region,
      status: project.status as ProjectStatus,
      verificationStatus:
        (project.verification_status as VerificationStatus) ?? "unverified",
      stage: project.stage,
      updatedAt: project.updated_at,
    };
  });
}

export type AdminOpportunityItem = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  region: string;
  status: PublishStatus;
  verificationStatus: VerificationStatus;
  type: string;
  updatedAt: string;
};

export async function listAdminOpportunities(filters?: {
  status?: PublishStatus | null;
  verificationStatus?: VerificationStatus | null;
}): Promise<AdminOpportunityItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("opportunities")
    .select("*, profiles:owner_id ( full_name )")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const item = row as OpportunityRow & {
      profiles: { full_name: string | null } | null;
    };
    return {
      id: item.id,
      title: item.title,
      ownerId: item.owner_id,
      ownerName: item.profiles?.full_name ?? null,
      region: item.region,
      status: item.status as PublishStatus,
      verificationStatus:
        (item.verification_status as VerificationStatus) ?? "unverified",
      type: item.type,
      updatedAt: item.updated_at,
    };
  });
}

export type AdminInvestmentItem = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  status: InvestmentOfferStatus;
  verificationStatus: VerificationStatus;
  investmentType: string;
  amountMin: number;
  amountMax: number;
  currency: string;
  updatedAt: string;
};

export async function listAdminInvestments(filters?: {
  status?: InvestmentOfferStatus | null;
  verificationStatus?: VerificationStatus | null;
}): Promise<AdminInvestmentItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const item = row as InvestmentOfferRow & {
      profiles: { full_name: string | null } | null;
    };
    return {
      id: item.id,
      title: item.title,
      ownerId: item.owner_id,
      ownerName: item.profiles?.full_name ?? null,
      status: item.status as InvestmentOfferStatus,
      verificationStatus:
        (item.verification_status as VerificationStatus) ?? "unverified",
      investmentType: item.investment_type,
      amountMin: Number(item.amount_min),
      amountMax: Number(item.amount_max),
      currency: item.currency,
      updatedAt: item.updated_at,
    };
  });
}

export type AdminExpertItem = {
  id: string;
  userId: string;
  fullName: string | null;
  headline: string;
  specialization: string;
  region: string;
  status: ExpertProfileStatus;
  verificationStatus: VerificationStatus;
  updatedAt: string;
};

export async function listAdminExperts(filters?: {
  status?: ExpertProfileStatus | null;
  verificationStatus?: VerificationStatus | null;
}): Promise<AdminExpertItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("expert_profiles")
    .select("*, profiles:user_id ( full_name )")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const item = row as ExpertProfileRow & {
      profiles: { full_name: string | null } | null;
    };
    return {
      id: item.id,
      userId: item.user_id,
      fullName: item.profiles?.full_name ?? null,
      headline: item.headline,
      specialization: item.specialization,
      region: item.region,
      status: item.status as ExpertProfileStatus,
      verificationStatus:
        (item.verification_status as VerificationStatus) ?? "unverified",
      updatedAt: item.updated_at,
    };
  });
}
