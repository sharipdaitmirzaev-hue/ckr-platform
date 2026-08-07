import { ShieldMark } from "@/components/brand/shield-mark";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const sizes = {
  sm: { mark: "h-7 w-6", text: "text-lg", gap: "gap-2", px: 28 },
  md: { mark: "h-8 w-7", text: "text-xl", gap: "gap-2.5", px: 32 },
  lg: { mark: "h-12 w-10", text: "text-3xl", gap: "gap-3", px: 48 },
} as const;

/**
 * Логотип ЦКР.
 * Если владелец загрузил файл в public/brand и задал NEXT_PUBLIC_BRAND_LOGO_PATH —
 * показываем исходный файл. Иначе — ShieldMark + wordmark (не генерируем новый логотип).
 */
export function Logo({
  className,
  href = "/",
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const s = sizes[size];
  const brandLogoPath = process.env.NEXT_PUBLIC_BRAND_LOGO_PATH?.trim();

  const content = (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      {brandLogoPath ? (
        <Image
          src={brandLogoPath}
          alt="ЦКР"
          width={s.px}
          height={s.px}
          className={cn(s.mark, "object-contain")}
          priority={size === "lg"}
        />
      ) : (
        <ShieldMark className={s.mark} />
      )}
      {showWordmark && !brandLogoPath ? (
        <span
          className={cn(
            "font-display font-semibold tracking-[0.08em] text-foreground",
            s.text,
          )}
        >
          ЦКР
        </span>
      ) : null}
      {showWordmark && brandLogoPath ? (
        <span className="sr-only">ЦКР — Центр комплексных решений</span>
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
