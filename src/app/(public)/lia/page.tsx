import { LiaPublicStartTracker } from "@/components/analytics/lia-public-start-tracker";
import { AnalysisHistory } from "@/components/lia/analysis-history";
import { LiaImprovementNotes } from "@/components/lia/lia-improvement-notes";
import { LiaRecommendations } from "@/components/lia/lia-recommendations";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { LIA_DISCLAIMER, LIA_SCENARIOS } from "@/config/lia";
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

export const metadata: Metadata = {
  title: "Лия — ИИ-навигатор ЦКР",
  description:
    "Первый вход в ЦКР: опишите ситуацию → вопросы Лии → BusinessAuditReport → следующий шаг.",
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
            eyebrow="Первый вход · Лия"
            title="Опишите ситуацию — получите аудит и следующий шаг"
            description="Посетитель → вопросы Лии → BusinessAuditReport → создать проект, консультация или поиск ресурсов. Лия рекомендует и не действует без подтверждения."
          />
          {!current ? (
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={`/register?next=${encodeURIComponent(guestNext)}`}
              >
                Регистрация и старт
              </ButtonLink>
              <ButtonLink
                href={`/login?next=${encodeURIComponent(guestNext)}`}
                variant="outline"
              >
                Войти
              </ButtonLink>
            </div>
          ) : null}
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
              guestNextPath={guestNext}
            />
          </div>

          <aside className="space-y-4">
            {current ? (
              <LiaRecommendations items={recommendations} />
            ) : (
              <Card variant="surface" className="space-y-3 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  Путь через Лию
                </p>
                <ol className="space-y-2 text-sm text-muted">
                  <li>1. Опишите ситуацию или выберите «Аудит бизнеса».</li>
                  <li>2. Ответьте на короткие вопросы Лии.</li>
                  <li>3. Получите BusinessAuditReport.</li>
                  <li>4. Выберите: проект, консультация или ресурсы.</li>
                </ol>
                <ButtonLink
                  href={`/register?next=${encodeURIComponent("/lia?scenario=business_audit")}`}
                  size="sm"
                  className="mt-2"
                >
                  Начать аудит
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
