import { ExpertCard } from "@/components/experts/expert-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { verificationStatusLabels } from "@/config/experts";
import { requestProfileVerificationAction } from "@/features/experts/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMyExpertProfile } from "@/lib/experts/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Профиль эксперта" };

export default async function DashboardExpertPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const expert = await getMyExpertProfile(current.user.id);
  const verification =
    current.user.verificationStatus ?? "unverified";

  if (!expert) {
    return (
      <div className="space-y-8">
        <SectionHeading
          title="Профиль эксперта"
          description="Создайте экспертный профиль — часть системы доверия ЦКР. После публикации проекты смогут отправлять вам заявки."
        />
        <Card variant="surface" className="p-6">
          <p className="text-sm text-muted">
            Профиль эксперта ещё не создан.
          </p>
          <div className="mt-4">
            <ButtonLink href="/dashboard/expert/create">
              Создать профиль эксперта
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const expertView = {
    ...expert,
    fullName: current.user.fullName,
    companyName: current.user.companyName ?? null,
    verificationStatus: verification,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          title="Профиль эксперта"
          description="Управляйте компетенциями, услугами и статусом публикации."
        />
        <ButtonLink href="/dashboard/expert/edit">Редактировать</ButtonLink>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted">Статус проверки участника</p>
          <Badge variant="accent">
            {verificationStatusLabels[verification]}
          </Badge>
        </div>
        {verification === "unverified" ? (
          <form action={requestProfileVerificationAction}>
            <Button type="submit" size="sm" variant="outline">
              Запросить проверку
            </Button>
          </form>
        ) : null}
        {current.user.website ? (
          <p className="text-sm text-muted">
            Сайт:{" "}
            <a
              href={current.user.website}
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {current.user.website}
            </a>
          </p>
        ) : null}
      </Card>

      <ExpertCard expert={expertView} href={`/expert/${expert.id}`} showStatus />
    </div>
  );
}
