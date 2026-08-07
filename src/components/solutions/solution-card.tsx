import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Solution, SolutionType } from "@/types";
import Link from "next/link";

const typeLabels: Record<SolutionType, string> = {
  find_investor: "Поиск инвестора",
  find_land: "Поиск земли",
  find_equipment: "Поиск оборудования",
  find_specialists: "Поиск специалистов",
  legal_support: "Юридическое сопровождение",
  marketing: "Маркетинг",
};

type SolutionCardProps = {
  solution: Solution;
  href?: string;
};

export function SolutionCard({ solution, href }: SolutionCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap gap-2">
        {solution.types.map((type) => (
          <Badge key={type} variant="soft">
            {typeLabels[type]}
          </Badge>
        ))}
      </div>
      <CardTitle className="mt-4 text-lg">{solution.title}</CardTitle>
      <CardDescription>{solution.summary}</CardDescription>
    </>
  );

  if (href) {
    return (
      <Card
        as="article"
        variant="surface"
        className="transition-colors hover:border-accent/40"
      >
        <Link href={href} className="block focus-visible:outline-none">
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article" variant="surface">
      {content}
    </Card>
  );
}
