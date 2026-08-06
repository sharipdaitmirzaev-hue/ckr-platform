import { ExpertCard } from "@/components/experts/expert-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { RequestVerificationForm } from "@/features/verification/components/request-verification-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMyExpertProfile } from "@/lib/experts/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Профиль эксперта" };

export default async function DashboardExpertPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const expert = await getMyExpertProfile(current.user.id);

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
    verificationStatus: expert.verificationStatus ?? "unverified",
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
          <p className="text-sm text-muted">Статус проверки эксперта</p>
          <VerificationBadge status={expert.verificationStatus} />
        </div>
        {expert.verificationStatus !== "verified" &&
        expert.verificationStatus !== "pending" ? (
          <RequestVerificationForm
            targetType="expert"
            targetId={expert.id}
          />
        ) : null}
        <p className="text-xs text-muted">
          Документы для проверки — в разделе{" "}
          <Link href="/dashboard/documents" className="text-accent hover:underline">
            Документы
          </Link>
          .
        </p>
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
