import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { dealRevenueStatusLabels } from "@/config/revenue";
import type { getProjectCommercialResult } from "@/lib/revenue/dashboard";

type Props = {
  data: Awaited<ReturnType<typeof getProjectCommercialResult>>;
};

function formatMoney(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

/**
 * Внутренний блок workspace — только для staff/admin.
 * Не показывать публично.
 */
export function ProjectCommercialResult({ data }: Props) {
  return (
    <Card variant="surface" className="space-y-4 border-amber-500/30 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl text-foreground">
          Коммерческий результат ЦКР
        </h2>
        <Badge variant="soft">только staff</Badge>
      </div>
      <p className="text-sm text-muted">
        Внутренняя экономика ЦКР. Не отображается на публичной карточке проекта.
      </p>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Услуги ЦКР
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {data.services.length === 0 ? (
            <li className="text-muted">Каталог услуг недоступен</li>
          ) : (
            data.services.map((s) => (
              <li key={s.title}>
                {s.title} · <span className="text-muted">{s.priceLabel}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Связанные сделки
        </p>
        {data.deals.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Сделок по проекту нет.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {data.deals.map((d) => (
              <li
                key={d.id}
                className="rounded-sm border border-border px-3 py-2"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">{d.dealType}</Badge>
                  <Badge variant="soft">
                    {dealRevenueStatusLabels[d.revenueStatus]}
                  </Badge>
                </div>
                <p className="mt-1">
                  Сумма:{" "}
                  {d.amount != null ? formatMoney(d.amount) : "не указана"}
                  {d.commissionAmount != null
                    ? ` · комиссия ${d.commissionAmount}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Комиссия (оценка)
          </p>
          <p className="mt-1 font-display text-lg">
            {formatMoney(data.commissionTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Статус оплаты (paid)
          </p>
          <p className="mt-1 font-display text-lg">
            {formatMoney(data.paidTotal)}
          </p>
        </div>
      </div>
    </Card>
  );
}
