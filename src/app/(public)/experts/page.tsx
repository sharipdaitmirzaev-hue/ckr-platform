import { ExpertCard } from "@/components/experts/expert-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  EXPERT_SPECIALIZATIONS,
  expertSpecializationLabels,
} from "@/config/experts";
import { listPublishedExperts } from "@/lib/experts/queries";
import { cn } from "@/lib/utils";
import type { ExpertSpecialization } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Эксперты",
  description:
    "Каталог экспертов ЦКР: юристы, бухгалтеры, маркетологи, инженеры и консультанты для реализации проектов.",
};

export const dynamic = "force-dynamic";

type ExpertsPageProps = {
  searchParams?: { specialization?: string };
};

export default async function ExpertsPage({ searchParams }: ExpertsPageProps) {
  const specialization = EXPERT_SPECIALIZATIONS.includes(
    searchParams?.specialization as ExpertSpecialization,
  )
    ? (searchParams?.specialization as ExpertSpecialization)
    : null;

  const experts = await listPublishedExperts({ specialization });

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Эксперты"
            description="Система доверия ЦКР: проверенные компетенции и опыт для сопровождения проектов — от права и учёта до инженерии и маркетинга."
          />
          <ButtonLink href="/dashboard/expert/create" variant="outline">
            Стать экспертом
          </ButtonLink>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Специализация
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/experts"
              className={cn(
                "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                !specialization
                  ? "border-accent/50 bg-accent-muted text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              Все
            </Link>
            {EXPERT_SPECIALIZATIONS.map((item) => (
              <Link
                key={item}
                href={`/experts?specialization=${item}`}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                  specialization === item
                    ? "border-accent/50 bg-accent-muted text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {expertSpecializationLabels[item]}
              </Link>
            ))}
          </div>
        </div>

        {experts.length === 0 ? (
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-muted">
              Опубликованных экспертов пока нет. Примените миграцию и создайте
              профиль эксперта в кабинете.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                href={`/expert/${expert.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
