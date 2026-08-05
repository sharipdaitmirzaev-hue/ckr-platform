import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types";
import type { ProfileRow, UserRoleRow } from "@/types/database";
import type { User as AuthUser } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

export type CurrentUser = {
  authUser: AuthUser;
  profile: ProfileRow;
  roles: UserRole[];
  user: User;
};

function toDomainUser(
  authUser: AuthUser,
  profile: ProfileRow,
  roles: UserRole[],
): User {
  return {
    id: profile.id,
    email: authUser.email ?? "",
    fullName: profile.full_name,
    companyName: profile.company_name,
    website: profile.website ?? null,
    socialLinks: (profile.social_links as User["socialLinks"]) ?? {},
    verificationStatus: profile.verification_status ?? "unverified",
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    phone: profile.phone,
    city: profile.city,
    region: profile.region,
    roles,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

/**
 * Текущий авторизованный пользователь + профиль + роли.
 * Возвращает null, если сессии нет или Supabase не настроен.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  noStore();

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", authUser.id);

  if (rolesError) {
    return null;
  }

  const roles = ((roleRows ?? []) as UserRoleRow[]).map((row) => row.role);
  const typedProfile = profile as ProfileRow;

  return {
    authUser,
    profile: typedProfile,
    roles,
    user: toDomainUser(authUser, typedProfile, roles),
  };
}
