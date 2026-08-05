import { ExpertCard } from "@/components/experts/expert-card";
import { RoleLanding } from "@/components/marketing/role-landing";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  EXPERT_SPECIALIZATIONS,
  expertSpecializationLabels,
} from "@/config/experts";
import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import { listPublishedExperts } from "@/lib/experts/queries";
import { cn } from "@/lib/utils";
import type { ExpertSpecialization } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

const content = roleLandings.experts;

export const metadata: Metadata = {
  title: "Эксперты",
  description: content.solution,
  openGraph: {
    title: `${content.eyebrow} · ${siteConfig.name}`,
    description: content.solution,
    url: "/experts",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/experts" },
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
    <RoleLanding content={content}>
      <section id="catalog" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Каталог"
            title="Эксперты ЦКР"
            description="Проверенные компетенции для сопровождения проектов."
          />

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Специализация
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/experts#catalog"
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
                  href={`/experts?specialization=${item}#catalog`}
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
            <EmptyState
              className="mt-12"
              title="Опубликованных экспертов пока нет"
              description="Создайте профиль эксперта в кабинете и отправьте на модерацию — после публикации он появится в каталоге."
              actionHref="/dashboard/expert"
              actionLabel="Создать профиль эксперта"
            />
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
      </section>
    </RoleLanding>
  );
}
