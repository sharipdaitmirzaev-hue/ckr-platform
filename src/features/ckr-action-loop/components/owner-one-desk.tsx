"use client";

import { OwnerActionLoopPanel } from "@/features/ckr-action-loop/components/owner-action-loop-panel";
import { OwnerDemandWorkbench } from "@/features/ckr-inbox/components/owner-demand-workbench";
import { OwnerRequestDiscoveryPanel } from "@/features/opportunity-discovery/components/owner-request-discovery-panel";
import type { DemandWorkbenchItem } from "@/lib/demand-intelligence/workbench";
import type { CkrRequestAction } from "@/types/ckr-action-loop";

/**
 * Stage 4P — Operator One Desk.
 * Orchestrates existing Discovery + Demand + Action Loop into one work block.
 * Does not remove underlying capabilities.
 */
export function OwnerOneDesk(props: {
  requestId: string;
  needProfileId: string | null;
  needTitle: string | null;
  total: number;
  confirmed: DemandWorkbenchItem[];
  potential: DemandWorkbenchItem[];
  review: DemandWorkbenchItem[];
  emptyReason: string | null;
  oiReviewCount: number;
  queryPlanSamples: string[];
  actions: CkrRequestAction[];
}) {
  const topCandidate =
    props.confirmed[0] || props.potential[0] || props.review[0] || null;

  return (
    <section className="space-y-6 rounded-sm border border-border p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Рабочий блок
        </p>
        <h2 className="mt-1 font-display text-xl text-foreground">
          Поиск и возможности
        </h2>
        <p className="mt-1 text-sm text-muted">
          Потребность → поиск → варианты → показать клиенту → действие →
          результат. Один контур, без дублирования процессов.
        </p>
      </div>

      <div className="space-y-2 border-b border-border pb-4">
        <h3 className="text-sm font-medium text-foreground">
          1. Текущая потребность
        </h3>
        {props.needProfileId ? (
          <p className="text-sm text-foreground">
            {props.needTitle || "Потребность связана"}{" "}
            <code className="text-xs text-muted">{props.needProfileId}</code>
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            Сначала свяжите потребность обращения (блок ниже на странице).
          </p>
        )}
      </div>

      <div className="space-y-2 border-b border-border pb-4">
        <h3 className="text-sm font-medium text-foreground">
          2. Внутренний поиск и расширение
        </h3>
        <OwnerRequestDiscoveryPanel
          requestId={props.requestId}
          needProfileId={props.needProfileId}
          embedded
        />
      </div>

      <div className="space-y-2 border-b border-border pb-4">
        <h3 className="text-sm font-medium text-foreground">
          3. Найденные варианты · показать клиенту
        </h3>
        <OwnerDemandWorkbench
          requestId={props.requestId}
          needProfileId={props.needProfileId}
          needTitle={props.needTitle}
          total={props.total}
          confirmed={props.confirmed}
          potential={props.potential}
          review={props.review}
          emptyReason={props.emptyReason}
          oiReviewCount={props.oiReviewCount}
          queryPlanSamples={props.queryPlanSamples}
          embedded
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          4. Создать действие · зафиксировать результат
        </h3>
        <OwnerActionLoopPanel
          requestId={props.requestId}
          actions={props.actions}
          suggestedItem={
            topCandidate
              ? {
                  itemType: topCandidate.itemType,
                  itemId: topCandidate.itemId,
                  itemTitle: topCandidate.title,
                }
              : null
          }
        />
      </div>
    </section>
  );
}
