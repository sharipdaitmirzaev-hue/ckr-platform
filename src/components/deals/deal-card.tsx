"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEAL_STATUSES,
  dealStatusLabels,
  dealTypeLabels,
} from "@/config/deals";
import {
  commissionStatusLabels,
  commissionTypeLabels,
} from "@/config/monetization";
import { updateDealStatusAction } from "@/features/deals/actions";
import type { DealWithNames } from "@/lib/deals/queries";
import type { DealStatus } from "@/types";
import Link from "next/link";
import { useTransition } from "react";

type DealCardProps = {
  deal: DealWithNames;
  canManage: boolean;
};

export function DealCard({ deal, canManage }: DealCardProps) {
  const [pending, startTransition] = useTransition();

  function formatAmount() {
    if (deal.amount === null || deal.amount === undefined) return "Сумма не указана";
    const symbol = deal.currency === "RUB" ? "₽" : deal.currency;
    return `${new Intl.NumberFormat("ru-RU").format(deal.amount)} ${symbol}`;
  }

  return (
    <div className="space-y-3 rounded-sm border border-border bg-background/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{dealTypeLabels[deal.dealType]}</Badge>
        <Badge variant="soft">{dealStatusLabels[deal.status]}</Badge>
      </div>
      <p className="text-sm text-foreground">{formatAmount()}</p>
      {deal.commissionType && deal.commissionAmount !== null ? (
        <p className="text-xs text-muted">
          Комиссия ЦКР:{" "}
          {commissionTypeLabels[deal.commissionType]}{" "}
          {deal.commissionType === "percent"
            ? `${deal.commissionAmount}%`
            : `${new Intl.NumberFormat("ru-RU").format(deal.commissionAmount)} ${deal.currency === "RUB" ? "₽" : deal.currency}`}
          {deal.commissionStatus
            ? ` · ${commissionStatusLabels[deal.commissionStatus]}`
            : ""}
        </p>
      ) : null}
      {deal.description ? (
        <p className="text-sm text-muted">{deal.description}</p>
      ) : null}
      <p className="text-xs text-muted">
        Инициатор: {deal.initiatorName || "—"}
        {deal.partnerName ? ` · Партнёр: ${deal.partnerName}` : ""}
      </p>
      {deal.applicationId ? (
        <p className="text-xs text-muted">
          История: создана из{" "}
          <Link
            href="/dashboard/applications"
            className="text-accent underline-offset-2 hover:underline"
          >
            заявки
          </Link>
          <span className="ml-1 font-mono text-[11px] opacity-70">
            {deal.applicationId.slice(0, 8)}…
          </span>
        </p>
      ) : null}

      {canManage ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <label className="text-xs text-muted" htmlFor={`deal-status-${deal.id}`}>
            Статус
          </label>
          <select
            id={`deal-status-${deal.id}`}
            disabled={pending}
            defaultValue={deal.status}
            onChange={(event) => {
              const status = event.target.value as DealStatus;
              startTransition(async () => {
                await updateDealStatusAction(deal.id, deal.projectId, status);
              });
            }}
            className="h-9 rounded-sm border border-border bg-surface px-2 text-sm"
          >
            {DEAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {dealStatusLabels[status]}
              </option>
            ))}
          </select>
          {pending ? (
            <Button type="button" size="sm" variant="outline" disabled>
              Сохранение…
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
