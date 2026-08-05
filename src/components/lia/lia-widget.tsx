import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LiaWidgetProps = {
  className?: string;
  compact?: boolean;
};

/**
 * Заготовка виджета ИИ-навигатора «Лия».
 * На Этапе 0 — визуальное место под будущую интеграцию.
 */
export function LiaWidget({ className, compact = false }: LiaWidgetProps) {
  return (
    <aside
      className={cn(
        "rounded-sm border border-border bg-surface/80",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
      aria-label="ИИ-навигатор Лия"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-foreground">Лия</p>
        <Badge variant="accent">Скоро</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        ИИ-навигатор платформы: поможет сформулировать идею, проанализировать
        проект, подобрать ресурсы и найти комплексные решения.
      </p>
      {!compact ? (
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span className="text-accent">—</span>
            Помощь в создании проекта
          </li>
          <li className="flex gap-2">
            <span className="text-accent">—</span>
            Анализ идеи
          </li>
          <li className="flex gap-2">
            <span className="text-accent">—</span>
            Подбор ресурсов и решений
          </li>
        </ul>
      ) : null}
    </aside>
  );
}
