import { ExpertCard } from "@/components/experts/expert-card";
import { InvestmentCard } from "@/components/investments/investment-card";
import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  projectStageLabels,
  projectStatusLabels,
} from "@/config/projects";
import { siteConfig } from "@/config/site";
import { ApplicationButton } from "@/features/applications/components/application-button";
import { InterestButton } from "@/features/interests/components/interest-button";
import { ProjectLiaActions } from "@/features/lia/components/project-lia-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { maskDisplayName } from "@/lib/demo/mode";
import { listExpertsForProjectRegion } from "@/lib/experts/queries";
import { hasInterest } from "@/lib/interests/queries";
import { listMatchingInvestmentOffersForProject } from "@/lib/investments/queries";
import { listLiaAnalysesForProject } from "@/lib/lia/queries";
import { getProjectById } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type ProjectPageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const project = await getProjectById(params.id);
  if (!project) return { title: "Проект" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      url: `/project/${project.id}`,
      type: "website",
      locale: siteConfig.ogLocale,
      siteName: siteConfig.name,
    },
  };
}

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${symbol}`;
}

function PresentationBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  const current = await getCurrentUser();
  const isOwner = current?.user.id === project.ownerId;
  const interested =
    current && project.status === "published"
      ? await hasInterest(current.user.id, "project", project.id)
      : false;

  if (project.status !== "published" && !isOwner) {
    notFound();
  }

  if (project.status === "published") {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await trackAnalyticsEvent({
      eventType: "project_viewed",
      userId: current?.user.id ?? null,
      entityType: "project",
      entityId: project.id,
    });
  }

  const matchingInvestors =
    project.status === "published"
      ? await listMatchingInvestmentOffersForProject(project)
      : [];

  const matchingExperts =
    project.status === "published"
      ? await listExpertsForProjectRegion(project.region)
      : [];

  const recentAnalyses =
    isOwner && current
      ? await listLiaAnalysesForProject(project.id, current.user.id, 1)
      : [];
  const latestReport = recentAnalyses[0]?.report ?? null;

  const paragraphs = project.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {project.categoryName ?? project.category}
          </Badge>
          <Badge variant="soft">{project.region}</Badge>
          <Badge variant="default">{projectStageLabels[project.stage]}</Badge>
          <VerificationBadge status={project.verificationStatus} />
          {isOwner ? (
            <Badge variant="soft">
              {projectStatusLabels[project.status]}
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {project.title}
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {project.summary}
        </p>

        <dl className="mt-10 grid gap-6 border-y border-border py-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Требуемые инвестиции
            </dt>
            <dd className="mt-2 font-display text-2xl text-foreground">
              {formatMoney(project.investmentRequired, project.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Текущий этап
            </dt>
            <dd className="mt-2 text-lg text-foreground">
              {projectStageLabels[project.stage]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Отрасль
            </dt>
            <dd className="mt-2 text-foreground">
              {project.categoryName ?? project.category}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Регион
            </dt>
            <dd className="mt-2 text-foreground">{project.region}</dd>
          </div>
        </dl>

        <div className="mt-10 space-y-10">
          <PresentationBlock title="О проекте">
            <p className="whitespace-pre-wrap">
              {paragraphs[0] || project.description || project.summary}
            </p>
          </PresentationBlock>

          <PresentationBlock title="Проблема">
            <p>
              {paragraphs[1] ||
                "Проекту нужны ресурсы и партнёры для перехода к следующей стадии развития."}
            </p>
          </PresentationBlock>

          <PresentationBlock title="Решение">
            <p>
              {paragraphs[2] ||
                "ЦКР связывает проект с возможностями, экспертами и инвестициями в одной экосистеме."}
            </p>
          </PresentationBlock>

          <PresentationBlock title="Цель">
            <p>
              {paragraphs[3] ||
                `Довести проект «${project.title}» до устойчивой реализации на стадии «${projectStageLabels[project.stage]}».`}
            </p>
          </PresentationBlock>

          <PresentationBlock title="Текущий этап">
            <p>
              Стадия: <strong className="text-foreground">{projectStageLabels[project.stage]}</strong>
              . Статус публикации: {projectStatusLabels[project.status]}.
            </p>
          </PresentationBlock>

          <PresentationBlock title="Что уже есть">
            <ul className="list-disc space-y-1 pl-5">
              <li>Опубликованная карточка проекта в ЦКР</li>
              <li>Отрасль: {project.categoryName ?? project.category}</li>
              <li>Регион: {project.region}</li>
              <li>
                Автор:{" "}
                {maskDisplayName(project.ownerName, {
                  isAuthenticated: Boolean(current),
                })}
              </li>
            </ul>
          </PresentationBlock>

          <PresentationBlock title="Что требуется">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Инвестиции / ресурсы:{" "}
                {formatMoney(project.investmentRequired, project.currency)}
              </li>
              <li>Партнёры и экспертиза для реализации</li>
              <li>Заявки на сотрудничество через платформу</li>
            </ul>
          </PresentationBlock>

          <PresentationBlock title="Команда">
            <p>
              Автор проекта:{" "}
              {maskDisplayName(project.ownerName, {
                isAuthenticated: Boolean(current),
              })}
              . Расширение команды — через заявки к экспертам и партнёрам.
            </p>
          </PresentationBlock>

          <PresentationBlock title="Интерес">
            <p className="mb-4">
              Отметьте интерес или предложите сотрудничество — связь идёт через
              модули applications и interests ЦКР.
            </p>
            {project.status === "published" ? (
              <div className="flex flex-wrap gap-3">
                {current && !isOwner ? (
                  <InterestButton
                    targetType="project"
                    targetId={project.id}
                    initiallyInterested={interested}
                  />
                ) : null}
                <ApplicationButton
                  targetType="project"
                  targetId={project.id}
                  label="Предложить сотрудничество"
                  isAuthenticated={Boolean(current)}
                  isOwner={isOwner}
                />
              </div>
            ) : null}
          </PresentationBlock>
        </div>

        {isOwner ? (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Лия — анализ и поиск решений
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Определите, что уже есть и чего не хватает. Лия только рекомендует.
            </p>
            <div className="mt-6">
              <ProjectLiaActions
                projectId={project.id}
                initialReport={latestReport}
              />
            </div>
          </section>
        ) : null}

        {project.status === "published" ? (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Действия
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <ApplicationButton
                targetType="project"
                targetId={project.id}
                label="Предложить сотрудничество"
                isAuthenticated={Boolean(current)}
                isOwner={isOwner}
              />
              <ApplicationButton
                targetType="project"
                targetId={project.id}
                label="Предложить инвестицию"
                isAuthenticated={Boolean(current)}
                isOwner={isOwner}
              />
              <ButtonLink href="/experts" variant="outline">
                Стать экспертом
              </ButtonLink>
            </div>
          </section>
        ) : null}

        {project.status === "published" && matchingInvestors.length > 0 ? (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Подходит инвесторам
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {matchingInvestors.map((offer) => (
                <InvestmentCard
                  key={offer.id}
                  offer={offer}
                  ownerName={maskDisplayName(offer.ownerName, {
                    isAuthenticated: Boolean(current),
                  })}
                  href={`/investment/${offer.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {project.status === "published" && matchingExperts.length > 0 ? (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Эксперты региона
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {matchingExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  href={`/expert/${expert.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
          <ButtonLink href="/projects" variant="outline">
            К каталогу
          </ButtonLink>
          {isOwner ? (
            <ButtonLink
              href={`/dashboard/projects/${project.id}/edit`}
              variant="outline"
            >
              Редактировать
            </ButtonLink>
          ) : null}
        </div>
      </Container>

      <PublicLiaEntry compact />
    </div>
  );
}
