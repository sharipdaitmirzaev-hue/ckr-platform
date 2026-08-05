import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
};

function formatNeed(project: Project) {
  const symbol = currencyLabels[project.currency] ?? project.currency;
  const amount = new Intl.NumberFormat("ru-RU").format(project.investmentRequired);
  return `от ${amount} ${symbol}`;
}

export function ProjectCard({ project, href }: ProjectCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">{project.region}</Badge>
        <Badge variant="accent">{formatNeed(project)}</Badge>
        {project.seekingPartners ? (
          <Badge variant="default">Партнёры</Badge>
        ) : null}
      </div>
      <CardTitle className="mt-4">{project.title}</CardTitle>
      <CardDescription>{project.summary}</CardDescription>
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
