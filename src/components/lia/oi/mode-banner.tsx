import { resolveOiSearchMode } from "@/lib/lia/oi/mode";

export function LiaOiModeBanner() {
  const mode = resolveOiSearchMode();
  const isLive = mode.mode === "live";

  return (
    <div
      role="status"
      className={
        isLive
          ? "rounded-sm border border-border bg-surface px-4 py-3 text-sm text-foreground"
          : "rounded-sm border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-foreground"
      }
    >
      <p className={isLive ? "font-medium text-foreground" : "font-medium text-accent"}>
        {mode.bannerTitle}
      </p>
      <p className="mt-1 text-muted">{mode.bannerBody}</p>
      <p className="mt-1 text-xs text-muted">
        Провайдер: {mode.providerLabel}
        {mode.liveAvailable ? "" : " · API key не задан или provider ≠ web_api"}
      </p>
    </div>
  );
}
