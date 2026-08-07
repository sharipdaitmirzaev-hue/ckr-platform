import { MetricCard } from "@/components/analytics/metric-card";
import { ScenarioCard } from "@/components/product-testing/scenario-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  PRODUCT_TEST_SCENARIOS,
  productTestStatusLabels,
} from "@/config/product-testing";
import { CreateTaskForm } from "@/features/product-testing/components/create-task-form";
import { UpdateTestForm } from "@/features/product-testing/components/update-test-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  listProductTests,
  listScenarioProgress,
} from "@/lib/product-testing/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Продуктовые тесты — Админ",
};

export const dynamic = "force-dynamic";

export default async function AdminProductTestsPage() {
  const [progress, tasks] = await Promise.all([
    listScenarioProgress(),
    listProductTests({ kind: "task" }),
  ]);

  const passed = progress.filter((item) => item.status === "passed").length;
  const inProgress = progress.filter(
    (item) => item.status === "in_progress",
  ).length;
  const failed = progress.filter((item) => item.status === "failed").length;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Качество продукта"
        title="Продуктовые тесты ЦКР"
        description="Внутренний контроль пользовательских сценариев: не только код, а путь участника от идеи до сделки."
      />

      {!hasSupabaseEnv() ? (
        <Card variant="surface" className="p-5 text-sm text-muted">
          Supabase не настроен — сценарии видны как справочник. Для сохранения
          прогонов примените миграцию `product_tests` и задайте env.
        </Card>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-3">
        <MetricCard label="Сценариев пройдено" value={passed} hint={`из ${PRODUCT_TEST_SCENARIOS.length}`} />
        <MetricCard label="В работе" value={inProgress} />
        <MetricCard label="Провалено / блок" value={failed} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Сценарии прохождения
        </h2>
        <div className="space-y-6">
          {PRODUCT_TEST_SCENARIOS.map((scenario) => {
            const item = progress.find((row) => row.key === scenario.key);
            return (
              <ScenarioCard
                key={scenario.key}
                scenario={scenario}
                latest={item?.latest ?? null}
              />
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Новая тестовая задача
          </h2>
          <p className="text-sm text-muted">
            Зафиксируйте точечную проверку UX, текста или регрессии вне основного
            сценария.
          </p>
          <CreateTaskForm />
        </Card>

        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            Задачи и результаты
          </h2>
          {tasks.length === 0 ? (
            <EmptyState
              title="Задач пока нет"
              description="Создайте задачу слева или начните прогон сценария выше."
            />
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Card variant="surface" className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg text-foreground">
                        {task.title}
                      </h3>
                      <Badge variant="soft">
                        {productTestStatusLabels[task.status]}
                      </Badge>
                      {task.scenarioKey ? (
                        <Badge variant="accent">{task.scenarioKey}</Badge>
                      ) : null}
                    </div>
                    {task.description ? (
                      <p className="text-sm text-muted">{task.description}</p>
                    ) : null}
                    <UpdateTestForm test={task} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
