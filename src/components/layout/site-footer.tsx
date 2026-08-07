import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import {
  companyDetails,
  companyMailtoHref,
  companyTelegramHref,
  hasValue,
} from "@/config/company-details";
import { LEGAL_PAGES } from "@/config/legal";
import { mainNav, secondaryNav } from "@/config/navigation";
import Link from "next/link";

export function SiteFooter() {
  const emailHref = companyMailtoHref();
  const telegramHref = companyTelegramHref();

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {brand.fullName}. Помогаем развивать бизнес, находить решения,
            экспертов, партнёров и ресурсы.
          </p>
          <p className="mt-5 text-sm text-accent">{brand.tagline}</p>
          {(emailHref || telegramHref || hasValue(companyDetails.phone)) && (
            <ul className="mt-5 space-y-1.5 text-sm text-muted">
              {emailHref ? (
                <li>
                  <a href={emailHref} className="hover:text-accent">
                    {companyDetails.email}
                  </a>
                </li>
              ) : null}
              {hasValue(companyDetails.phone) ? (
                <li>{companyDetails.phone}</li>
              ) : null}
              {telegramHref ? (
                <li>
                  <a
                    href={telegramHref}
                    className="hover:text-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Telegram
                  </a>
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Разделы
          </p>
          <ul className="mt-4 space-y-2.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            О платформе
          </p>
          <ul className="mt-4 space-y-2.5">
            {secondaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/register"
                className="text-sm text-foreground/90 transition-colors hover:text-accent"
              >
                Регистрация
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Правовая информация
          </p>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_PAGES.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  {item.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. Все права защищены.
          </p>
          <p>{brand.tagline}</p>
        </Container>
      </div>
    </footer>
  );
}
