import { LiaPublicStartTracker } from "@/components/analytics/lia-public-start-tracker";
import { AnalysisHistory } from "@/components/lia/analysis-history";
import { LiaImprovementNotes } from "@/components/lia/lia-improvement-notes";
import { LiaRecommendations } from "@/components/lia/lia-recommendations";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { CKR_LIA_ENTRY } from "@/config/ckr-website";
import { LIA_DISCLAIMER, LIA_SCENARIOS } from "@/config/lia";
import { siteConfig } from "@/config/site";
import { LiaChat } from "@/features/lia/components/lia-chat";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getLiaSession,
  listLiaAnalyses,
  listLiaMessages,
  listLiaSessions,
} from "@/lib/lia/queries";
import { buildLiaRecommendations } from "@/lib/lia/recommendations";
import { listCategories } from "@/lib/projects/queries";
import type { LiaScenarioId } from "@/types/lia";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Лия — интеллектуальный помощник ЦКР",
  description:
    "Лия — интеллектуальный помощник ЦКР: аудит бизнеса, развитие идеи, стратегия и поиск решений.",
  openGraph: {
    title: `Лия · ${siteConfig.name}`,
    description: CKR_LIA_ENTRY.positioning,
    url: "/lia",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/lia" },
};

export const dynamic = "force-dynamic";

type LiaPageProps = {
  searchParams?: {
    session?: string;
    project?: string;
    scenario?: string;
    message?: string;
  };
};

const SCENARIO_IDS = new Set(LIA_SCENARIOS.map((item) => item.id));

export default async function LiaPage({ searchParams }: LiaPageProps) {
  const current = await getCurrentUser();
  const [sessions, categories, analyses, recommendations] = await Promise.all([
    current ? listLiaSessions(current.user.id) : Promise.resolve([]),
    listCategories(),
    current ? listLiaAnalyses(current.user.id, 12) : Promise.resolve([]),
    current
      ? buildLiaRecommendations(current.user.id)
      : Promise.resolve([]),
  ]);

  const requestedSessionId = searchParams?.session ?? null;
  const projectId = searchParams?.project ?? null;
  const scenarioParam = searchParams?.scenario ?? null;
  const messageParam = searchParams?.message ?? null;
  const autoStartScenario =
    scenarioParam && SCENARIO_IDS.has(scenarioParam as LiaScenarioId)
      ? (scenarioParam as LiaScenarioId)
      : null;
  const autoStartMessage =
    autoStartScenario && messageParam
      ? messageParam.slice(0, 2000)
      : autoStartScenario
        ? (LIA_SCENARIOS.find((item) => item.id === autoStartScenario)?.prompt ??
          null)
        : null;

  const activeSession =
    current && requestedSessionId
      ? await getLiaSession(requestedSessionId, current.user.id)
      : null;

  const activeSessionId = activeSession?.id ?? null;
  const messages =
    current && activeSessionId
      ? await listLiaMessages(activeSessionId)
      : [];

  const guestNext = `/lia${
    autoStartScenario
      ? `?scenario=${encodeURIComponent(autoStartScenario)}${
          autoStartMessage
            ? `&message=${encodeURIComponent(autoStartMessage)}`
            : ""
        }`
      : ""
  }`;

  return (
    <div className="py-14 sm:py-16">
      <LiaPublicStartTracker
        scenario={autoStartScenario}
        fromPublic={!current || Boolean(autoStartScenario)}
      />
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Лия"
            title={CKR_LIA_ENTRY.positioning}
            description="Аудит бизнеса, развитие идеи, стратегия и поиск решений. Лия рекомендует следующий шаг и не действует без вашего подтверждения."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={CKR_LIA_ENTRY.promptHref} size="lg">
              {CKR_LIA_ENTRY.promptLabel}
            </ButtonLink>
            {!current ? (
              <>
                <ButtonLink
                  href={`/register?next=${encodeURIComponent(guestNext || "/lia?scenario=business_audit")}`}
                  variant="outline"
                >
                  Регистрация
                </ButtonLink>
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(guestNext || "/lia?scenario=business_audit")}`}
                  variant="outline"
                >
                  Войти
                </ButtonLink>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CKR_LIA_ENTRY.scenarios.map((item) => (
            <Link
              key={item.href}
              href={
                current
                  ? item.href
                  : `/register?next=${encodeURIComponent(item.href)}`
              }
              className="rounded-sm border border-border px-4 py-3 transition-colors hover:border-accent/50"
            >
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted">{item.description}</p>
            </Link>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-sm text-muted">{LIA_DISCLAIMER}</p>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div>
            <LiaChat
              sessions={sessions}
              activeSessionId={activeSessionId}
              initialMessages={messages}
              isAuthenticated={Boolean(current)}
              categories={categories}
              projectId={projectId}
              autoStartRealize={Boolean(
                projectId && !activeSessionId && !autoStartScenario,
              )}
              autoStartScenario={
                !activeSessionId ? autoStartScenario : null
              }
              autoStartMessage={!activeSessionId ? autoStartMessage : null}
              guestNextPath={guestNext || "/lia?scenario=business_audit"}
            />
          </div>

          <aside className="space-y-4">
            {current ? (
              <LiaRecommendations items={recommendations} />
            ) : (
              <Card variant="surface" className="space-y-3 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  {CKR_LIA_ENTRY.promptLabel}
                </p>
                <ol className="space-y-2 text-sm text-muted">
                  <li>1. Опишите задачу или бизнес.</li>
                  <li>2. Ответьте на вопросы Лии.</li>
                  <li>3. Получите BusinessAuditReport.</li>
                  <li>4. Выберите: проект, консультация или ресурсы.</li>
                </ol>
                <ButtonLink
                  href={`/register?next=${encodeURIComponent("/lia?scenario=business_audit")}`}
                  size="sm"
                  className="mt-2"
                >
                  Начать
                </ButtonLink>
              </Card>
            )}

            <LiaImprovementNotes compact />

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                История анализа
              </p>
              <AnalysisHistory analyses={analyses} />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
