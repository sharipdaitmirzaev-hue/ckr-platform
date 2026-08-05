import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  PROJECT_TEMPLATES,
  buildTemplateDescription,
  getProjectTemplate,
} from "@/config/project-templates";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { projectDraftFromSearchParams } from "@/lib/lia/project-draft";
import { listCategories } from "@/lib/projects/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Создать проект" };

type CreateProjectPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value[0]
      : "";
}

export default async function CreateProjectPage({
  searchParams,
}: CreateProjectPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const categories = await listCategories();
  const params = searchParams ?? {};
  const template = getProjectTemplate(readParam(params, "template"));
  const liaDefaults = projectDraftFromSearchParams(params);

  const templateDefaults = template
    ? {
        title: template.defaultTitle,
        summary: template.defaultSummary,
        description: buildTemplateDescription(template),
        category: template.category,
        stage: template.stage,
        investmentRequired: 0,
        currency: "RUB",
        region: "",
      }
    : null;

  const defaults = {
    ...(templateDefaults ?? {}),
    ...(liaDefaults ?? {}),
  };

  if (
    defaults.category &&
    categories.length > 0 &&
    !categories.some((item) => item.slug === defaults.category)
  ) {
    defaults.category = categories[0].slug;
  }

  const hasDefaults = Boolean(templateDefaults || liaDefaults);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Проекты"
        title="Новый проект"
        description="Опишите бизнес-идею или выберите шаблон развития бизнеса (кейс ТИНДА)."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/projects/create"
          className={cn(
            "rounded-sm border px-3 py-1.5 text-sm transition-colors",
            !template
              ? "border-accent/50 bg-accent-muted text-accent"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          Пустая форма
        </Link>
        {PROJECT_TEMPLATES.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/projects/create?template=${item.id}`}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-sm transition-colors",
              template?.id === item.id
                ? "border-accent/50 bg-accent-muted text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {template ? (
        <Card variant="surface" className="space-y-2 p-4">
          <p className="text-sm text-foreground">{template.description}</p>
          <p className="text-xs text-muted">
            Рекомендуемые этапы workspace:{" "}
            {template.suggestedMilestones.join(" → ")}
          </p>
        </Card>
      ) : null}

      <Card variant="surface" className="p-5 sm:p-6">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            Категории недоступны. Примените миграцию projects/categories в
            Supabase, затем обновите страницу.
          </p>
        ) : (
          <ProjectForm
            mode="create"
            categories={categories}
            defaults={hasDefaults ? defaults : null}
          />
        )}
      </Card>
    </div>
  );
}
