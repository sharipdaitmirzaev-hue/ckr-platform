import { createHash, randomUUID } from "crypto";

export function oiId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function oiHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}
