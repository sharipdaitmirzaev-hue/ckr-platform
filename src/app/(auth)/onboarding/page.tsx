import { Card } from "@/components/ui/card";
import { ASSIGNABLE_ROLES, type AssignableRole } from "@/config/roles";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Онбординг",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login");
  }

  const { trackBetaMilestone } = await import("@/lib/beta/track-milestone");
  await trackBetaMilestone({
    eventType: "onboarding_started",
    userId: current.user.id,
  });

  const roles = current.roles.filter((role): role is AssignableRole =>
    (ASSIGNABLE_ROLES as readonly string[]).includes(role),
  );

  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Добро пожаловать в ЦКР
      </h1>
      <p className="mt-2 text-sm text-muted">
        Выберите роль — платформа покажет персональный первый шаг: создать
        проект с Лией, найти проекты или оформить профиль эксперта.
      </p>

      <OnboardingForm profile={current.profile} roles={roles} />
    </Card>
  );
}
