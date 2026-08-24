import { OwnIdeaActionsForm } from "@/features/ckr-own-ideas/own-idea-actions-form";
import { OwnIdeasRunForm } from "@/features/ckr-own-ideas/own-ideas-run-form";
import {
  CKR_OWN_IDEAS_DIAGNOSTICS_PATH,
  CKR_OWN_IDEAS_NAV_LABEL,
  OWN_IDEA_ELEMENT_LABELS,
  OWN_IDEA_RATING_LABELS,
} from "@/config/ckr-own-ideas";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { formatMoneyRu, formatPaybackMonths } from "@/lib/ckr-own-ideas/economics";
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store-server";
import { internalSortScore } from "@/lib/ckr-own-ideas/rating";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: CKR_OWN_IDEAS_NAV_LABEL };
export const dynamic = "force-dynamic";

export default async function OwnIdeasPage() {
  await requireLiaOiOwner();
  const ideas = (await getOwnIdeaStore().list())
    .slice()
    .sort((a, b) => internalSortScore(b) - internalSortScore(a));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <Link href="/admin/owner" className="text-sm text-accent hover:underline">
          ← Кабинет владельца
        </Link>
        <SectionHeading
          className="mt-3"
          title={CKR_OWN_IDEAS_NAV_LABEL}
          description="Внутренние черновики ЦКР. Только владелец. Публикации, письма и заявки отсюда не уходят."
        />
      </div>

      <OwnIdeasRunForm />

      {ideas.length === 0 ? (
        <p className="text-sm text-muted">Пока нет черновиков. Нажмите «Найти новые идеи».</p>
      ) : (
        <ul className="space-y-4">
          {ideas.map((idea) => {
            const found = new Set(idea.components.filter((c) => c.found).map((c) => c.kind));
            return (
              <li key={idea.id} className="rounded-sm border border-border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg">{idea.title}</h2>
                  <span className="text-sm text-accent">
                    {OWN_IDEA_RATING_LABELS[idea.rating]}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  <span className="text-muted">Суть: </span>
                  {idea.essence}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Что нашли:{" "}
                  {(["ASSET", "DEMAND", "CAPITAL", "SUPPLY", "LOCATION"] as const)
                    .filter((k) => found.has(k))
                    .map((k) => `✓ ${OWN_IDEA_ELEMENT_LABELS[k]}`)
                    .join(" · ") || "—"}
                </p>
                {idea.missing.length > 0 ? (
                  <p className="mt-1 text-sm text-muted">
                    Не хватает: {idea.missing.map((m) => m.reason).join("; ")}
                  </p>
                ) : null}
                <p className="mt-2 text-sm">
                  Вложения: {formatMoneyRu(idea.economics.capex)} · Выручка:{" "}
                  {formatMoneyRu(idea.economics.revenue)} · Прибыль:{" "}
                  {formatMoneyRu(idea.economics.profit)} · Окупаемость:{" "}
                  {formatPaybackMonths(idea.economics.paybackMonths)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Важно: часть данных требует проверки. Не гарантия прибыли.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link href={`/admin/owner/own-ideas/${idea.id}`} className="text-sm text-accent hover:underline">
                    Открыть
                  </Link>
                  <OwnIdeaActionsForm ideaId={idea.id} variant="card" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted">
        Диагностика поиска:{" "}
        <Link href={CKR_OWN_IDEAS_DIAGNOSTICS_PATH} className="hover:underline">
          Ещё → Система
        </Link>
      </p>
    </div>
  );
}
