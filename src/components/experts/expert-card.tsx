import { DemoBadge } from "@/components/demo/demo-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  expertSpecializationLabels,
  expertStatusLabels,
} from "@/config/experts";
import type { ExpertWithUser } from "@/lib/experts/queries";
import Link from "next/link";

type ExpertCardProps = {
  expert: ExpertWithUser;
  href?: string;
  showStatus?: boolean;
  actionLabel?: string;
};

export function ExpertCard({
  expert,
  href,
  showStatus = true,
  actionLabel = "Смотреть профиль",
}: ExpertCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {expertSpecializationLabels[expert.specialization]}
        </Badge>
        {showStatus ? (
          <Badge variant="soft">{expertStatusLabels[expert.status]}</Badge>
        ) : null}
        <VerificationBadge status={expert.verificationStatus} />
        <DemoBadge entityId={expert.id} />
      </div>
      <CardTitle className="mt-4">
        {expert.fullName || "Эксперт ЦКР"}
      </CardTitle>
      <p className="mt-1 text-sm text-accent">{expert.headline}</p>
      <CardDescription>
        {expert.description
          ? expert.description.length > 160
            ? `${expert.description.slice(0, 160).trimEnd()}…`
            : expert.description
          : "Компетенции для сопровождения проектов ЦКР."}
      </CardDescription>
      <div className="mt-4 space-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <p>Регион: {expert.region || "—"}</p>
        <p>Опыт: {expert.experienceYears} лет</p>
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
