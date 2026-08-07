import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { mainNav, secondaryNav } from "@/config/navigation";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {brand.fullName}. Помогаем развивать бизнес, находить решения,
            экспертов, партнёров и ресурсы.
          </p>
          <p className="mt-5 text-sm text-accent">{brand.tagline}</p>
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
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. Все права защищены.
          </p>
          <p>Партнёрство · Надёжность · Результат</p>
        </Container>
      </div>
    </footer>
  );
}
