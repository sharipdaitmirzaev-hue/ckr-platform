import { createHash } from "node:crypto";
import type { CkrOwnIdea, OwnIdeaComponent, OwnIdeaSignal } from "@/types/ckr-own-ideas";

function norm(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, " ")
    .trim();
}

export function componentIdentity(c: {
  kind: string;
  identityKey?: string | null;
  officialId?: string | null;
  canonicalUrl?: string | null;
  title: string;
}): string {
  if (c.officialId) return `${c.kind}:${norm(c.officialId)}`;
  if (c.canonicalUrl) return `${c.kind}:url:${norm(c.canonicalUrl)}`;
  if (c.identityKey) return `${c.kind}:${norm(c.identityKey)}`;
  return `${c.kind}:title:${norm(c.title)}`;
}

export function ideaFingerprintFromComponents(
  components: Array<Pick<OwnIdeaComponent, "kind" | "identityKey" | "officialId" | "canonicalUrl" | "title">>,
): string {
  const keys = components
    .map((c) => componentIdentity(c))
    .sort()
    .join("|");
  return createHash("sha256").update(keys).digest("hex").slice(0, 24);
}

export function ideaFingerprintFromSignals(signals: OwnIdeaSignal[]): string {
  return ideaFingerprintFromComponents(
    signals.map((s) => ({
      kind: s.kind,
      identityKey: s.identityKey ?? null,
      officialId: s.officialId ?? null,
      canonicalUrl: s.canonicalUrl ?? null,
      title: s.title,
    })),
  );
}

export function ideasAreSameCore(a: CkrOwnIdea, b: CkrOwnIdea): boolean {
  return a.fingerprint === b.fingerprint;
}

export function titlesLookSimilar(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb;
}
