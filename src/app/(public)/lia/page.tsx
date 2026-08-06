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
    "Лия помогает создавать проекты и искать решения: идея → анализ → ресурсы → комплексное решение.",
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

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="ИИ-навигатор ЦКР"
            title="Лия — создание проектов и поиск решений"
            description="Спросите, что хотите сделать. Первый ответ Лии назовёт 1–2 шага и даст переход к действию. Лия рекомендует и не действует без вашего подтверждения."
          />
          {!current ? (
            <ButtonLink href="/login?next=/lia" variant="outline">
              Войти, чтобы начать диалог
            </ButtonLink>
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
            />
          </div>

          <aside className="space-y-4">
            {current ? (
              <LiaRecommendations items={recommendations} />
            ) : (
              <Card variant="surface" className="space-y-3 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  Как работает Лия
                </p>
                <ol className="space-y-2 text-sm text-muted">
                  <li>1. Скажите, что хотите сделать (идея, ресурс, роль).</li>
                  <li>2. Получите короткий ответ с 1–2 шагами.</li>
                  <li>3. Подтвердите действие — проект, профиль или интерес.</li>
                  <li>4. Продолжайте в кабинете по пути вашей роли.</li>
                </ol>
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
