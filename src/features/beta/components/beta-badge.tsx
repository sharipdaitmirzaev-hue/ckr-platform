import { platformVersion } from "@/config/version";

type BetaBadgeProps = {
  className?: string;
};

export function BetaBadge({ className = "" }: BetaBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent ${className}`}
      title={`Версия платформы ${platformVersion.version} · ${platformVersion.releasedAt}`}
    >
      <span>{platformVersion.label}</span>
      <span className="font-mono normal-case tracking-normal text-accent/80">
        {platformVersion.version}
      </span>
    </span>
  );
}
