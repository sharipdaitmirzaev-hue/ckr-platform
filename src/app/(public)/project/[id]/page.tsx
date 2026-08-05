import { InvestmentCard } from "@/components/investments/investment-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  projectStageLabels,
  projectStatusLabels,
} from "@/config/projects";
import { ApplicationButton } from "@/features/applications/components/application-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMatchingInvestmentOffersForProject } from "@/lib/investments/queries";
import { getProjectById } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  };
}

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${symbol}`;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  const current = await getCurrentUser();
  const isOwner = current?.user.id === project.ownerId;

  if (project.status !== "published" && !isOwner) {
    notFound();
  }

  const matchingInvestors =
    project.status === "published"
      ? await listMatchingInvestmentOffersForProject(project)
      : [];

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {project.categoryName ?? project.category}
          </Badge>
          <Badge variant="soft">{project.region}</Badge>
          <Badge variant="default">{projectStageLabels[project.stage]}</Badge>
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
              Автор
            </dt>
            <dd className="mt-2 text-lg text-foreground">
              {project.ownerName || "Участник ЦКР"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">
              Категория
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

        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground">Описание</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
            {project.description}
          </div>
        </section>

        {project.status === "published" ? (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Подходит инвесторам
            </h2>
            <p className="mt-2 text-sm text-muted">
              Инвестиционные предложения, близкие по сумме, отрасли и региону.
              Инвестор может отправить заявку на проект через платформу.
            </p>

            {matchingInvestors.length > 0 ? (
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {matchingInvestors.map((offer) => (
                  <InvestmentCard
                    key={offer.id}
                    offer={offer}
                    ownerName={offer.ownerName}
                    href={`/investment/${offer.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Пока нет точных совпадений. Смотрите полный каталог инвестиций
                или отправьте предложение напрямую.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/investments" variant="outline">
                Каталог инвестиций
              </ButtonLink>
            </div>

            <div className="mt-6">
              <ApplicationButton
                targetType="project"
                targetId={project.id}
                label="Предложить инвестицию"
                isAuthenticated={Boolean(current)}
                isOwner={isOwner}
              />
            </div>
          </section>
        ) : null}

        <div className="mt-12 space-y-6 border-t border-border pt-8">
          <div className="flex flex-wrap gap-3">
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

          {project.status === "published" ? (
            <ApplicationButton
              targetType="project"
              targetId={project.id}
              label="Предложить сотрудничество"
              isAuthenticated={Boolean(current)}
              isOwner={isOwner}
            />
          ) : null}
        </div>
      </Container>
    </div>
  );
}
