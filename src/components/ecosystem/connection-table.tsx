import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { matchQualityTierLabels } from "@/config/ecosystem-value";
import type { ConnectionTableRow } from "@/lib/launch/ecosystem-value";

type Props = {
  rows: ConnectionTableRow[];
};

function qualityVariant(
  quality: ConnectionTableRow["quality"],
): "default" | "accent" | "soft" {
  if (quality === "successful") return "accent";
  if (quality === "strong") return "soft";
  return "default";
}

export function ConnectionTable({ rows }: Props) {
  return (
    <Card variant="surface" className="space-y-4 p-5">
      <div>
        <h3 className="font-display text-lg text-foreground">
          Связи (выборка)
        </h3>
        <p className="text-xs text-muted">
          Заявки, сделки и проекты организаций. Решения не принимаются
          автоматически.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Связей пока нет.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-2 py-2 font-medium">Тип</th>
                <th className="px-2 py-2 font-medium">Описание</th>
                <th className="px-2 py-2 font-medium">Статус</th>
                <th className="px-2 py-2 font-medium">Этап</th>
                <th className="px-2 py-2 font-medium">Качество</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="px-2 py-2 text-foreground">{row.typeLabel}</td>
                  <td className="px-2 py-2 text-foreground">{row.title}</td>
                  <td className="px-2 py-2 text-muted">{row.status}</td>
                  <td className="px-2 py-2 text-muted">{row.stage}</td>
                  <td className="px-2 py-2">
                    <Badge variant={qualityVariant(row.quality)}>
                      {matchQualityTierLabels[row.quality]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
