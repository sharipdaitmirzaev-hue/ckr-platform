import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { mainNav } from "@/config/navigation";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {brand.fullName}. {brand.positioning}
          </p>
          <p className="mt-5 text-sm text-accent">{brand.tagline}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
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
                  href="/organization"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Организациям
                </Link>
              </li>
              <li>
                <Link
                  href="/trust"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Доверие
                </Link>
              </li>
              <li>
                <Link
                  href="/cases"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Кейсы
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
              <li>
                <Link
                  href="/register"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Регистрация
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-foreground/90 transition-colors hover:text-accent"
                >
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Все права защищены.</p>
          <p>Подготовка к интеграциям: Auth · Storage · API · Лия</p>
        </Container>
      </div>
    </footer>
  );
}
