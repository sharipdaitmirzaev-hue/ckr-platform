import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PUBLIC_LIA_PROMPTS } from "@/config/marketplace";
import Link from "next/link";

type Props = {
  /** Компактный вариант для вставки в середину страницы. */
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
          <Badge variant="accent">Первый вход · Лия</Badge>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Опишите ситуацию — Лия проведёт аудит
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Посетитель → описание ситуации → вопросы Лии → BusinessAuditReport →
            следующий шаг: создать проект, получить консультацию или найти
            ресурсы. Лия только рекомендует.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-muted">
            <li>1. Расскажите о бизнесе или идее</li>
            <li>2. Ответьте на короткие вопросы Лии</li>
            <li>3. Получите BusinessAuditReport</li>
            <li>4. Выберите следующий шаг в ЦКР</li>
          </ol>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {PUBLIC_LIA_PROMPTS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-sm border border-border px-4 py-3 text-sm text-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/lia?scenario=business_audit" size="lg">
            Получить аудит бизнеса
          </ButtonLink>
          <ButtonLink href="/register?next=/lia?scenario=business_audit" size="lg" variant="outline">
            Регистрация и старт с Лией
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
