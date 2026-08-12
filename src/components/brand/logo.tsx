import { ShieldMark } from "@/components/brand/shield-mark";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
};

const sizes = {
  sm: { mark: "h-7 w-6", text: "text-lg", gap: "gap-2" },
  md: { mark: "h-8 w-7", text: "text-xl", gap: "gap-2.5" },
  lg: { mark: "h-12 w-10", text: "text-3xl", gap: "gap-3" },
  xl: { mark: "h-16 w-14", text: "text-5xl", gap: "gap-4" },
} as const;

export function Logo({
  className,
  href = "/",
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const s = sizes[size];

  const content = (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <ShieldMark className={s.mark} />
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-semibold tracking-[0.08em] text-foreground",
            s.text,
          )}
        >
          ЦКР
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex transition-opacity duration-200 hover:opacity-90"
      aria-label="ЦКР — на главную"
    >
      {content}
    </Link>
  );
}
