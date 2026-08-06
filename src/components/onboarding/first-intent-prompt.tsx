import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  FIRST_INTENT_PROMPTS,
  FIRST_USER_JOURNEY,
  FIRST_USER_PATHS,
} from "@/config/first-users";
import { pathForRoles } from "@/config/onboarding";
import type { AssignableRole } from "@/config/roles";
import Link from "next/link";

type Props = {
  roles: AssignableRole[];
  /** Если true — пользователь уже сделал ключевое действие роли. */
  firstActionDone?: boolean;
};

/**
 * Подсказка после регистрации / онбординга: «Что хотите сделать?»
 * Варианты связаны с Лией и первым путём роли.
 */
export function FirstIntentPrompt({
  roles,
  firstActionDone = false,
}: Props) {
  if (firstActionDone) return null;

  const path = pathForRoles(roles.length ? roles : ["entrepreneur"]);
  const roleKey =
    roles.includes("entrepreneur")
      ? "entrepreneur"
      : roles.includes("company")
        ? "organization"
        : roles.includes("investor")
          ? "investor"
          : roles.includes("expert")
            ? "expert"
            : "entrepreneur";
  const rolePath = FIRST_USER_PATHS[roleKey];

  return (
    <Card
      variant="surface"
      className="space-y-5 border-accent/40 bg-accent-muted/20 p-5"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">
          Первый шаг
        </p>
        <h2 className="mt-2 font-display text-xl text-foreground">
          Что хотите сделать?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Путь: {FIRST_USER_JOURNEY.join(" → ")}. Для роли «{rolePath.label}»
          короткий сценарий: {rolePath.chain}.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {FIRST_INTENT_PROMPTS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-sm border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent/50 hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
        <ButtonLink href={rolePath.href}>{rolePath.action}</ButtonLink>
        <ButtonLink href={path.href} variant="outline">
          {path.ctaLabel}
        </ButtonLink>
        <ButtonLink href="/lia" variant="outline">
          Открыть Лию
        </ButtonLink>
      </div>
    </Card>
  );
}
