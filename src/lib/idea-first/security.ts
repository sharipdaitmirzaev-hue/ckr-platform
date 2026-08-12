import { createHash, randomBytes } from "node:crypto";
import { IDEA_FORM } from "@/config/idea-first";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIp(ip: string): string {
  const salt = process.env.CKR_IDEA_IP_SALT || "ckr-idea-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function mintClaimToken(): string {
  return randomBytes(32).toString("hex");
}

export function sanitizeIdeaInput(input: {
  name: string;
  idea: string;
  phone?: string;
  email?: string;
  telegram?: string;
}): { ok: true; data: typeof input } | { ok: false; error: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  const idea = input.idea.trim();
  if (name.length < IDEA_FORM.minNameLength) {
    return { ok: false, error: "Укажите имя (минимум 2 символа)." };
  }
  if (name.length > 120) {
    return { ok: false, error: "Имя слишком длинное." };
  }
  if (idea.length < IDEA_FORM.minIdeaLength) {
    return { ok: false, error: "Опишите идею подробнее (минимум 20 символов)." };
  }
  if (idea.length > IDEA_FORM.maxIdeaLength) {
    return { ok: false, error: "Текст идеи слишком длинный." };
  }
  // Basic spam: excessive URLs / repeated chars
  const urlCount = (idea.match(/https?:\/\//gi) || []).length;
  if (urlCount > 3) {
    return { ok: false, error: "Слишком много ссылок в тексте." };
  }
  return {
    ok: true,
    data: {
      name,
      idea,
      phone: (input.phone || "").trim().slice(0, 40),
      email: (input.email || "").trim().toLowerCase().slice(0, 160),
      telegram: (input.telegram || "").trim().slice(0, 80),
    },
  };
}

export function encodeClaimCookie(payload: {
  requestId: string;
  token: string;
  name: string;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeClaimCookie(
  raw: string | undefined,
): { requestId: string; token: string; name: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as { requestId?: string; token?: string; name?: string };
    if (!parsed.requestId || !parsed.token) return null;
    return {
      requestId: parsed.requestId,
      token: parsed.token,
      name: parsed.name || "",
    };
  } catch {
    return null;
  }
}
