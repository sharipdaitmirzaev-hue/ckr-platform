import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { LaunchGuide } from "@/types/lia";

type Props = { report: LaunchGuide };

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function LaunchGuideCard({ report }: Props) {
  return (
    <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">LaunchGuide</Badge>
        <Badge variant="soft">только подсказки</Badge>
      </div>
      <p className="text-sm text-muted">{report.summary}</p>
      <div className="rounded-sm border border-accent/30 bg-accent-muted/20 px-3 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-accent">
          Рекомендуемая роль
        </p>
        <p className="mt-1 font-medium text-foreground">
          {report.recommended_role}
        </p>
        <p className="mt-1 text-sm text-muted">{report.role_rationale}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Первый шаг
        </p>
        <p className="mt-2 text-sm text-foreground">{report.first_step}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ListBlock title="Дальше" items={report.next_steps} />
        <ListBlock title="Советы" items={report.tips} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/onboarding" size="sm">
          Выбор роли
        </ButtonLink>
        <ButtonLink href="/dashboard" size="sm" variant="outline">
          Кабинет
        </ButtonLink>
      </div>
    </div>
  );
}
