import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ProjectCard } from "@/components/projects/project-card";
import { EntityHistoryList } from "@/components/reputation/entity-history";
import { ReputationScore } from "@/components/reputation/reputation-score";
import { ReviewsList } from "@/components/reputation/reviews-list";
import { TrustBadgesRow } from "@/components/reputation/trust-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { expertSpecializationLabels } from "@/config/experts";
import type { ReviewTargetType } from "@/config/reputation";
import { roleLabels } from "@/config/roles";
import { siteConfig } from "@/config/site";
import { CreateReviewForm } from "@/features/reputation/components/create-review-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDemoMode } from "@/lib/demo/mode";
import { getPublicProfile } from "@/lib/profiles/queries";
import { getUserReputationBundle } from "@/lib/reputation/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ProfilePageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const bundle = await getPublicProfile(params.id);
  if (!bundle) {
    return { title: "Профиль" };
  }
  const { profile } = bundle;
  const description =
    profile.bio ||
    `${profile.fullName}${profile.companyName ? ` · ${profile.companyName}` : ""} — участник ЦКР`;

  return {
    title: profile.fullName,
    description,
    openGraph: {
      title: `${profile.fullName} · ${siteConfig.name}`,
      description,
      url: `/profile/${profile.id}`,
      type: "website",
      locale: siteConfig.ogLocale,
    },
    alternates: { canonical: `/profile/${profile.id}` },
  };
}

function defaultReviewType(roles: string[]): ReviewTargetType {
  if (roles.includes("expert")) return "expert";
  if (roles.includes("investor")) return "investor";
  return "service";
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const current = await getCurrentUser();
  const bundle = await getPublicProfile(params.id);

  if (!bundle) {
    if (current?.user.id === params.id) {
      return (
        <div className="py-16">
          <Container className="max-w-2xl">
            <SectionHeading
              title="Профиль скрыт"
              description="Ваш профиль сейчас не публичный. Включите видимость в настройках онбординга."
            />
            <div className="mt-8">
              <ButtonLink href="/onboarding" variant="outline">
                Настройки профиля
              </ButtonLink>
            </div>
          </Container>
        </div>
      );
    }
    notFound();
  }

  const { profile, projects, opportunities, expert } = bundle;
  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const reputation = await getUserReputationBundle(profile.id);
  const canReview =
    Boolean(current) &&
    current?.user.id !== profile.id &&
    !isDemoMode();

  const reviewTypes: ReviewTargetType[] = [];
  if (profile.roles.includes("expert") || expert) reviewTypes.push("expert");
  if (profile.roles.includes("investor")) reviewTypes.push("investor");
  if (reviewTypes.length === 0) reviewTypes.push("service");

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-5xl">
        <div className="flex flex-wrap items-center gap-2">
          {profile.roles.map((role) => (
            <Badge key={role} variant="accent">
              {roleLabels[role]}
            </Badge>
          ))}
          <VerificationBadge status={profile.verificationStatus} />
        </div>

        {reputation?.badges.length ? (
          <TrustBadgesRow
            className="mt-3"
            badges={reputation.badges.map((item) => item.badge)}
          />
        ) : null}

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {profile.fullName}
        </h1>

        {profile.companyName ? (
          <p className="mt-3 text-lg text-muted">{profile.companyName}</p>
        ) : null}

        {location ? (
          <p className="mt-2 text-sm text-muted">{location}</p>
        ) : null}

        {profile.bio ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            {profile.bio}
          </p>
        ) : null}

        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          {profile.website ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Сайт
              </dt>
              <dd className="mt-1">
                <a
                  href={profile.website}
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.website}
                </a>
              </dd>
            </div>
          ) : null}
          {profile.showContact &&
          profile.phone &&
          current &&
          !isDemoMode() ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Телефон
              </dt>
              <dd className="mt-1 text-foreground">{profile.phone}</dd>
            </div>
          ) : null}
        </dl>

        {reputation ? (
          <section className="mt-14 border-t border-border pt-10">
            <SectionHeading
              eyebrow="Репутация"
              title="Доверие в экосистеме ЦКР"
              description="Рейтинг, уровень проверки и факты участия — ориентир, не вердикт."
            />
            <div className="mt-8">
              <ReputationScore profile={reputation.profile} />
            </div>
            <div className="mt-6">
              <ButtonLink
                href={`/lia?scenario=check_reliability&message=${encodeURIComponent(
                  `Проверь надёжность участника id: ${profile.id}`,
                )}`}
                variant="outline"
              >
                Проверить надёжность с Лией
              </ButtonLink>
            </div>
          </section>
        ) : null}

        {expert ? (
          <section className="mt-14 border-t border-border pt-10">
            <SectionHeading
              eyebrow="Экспертиза"
              title={expert.headline || "Профиль эксперта"}
              description={expert.description}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="soft">
                {expertSpecializationLabels[expert.specialization]}
              </Badge>
              {expert.region ? (
                <Badge variant="soft">{expert.region}</Badge>
              ) : null}
              <Badge variant="soft">
                Опыт: {expert.experience_years} лет
              </Badge>
            </div>
            {expert.services ? (
              <p className="mt-4 text-sm text-muted">{expert.services}</p>
            ) : null}
            <div className="mt-6">
              <ButtonLink href={`/expert/${expert.id}`} variant="outline">
                Карточка эксперта
              </ButtonLink>
            </div>
          </section>
        ) : null}

        <section className="mt-14 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Отзывы"
            title="Отзывы участников"
            description="Оценки по завершённому опыту сотрудничества."
          />
          <div className="mt-8">
            <ReviewsList reviews={reputation?.reviews ?? []} />
          </div>
          {canReview ? (
            <div className="mt-8 max-w-xl border-t border-border pt-6">
              <p className="mb-4 text-sm text-muted">Оставить отзыв</p>
              <CreateReviewForm
                targetId={profile.id}
                defaultTargetType={defaultReviewType(profile.roles)}
                allowedTypes={reviewTypes}
              />
            </div>
          ) : null}
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <SectionHeading
            eyebrow="История"
            title="Участие в экосистеме"
            description="Проекты, сделки, партнёрства и завершённые задачи."
          />
          <div className="mt-8">
            <EntityHistoryList items={reputation?.history ?? []} />
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Проекты"
            title="Опубликованные проекты"
            description="Проекты участника в каталоге ЦКР."
          />
          {projects.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  href={`/project/${project.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Опубликованных проектов пока нет.
            </p>
          )}
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Возможности"
            title="Опубликованные возможности"
            description="Ресурсы, которые предлагает участник."
          />
          {opportunities.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {opportunities.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opportunity={item}
                  href={`/opportunity/${item.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Опубликованных возможностей пока нет.
            </p>
          )}
        </section>
      </Container>
    </div>
  );
}
