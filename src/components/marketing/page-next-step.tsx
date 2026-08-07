import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

type Props = {
  title: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
};

/** Единый блок «следующий шаг» — без тупиков на публичных страницах. */
export function PageNextStep({ title, primary, secondary }: Props) {
  return (
    <section className="border-t border-border py-14 sm:py-16">
      <Container className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Следующий шаг
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href={primary.href} size="lg">
            {primary.label}
          </ButtonLink>
          {secondary ? (
            <ButtonLink href={secondary.href} variant="outline" size="lg">
              {secondary.label}
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
