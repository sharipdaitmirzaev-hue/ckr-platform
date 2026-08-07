import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
      />
      <Container className="relative flex min-h-screen flex-col justify-center py-20">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">404</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight">
          Страница не найдена
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
          Такого адреса в ЦКР нет. Вернитесь на главную или откройте каталоги
          проектов и возможностей.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/">На главную</ButtonLink>
          <ButtonLink href="/projects" variant="outline">
            Проекты
          </ButtonLink>
          <ButtonLink href="/lia" variant="outline">
            Лия
          </ButtonLink>
          <ButtonLink href="/contacts" variant="outline">
            Контакты
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
