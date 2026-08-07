import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Нет доступа",
  description: "Недостаточно прав для просмотра раздела.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/unauthorized" },
  openGraph: {
    title: `Нет доступа · ${siteConfig.name}`,
    url: "/unauthorized",
  },
};

export default function UnauthorizedPage() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
      />
      <Container className="relative max-w-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">403</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Недостаточно прав
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Этот раздел доступен только авторизованным пользователям с нужной
          ролью. Войдите в аккаунт или вернитесь на главную.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/login">Войти</ButtonLink>
          <ButtonLink href="/" variant="outline">
            На главную
          </ButtonLink>
          <ButtonLink href="/contacts" variant="outline">
            Контакты
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
