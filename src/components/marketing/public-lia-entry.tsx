import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { CKR_LIA_ENTRY } from "@/config/ckr-website";
import Link from "next/link";

type Props = {
  compact?: boolean;
};

export function PublicLiaEntry({ compact = false }: Props) {
  return (
    <section
      className={
        compact
          ? "border-t border-border py-12 sm:py-14"
          : "border-t border-border py-20 sm:py-24"
      }
    >
      <Container>
        <div className="max-w-3xl">
          <Badge variant="accent">Лия</Badge>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {CKR_LIA_ENTRY.positioning}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Основной вход: расскажите о задаче → аудит → рекомендации → создание
            проекта. Лия только рекомендует.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-muted">
            <li>1. Аудит бизнеса</li>
            <li>2. Рекомендации и следующий шаг</li>
            <li>3. Создание проекта</li>
          </ol>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {CKR_LIA_ENTRY.scenarios.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-sm border border-border px-4 py-3 text-sm text-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={CKR_LIA_ENTRY.promptHref} size="lg">
            {CKR_LIA_ENTRY.promptLabel}
          </ButtonLink>
          <ButtonLink
            href="/register?next=/lia?scenario=business_audit"
            size="lg"
            variant="outline"
          >
            Регистрация и старт
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
