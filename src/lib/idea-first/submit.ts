import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import {
  hashIp,
  hashToken,
  mintClaimToken,
  sanitizeIdeaInput,
} from "@/lib/idea-first/security";

function serviceOrAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && service) {
    return createSupabaseJs(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  if (url && anon) {
    return createSupabaseJs(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient();
}

export type SubmitIdeaResult =
  | {
      ok: true;
      requestId: string;
      claimToken: string;
      alreadyExists: boolean;
      name: string;
    }
  | { ok: false; error: string; code?: string };

export async function submitPublicIdea(input: {
  name: string;
  idea: string;
  phone?: string;
  email?: string;
  telegram?: string;
  idempotencyKey?: string;
  ip?: string;
}): Promise<SubmitIdeaResult> {
  const cleaned = sanitizeIdeaInput({
    name: input.name,
    idea: input.idea,
    phone: input.phone,
    email: input.email,
    telegram: input.telegram,
  });
  if (!cleaned.ok) return { ok: false, error: cleaned.error };

  const claimToken = mintClaimToken();
  const claimHash = hashToken(claimToken);
  const ipHash = input.ip ? hashIp(input.ip) : "";

  const supabase = serviceOrAnonClient();
  const { data, error } = await supabase.rpc("submit_public_idea", {
    p_name: cleaned.data.name,
    p_idea: cleaned.data.idea,
    p_contact_phone: cleaned.data.phone || "",
    p_contact_email: cleaned.data.email || "",
    p_contact_telegram: cleaned.data.telegram || "",
    p_idempotency_key: input.idempotencyKey || null,
    p_ip_hash: ipHash,
    p_claim_token_hash: claimHash,
    p_claim_hours: 72,
  });

  if (error) {
    const msg = error.message || "submit_failed";
    if (msg.includes("rate_limited")) {
      return {
        ok: false,
        error: "Слишком много отправок. Попробуйте позже.",
        code: "rate_limited",
      };
    }
    if (msg.includes("idea_too_short") || msg.includes("name_too_short")) {
      return { ok: false, error: "Проверьте имя и текст идеи.", code: msg };
    }
    return { ok: false, error: "Не удалось отправить идею. Попробуйте ещё раз." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const requestId = (row as { request_id?: string })?.request_id;
  const alreadyExists = Boolean(
    (row as { already_exists?: boolean })?.already_exists,
  );
  if (!requestId) {
    return { ok: false, error: "Не удалось отправить идею." };
  }

  return {
    ok: true,
    requestId,
    claimToken,
    alreadyExists,
    name: cleaned.data.name,
  };
}

export async function updatePublicIdeaContact(input: {
  requestId: string;
  claimToken: string;
  phone?: string;
  email?: string;
  telegram?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = serviceOrAnonClient();
  const { error } = await supabase.rpc("update_public_idea_contact", {
    p_request_id: input.requestId,
    p_claim_token_hash: hashToken(input.claimToken),
    p_contact_phone: (input.phone || "").trim(),
    p_contact_email: (input.email || "").trim(),
    p_contact_telegram: (input.telegram || "").trim(),
  });
  if (error) {
    return { ok: false, error: "Не удалось сохранить контакт." };
  }
  return { ok: true };
}

export async function claimPublicIdea(input: {
  requestId: string;
  claimToken: string;
}): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("claim_ckr_request", {
    p_request_id: input.requestId,
    p_claim_token_hash: hashToken(input.claimToken),
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("already_claimed")) {
      return { ok: false, error: "Обращение уже привязано к другому кабинету." };
    }
    if (msg.includes("token_expired") || msg.includes("invalid_token")) {
      return { ok: false, error: "Ссылка истекла. Обратитесь в ЦКР." };
    }
    if (msg.includes("not_authenticated")) {
      return { ok: false, error: "Войдите в аккаунт, чтобы продолжить." };
    }
    return { ok: false, error: "Не удалось привязать обращение." };
  }
  return { ok: true, requestId: (data as string) || input.requestId };
}
