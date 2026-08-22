import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { legalConfig } from "@/config/legal";
import { mainNav } from "@/config/navigation";
import Link from "next/link";

const legalNav = [
  { href: "/about", label: "О ЦКР" },
  { href: "/about#founder", label: "Основатель" },
  { href: "/requisites", label: "Реквизиты" },
  { href: "/terms", label: "Пользовательское соглашение" },
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/contacts", label: "Контакты" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Logo size="md" />
          <p className="max-w-md text-sm leading-relaxed text-muted">
            {brand.fullName}. {brand.positioning}
          </p>
          <div className="max-w-md space-y-2 border-t border-border pt-5 text-sm leading-relaxed">
            <p className="text-foreground">
              {legalConfig.projectShortName} — {legalConfig.projectFullName}
            </p>
            <p className="text-muted">{legalConfig.copy.activityLine}</p>
            <p className="text-muted">{legalConfig.founderStatement}</p>
            <p className="pt-1">
              <Link
                href="/requisites"
                className="text-accent transition-colors hover:underline"
              >
                Реквизиты и правовая информация →
              </Link>
            </p>
          </div>
          <p className="text-sm text-accent">{brand.tagline}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Начать
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/idea"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Расскажите нам вашу идею
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Войти
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  О ЦКР
                </Link>
              </li>
              <li>
                <Link
                  href="/contacts"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Контакты
                </Link>
              </li>
            </ul>
            <p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Ещё на сайте
            </p>
            <ul className="mt-4 space-y-2.5">
              {mainNav
                .filter((item) =>
                  [
                    "/projects",
                    "/opportunities",
                    "/investments",
                    "/experts",
                    "/how-it-works",
                    "/cases",
                    "/trust",
                  ].includes(item.href),
                )
                .map((item) => (
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
              Правовая информация
            </p>
            <ul className="mt-4 space-y-2.5">
              {legalNav.map((item) => (
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
            <p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Для участников
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/entrepreneur"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Предпринимателям
                </Link>
              </li>
              <li>
                <Link
                  href="/investor"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Инвесторам
                </Link>
              </li>
              <li>
                <Link
                  href="/expert"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Экспертам
                </Link>
              </li>
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
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {legalConfig.operator.shortLabel}.{" "}
            {legalConfig.projectShortName} — {legalConfig.projectKindLabel}.
          </p>
          <nav
            aria-label="Правовая информация"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <Link
              href="/privacy"
              className="transition-colors hover:text-accent"
            >
              Конфиденциальность
            </Link>
            <Link href="/terms" className="transition-colors hover:text-accent">
              Соглашение
            </Link>
            <Link
              href="/requisites"
              className="transition-colors hover:text-accent"
            >
              Реквизиты
            </Link>
            <Link
              href="/contacts"
              className="transition-colors hover:text-accent"
            >
              Контакты
            </Link>
          </nav>
        </Container>
      </div>
    </footer>
  );
}
