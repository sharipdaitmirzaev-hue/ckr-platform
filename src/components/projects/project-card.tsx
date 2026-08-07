import { DemoBadge } from "@/components/demo/demo-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  projectStageLabels,
  projectStatusLabels,
} from "@/config/projects";
import type { Project } from "@/types";
import Link from "next/link";

const currencyLabels: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
};

type ProjectCardProps = {
  project: Project;
  href?: string;
  categoryName?: string | null;
  showStatus?: boolean;
  actionLabel?: string;
};

function formatNeed(project: Project) {
  const symbol = currencyLabels[project.currency] ?? project.currency;
  const amount = new Intl.NumberFormat("ru-RU").format(
    project.investmentRequired,
  );
  return `${amount} ${symbol}`;
}

export function ProjectCard({
  project,
  href,
  categoryName,
  showStatus = true,
  actionLabel = "Открыть проект",
}: ProjectCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {categoryName || project.category ? (
          <Badge variant="accent">
            {categoryName ?? project.category}
          </Badge>
        ) : null}
        <Badge variant="soft">{project.region}</Badge>
        {showStatus ? (
          <Badge variant="default">
            {projectStatusLabels[project.status]}
          </Badge>
        ) : null}
        <VerificationBadge status={project.verificationStatus} />
        <DemoBadge entityId={project.id} />
      </div>
      <CardTitle className="mt-4">{project.title}</CardTitle>
      <CardDescription>
        {project.summary || "Проект экосистемы ЦКР."}
      </CardDescription>
      <div className="mt-4 space-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <p>Стадия: {projectStageLabels[project.stage]}</p>
        <p>Требуется: {formatNeed(project)}</p>
      </div>
      {href ? (
        <p className="mt-5 text-sm font-medium text-accent">
          {actionLabel} →
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Card
        as="article"
        variant="catalog"
        className="transition-colors hover:border-accent/50"
      >
        <Link href={href} className="block focus-visible:outline-none">
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article" variant="catalog">
      {content}
    </Card>
  );
}
