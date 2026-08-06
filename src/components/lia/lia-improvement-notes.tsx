import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LIA_IMPROVEMENT_NOTES } from "@/config/product-fix-sprint";

/** Заметки по улучшению Лии — без изменения логики движка. */
export function LiaImprovementNotes({ compact = false }: { compact?: boolean }) {
  return (
    <Card
      variant="surface"
      className={compact ? "space-y-3 p-4" : "space-y-4 p-5"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">Lia Improvement Notes</Badge>
        <span className="text-xs text-muted">Product Fix Sprint</span>
      </div>
      <ul className="space-y-3">
        {LIA_IMPROVEMENT_NOTES.map((note) => (
          <li key={note.id}>
            <p className="text-sm font-medium text-foreground">{note.title}</p>
            <p className="mt-1 text-sm text-muted">{note.note}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
