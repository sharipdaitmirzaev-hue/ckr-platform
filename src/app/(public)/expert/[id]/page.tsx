import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  expertSpecializationLabels,
  expertStatusLabels,
  verificationStatusLabels,
} from "@/config/experts";
import { ApplicationButton } from "@/features/applications/components/application-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getExpertById } from "@/lib/experts/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ExpertPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ExpertPageProps): Promise<Metadata> {
  const expert = await getExpertById(params.id);
  if (!expert) return { title: "Эксперт" };
  return {
    title: expert.fullName || expert.headline,
    description: expert.description.slice(0, 160),
  };
}

export default async function ExpertPage({ params }: ExpertPageProps) {
  const expert = await getExpertById(params.id);
  if (!expert) notFound();

  const current = await getCurrentUser();
  const isOwner = current?.user.id === expert.userId;

  if (expert.status !== "published" && !isOwner) {
    notFound();
  }

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {expertSpecializationLabels[expert.specialization]}
          </Badge>
          <Badge variant="default">
            Опыт: {expert.experienceYears} лет
          </Badge>
          <Badge variant="soft">
            {verificationStatusLabels[expert.verificationStatus]}
          </Badge>
          {isOwner ? (
            <Badge variant="soft">{expertStatusLabels[expert.status]}</Badge>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {expert.fullName || "Эксперт ЦКР"}
        </h1>
        <p className="mt-3 text-lg text-accent">{expert.headline}</p>

        <dl className="mt-10 grid gap-6 border-y border-border py-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Специализация
            </dt>
            <dd className="mt-2 text-foreground">
              {expertSpecializationLabels[expert.specialization]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Регион
            </dt>
            <dd className="mt-2 text-foreground">{expert.region}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Статус проверки
            </dt>
            <dd className="mt-2 text-foreground">
              {verificationStatusLabels[expert.verificationStatus]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Компания
            </dt>
            <dd className="mt-2 text-foreground">
              {expert.companyName || "—"}
            </dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground">Описание</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
            {expert.description}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground">Услуги</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
            {expert.services}
          </div>
        </section>

        <div className="mt-12 space-y-6 border-t border-border pt-8">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/experts" variant="outline">
              К каталогу
            </ButtonLink>
            {isOwner ? (
              <ButtonLink href="/dashboard/expert/edit" variant="outline">
                Редактировать
              </ButtonLink>
            ) : null}
          </div>

          {expert.status === "published" ? (
            <ApplicationButton
              targetType="expert"
              targetId={expert.id}
              label="Отправить заявку эксперту"
              isAuthenticated={Boolean(current)}
              isOwner={isOwner}
            />
          ) : null}
        </div>
      </Container>
    </div>
  );
}
