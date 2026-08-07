import { LEGAL_REVIEW_BANNER } from "@/config/legal";

export function LegalReviewBanner() {
  return (
    <div
      role="note"
      className="rounded-sm border border-accent/40 bg-accent-muted px-4 py-3 text-sm leading-relaxed text-foreground"
    >
      {LEGAL_REVIEW_BANNER}
    </div>
  );
}
