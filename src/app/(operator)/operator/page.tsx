import { OperatorActivity } from "@/components/operator/operator-activity";
import { OperatorInsights } from "@/components/operator/operator-insights";
import { OperatorQueue } from "@/components/operator/operator-queue";
import { OperatorStats } from "@/components/operator/operator-stats";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { operatorRoleLabels } from "@/config/operator";
import { getOperatorDashboardData } from "@/lib/operator/queries";
import { requireOperator } from "@/lib/auth/require-operator";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Операционный центр ЦКР",
};

export const dynamic = "force-dynamic";

export default async function OperatorDashboardPage() {
  const operator = await requireOperator();
  const { stats, queue, activity, slaRules, insights } =
    await getOperatorDashboardData();

  const roleLabel = operator.isPlatformAdmin
    ? "Администратор платформы"
    : operator.operatorRoles
        .map((role) => operatorRoleLabels[role])
        .join(", ") || "Оператор";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Рабочее пространство команды"
          title="Операционный центр ЦКР"
          description={`Роль: ${roleLabel}. Очередь лидов, проектов, заявок, сделок, документов и задач.`}
        />
        <ButtonLink href="/operator/tasks" variant="primary" size="sm">
          Управление задачами
        </ButtonLink>
      </div>

      {!hasSupabaseEnv() ? (
        <Card variant="surface" className="p-5 text-sm text-muted">
          Supabase не настроен — примените миграцию `operator_center` и задайте
          env.
        </Card>
      ) : null}

      <OperatorStats stats={stats} />

      <Card variant="surface" className="p-5">
        <OperatorInsights insights={insights} slaRules={slaRules} />
      </Card>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            OperatorQueue
          </h2>
          <p className="text-sm text-muted">
            Новые лиды, проекты, заявки без ответа, сделки, документы и задачи.
          </p>
          <OperatorQueue items={queue} />
        </div>
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            OperatorActivity
          </h2>
          <p className="text-sm text-muted">
            Последние изменения в операционном контуре.
          </p>
          <OperatorActivity items={activity} />
        </div>
      </section>
    </div>
  );
}
