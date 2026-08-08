import { ASSIGNABLE_ROLES, type AssignableRole } from "@/config/roles";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function initialRoleFromMetadata(user: User): AssignableRole | null {
  const raw = user.user_metadata?.initial_role;
  if (typeof raw !== "string") return null;
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(raw)) return null;
  return raw as AssignableRole;
}

/**
 * Гарантирует profiles + стартовую роль после confirm/login.
 * Нужно, когда signUp прошёл без сессии (email confirmation) —
 * insert в user_roles тогда пропускается.
 */
export async function ensureUserBootstrap(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    // Схема ещё не применена — не маскируем.
    throw profileReadError;
  }

  if (!profile) {
    const { error: profileInsertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fullName });
    if (profileInsertError) {
      // Гонка с trigger handle_new_user — допустима.
      const { data: again } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!again) throw profileInsertError;
    }
  }

  const { data: roles, error: rolesReadError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1);

  if (rolesReadError) throw rolesReadError;
  if (roles && roles.length > 0) return;

  const role = initialRoleFromMetadata(user);
  if (!role) return;

  const { error: roleInsertError } = await supabase.from("user_roles").insert({
    user_id: user.id,
    role,
  });
  if (roleInsertError) {
    console.error(
      "[auth] ensureUserBootstrap role insert failed:",
      roleInsertError.message,
    );
  }
}
