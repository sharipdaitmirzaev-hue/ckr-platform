import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listPublishedOpportunities } from "@/lib/opportunities/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возможности",
  description:
    "Ресурсы для реализации проектов ЦКР: земля, помещения, оборудование, готовый бизнес, технологии, услуги и партнёры.",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const [opportunities, current] = await Promise.all([
    listPublishedOpportunities(),
    getCurrentUser(),
  ]);

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
            href={current ? "/dashboard/opportunities/create" : "/register"}
            variant="outline"
          >
            {current ? "Предложить возможность" : "Войти, чтобы предложить"}
          </ButtonLink>
        </div>

        {opportunities.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Пока нет опубликованных возможностей"
            description="Земля, помещения, оборудование и готовый бизнес появятся здесь после публикации."
            actionHref="/demo"
            actionLabel="О демонстрации"
          />
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
