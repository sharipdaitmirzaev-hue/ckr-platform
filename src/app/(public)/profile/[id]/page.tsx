import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { expertSpecializationLabels } from "@/config/experts";
import { roleLabels } from "@/config/roles";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDemoMode } from "@/lib/demo/mode";
import { getPublicProfile } from "@/lib/profiles/queries";
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

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const current = await getCurrentUser();
  const bundle = await getPublicProfile(params.id);

  if (!bundle) {
    // Владелец может видеть свой закрытый профиль
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
