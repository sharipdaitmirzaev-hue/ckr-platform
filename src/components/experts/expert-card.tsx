import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  expertSpecializationLabels,
  expertStatusLabels,
  verificationStatusLabels,
} from "@/config/experts";
import type { ExpertWithUser } from "@/lib/experts/queries";
import Link from "next/link";

type ExpertCardProps = {
  expert: ExpertWithUser;
  href?: string;
  showStatus?: boolean;
};

export function ExpertCard({
  expert,
  href,
  showStatus = false,
}: ExpertCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {expertSpecializationLabels[expert.specialization]}
        </Badge>
        <Badge variant="default">
          Опыт: {expert.experienceYears}{" "}
          {expert.experienceYears === 1 ? "год" : "лет"}
        </Badge>
        <Badge variant="soft">
          {verificationStatusLabels[expert.verificationStatus]}
        </Badge>
        {showStatus ? (
          <Badge variant="soft">{expertStatusLabels[expert.status]}</Badge>
        ) : null}
      </div>
      <CardTitle className="mt-4">
        {expert.fullName || "Эксперт ЦКР"}
      </CardTitle>
      <p className="mt-1 text-sm text-accent">{expert.headline}</p>
      <CardDescription>
        {expert.description.length > 160
          ? `${expert.description.slice(0, 160).trimEnd()}…`
          : expert.description}
      </CardDescription>
      <div className="mt-4 space-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <p>Регион: {expert.region || "—"}</p>
        <p>
          Услуги:{" "}
          {expert.services.length > 80
            ? `${expert.services.slice(0, 80).trimEnd()}…`
            : expert.services || "—"}
        </p>
      </div>
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
