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
  showStatus = false,
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
        <Badge variant="default">{formatNeed(project)}</Badge>
        <VerificationBadge status={project.verificationStatus} />
        {showStatus ? (
          <Badge variant="soft">{projectStatusLabels[project.status]}</Badge>
        ) : null}
      </div>
      <CardTitle className="mt-4">{project.title}</CardTitle>
      <CardDescription>{project.summary}</CardDescription>
      <div className="mt-4 space-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <p>Стадия: {projectStageLabels[project.stage]}</p>
        <p>Требуется: {formatNeed(project)}</p>
      </div>
      {href ? (
        <p className="mt-4 text-sm text-accent">Подробнее →</p>
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
