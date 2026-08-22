import { createHash, randomUUID } from "node:crypto";

export function needId(): string {
  return randomUUID();
}

export function needHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

export function normalizeRegion(region: string): string {
  return region.trim().replace(/\s+/g, " ");
}
