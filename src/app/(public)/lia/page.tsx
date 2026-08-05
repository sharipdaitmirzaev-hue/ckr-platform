import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { LIA_DISCLAIMER } from "@/config/lia";
import { LiaChat } from "@/features/lia/components/lia-chat";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getLiaSession,
  listLiaMessages,
  listLiaSessions,
} from "@/lib/lia/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Лия — ИИ-навигатор",
  description:
    "Лия помогает находить решения внутри ЦКР: идея, проект, возможности, инвестиции, эксперты.",
};

export const dynamic = "force-dynamic";

type LiaPageProps = {
  searchParams?: { session?: string };
};

export default async function LiaPage({ searchParams }: LiaPageProps) {
  const current = await getCurrentUser();
  const sessions = current ? await listLiaSessions(current.user.id) : [];

  const requestedSessionId = searchParams?.session ?? null;
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
            title="Лия"
            description="Помогает связать идею с проектами, возможностями, инвестициями и экспертами. Это навигатор платформы, а не автономный агент."
          />
          {!current ? (
            <ButtonLink href="/login?next=/lia" variant="outline">
              Войти, чтобы начать диалог
            </ButtonLink>
          ) : null}
        </div>

        <p className="mt-6 max-w-3xl text-sm text-muted">{LIA_DISCLAIMER}</p>

        <div className="mt-10">
          <LiaChat
            sessions={sessions}
            activeSessionId={activeSessionId}
            initialMessages={messages}
            isAuthenticated={Boolean(current)}
          />
        </div>
      </Container>
    </div>
  );
}
