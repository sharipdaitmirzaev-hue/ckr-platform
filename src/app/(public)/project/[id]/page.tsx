import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  projectStageLabels,
  projectStatusLabels,
} from "@/config/projects";
import { getCurrentUser } from "@/lib/auth/get-current-user";
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

        <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
          <ButtonLink href="/projects" variant="outline">
            К каталогу
          </ButtonLink>
          {isOwner ? (
            <ButtonLink
              href={`/dashboard/projects/${project.id}/edit`}
              variant="primary"
            >
              Редактировать
            </ButtonLink>
          ) : (
            <ButtonLink href="/register" variant="primary">
              Стать партнёром ЦКР
            </ButtonLink>
          )}
        </div>
      </Container>
    </div>
  );
}
