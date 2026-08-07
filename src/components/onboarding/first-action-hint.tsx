import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FIRST_USER_JOURNEY } from "@/config/first-users";
import { pathForRoles } from "@/config/onboarding";
import type { AssignableRole } from "@/config/roles";

type FirstActionHintProps = {
  roles: AssignableRole[];
  hasProject: boolean;
  hasLia: boolean;
  hasInterest: boolean;
  hasExpertProfile?: boolean;
  hasOrganization?: boolean;
};

/**
 * Подсказка первого действия — точки высокого выхода воронки beta
 * (профиль → Лия / создание объекта).
 */
export function FirstActionHint({
  roles,
  hasProject,
  hasLia,
  hasInterest,
  hasExpertProfile = false,
  hasOrganization = false,
}: FirstActionHintProps) {
  const path = pathForRoles(roles.length ? roles : ["entrepreneur"]);
  const done =
    (roles.includes("entrepreneur") && hasProject && hasLia) ||
    (roles.includes("investor") && hasInterest) ||
    (roles.includes("expert") && hasExpertProfile) ||
    (roles.includes("company") && hasOrganization);

  if (done) return null;

  return (
    <Card
      variant="surface"
      className="space-y-3 border-accent/40 bg-accent-muted/20 p-5"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-accent">
        Не останавливайтесь здесь
      </p>
      <h2 className="font-display text-xl text-foreground">{path.title}</h2>
      <p className="text-sm text-muted">
        {path.description} Путь: {FIRST_USER_JOURNEY.join(" → ")}. После
        профиля чаще всего останавливаются — сделайте первое действие сейчас.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={path.href}>{path.ctaLabel}</ButtonLink>
        <ButtonLink href="/lia?scenario=launch_guide" variant="outline">
          Как начать с ЦКР
        </ButtonLink>
      </div>
    </Card>
  );
}
