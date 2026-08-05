import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listPublishedOpportunities } from "@/lib/opportunities/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возможности",
  description:
    "Ресурсы для реализации проектов ЦКР: земля, помещения, оборудование, готовый бизнес, технологии, услуги и партнёры.",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await listPublishedOpportunities();

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Возможности"
            description="Ресурсы, которые можно предложить проектам: активы, технологии, услуги и партнёрство. Связка ЦКР: Проект → Возможность → Партнёр → Реализация."
          />
          <ButtonLink
            href="/dashboard/opportunities/create"
            variant="outline"
          >
            Предложить возможность
          </ButtonLink>
        </div>

        {opportunities.length === 0 ? (
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-muted">
              Опубликованных возможностей пока нет. После применения миграции и
              публикации первой карточки они появятся здесь.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                typeName={opportunity.typeName}
                href={`/opportunity/${opportunity.id}`}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
