import { AnalysisHistory } from "@/components/lia/analysis-history";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { LIA_DISCLAIMER } from "@/config/lia";
import { LiaChat } from "@/features/lia/components/lia-chat";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getLiaSession,
  listLiaAnalyses,
  listLiaMessages,
  listLiaSessions,
} from "@/lib/lia/queries";
import { listCategories } from "@/lib/projects/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Лия — ИИ-навигатор ЦКР",
  description:
    "Лия помогает создавать проекты и искать решения: идея → анализ → ресурсы → комплексное решение.",
};

export const dynamic = "force-dynamic";

type LiaPageProps = {
  searchParams?: { session?: string; project?: string };
};

export default async function LiaPage({ searchParams }: LiaPageProps) {
  const current = await getCurrentUser();
  const [sessions, categories, analyses] = await Promise.all([
    current ? listLiaSessions(current.user.id) : Promise.resolve([]),
    listCategories(),
    current ? listLiaAnalyses(current.user.id, 12) : Promise.resolve([]),
  ]);

  const requestedSessionId = searchParams?.session ?? null;
  const projectId = searchParams?.project ?? null;
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
            description="Идея → Анализ → Проект → Поиск ресурсов → Комплексное решение → Реализация. Лия рекомендует и не действует без вашего подтверждения."
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
              autoStartRealize={Boolean(projectId && !activeSessionId)}
            />
          </div>

          <aside className="space-y-4">
            <Card variant="surface" className="space-y-3 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                Как работает Лия
              </p>
              <ol className="space-y-2 text-sm text-muted">
                <li>1. Создайте бизнес-проект через сценарий.</li>
                <li>2. Подтвердите создание — статус draft.</li>
                <li>3. Запустите анализ и поиск решений на карточке проекта.</li>
                <li>4. Проверьте совпадения ЦКР и внешние ориентиры.</li>
              </ol>
            </Card>

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
