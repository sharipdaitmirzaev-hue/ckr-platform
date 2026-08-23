import type {
  OwnIdeaClaimKind,
  OwnIdeaMoney,
  OwnIdeaProvenance,
} from "@/types/ckr-own-ideas";

export function money(
  amount: number | null,
  kind: OwnIdeaClaimKind,
  note?: string,
  provenance?: OwnIdeaProvenance,
): OwnIdeaMoney {
  return { amount, currency: "RUB", kind, note, provenance };
}

export function unknownMoney(note: string): OwnIdeaMoney {
  return money(null, "UNKNOWN", note);
}

export function factMoney(amount: number, note?: string): OwnIdeaMoney {
  return money(amount, "FACT", note);
}

export function inferenceMoney(amount: number, note: string): OwnIdeaMoney {
  return money(amount, "INFERENCE", note);
}

export function claimKindRank(kind: OwnIdeaClaimKind): number {
  if (kind === "FACT") return 3;
  if (kind === "INFERENCE") return 2;
  return 1;
}

export function addMoney(a: OwnIdeaMoney, b: OwnIdeaMoney): OwnIdeaMoney {
  if (a.amount == null && b.amount == null) {
    return unknownMoney([a.note, b.note].filter(Boolean).join("; "));
  }
  const sum = (a.amount ?? 0) + (b.amount ?? 0);
  const kind: OwnIdeaClaimKind =
    a.kind === "UNKNOWN" || b.kind === "UNKNOWN"
      ? a.amount == null || b.amount == null
        ? "UNKNOWN"
        : "INFERENCE"
      : a.kind === "FACT" && b.kind === "FACT"
        ? "FACT"
        : "INFERENCE";
  return money(sum, kind);
}
