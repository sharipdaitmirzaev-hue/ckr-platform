import { createHash, randomUUID } from "node:crypto";

export function bgId(): string {
  return randomUUID();
}

export function bgHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

export function normalizeAlias(alias: string): string {
  return alias
    .toLowerCase()
    .replace(/['"`«»]/g, "")
    .replace(/\b(ооо|оао|ао|зао|пао|llc|ltd|inc)\b/gi, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return digits || null;
  return digits.slice(-10);
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const v = email.trim().toLowerCase();
  return v.includes("@") ? v : null;
}
