import { OwnIdeaActionsForm } from "@/features/ckr-own-ideas/own-idea-actions-form";
import {
  CKR_OWN_IDEAS_NAV_LABEL,
  CKR_OWN_IDEAS_PATH,
  OWN_IDEA_ELEMENT_LABELS,
  OWN_IDEA_OWNER_STATE_LABELS,
  OWN_IDEA_RATING_LABELS,
} from "@/config/ckr-own-ideas";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { formatMoneyRu, formatPaybackMonths } from "@/lib/ckr-own-ideas/economics";
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store-server";
import { SectionHeading } from "@/components/ui/section-heading";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OwnIdeaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireLiaOiOwner();
  const idea = await getOwnIdeaStore().get(params.id);
  if (!idea) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Link href={CKR_OWN_IDEAS_PATH} className="text-sm text-accent hover:underline">
        ← {CKR_OWN_IDEAS_NAV_LABEL}
      </Link>
      <SectionHeading
        title={idea.title}
        description={`${OWN_IDEA_RATING_LABELS[idea.rating]} · ${OWN_IDEA_OWNER_STATE_LABELS[idea.ownerState]} · только владелец`}
      />

      <section className="space-y-2">
        <h2 className="font-display text-lg">Суть идеи</h2>
        <p className="text-sm">{idea.essence}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Почему ЦКР её заметил</h2>
        <p className="text-sm">{idea.whyNoticed}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Компоненты</h2>
        <ul className="space-y-1 text-sm">
          {idea.components.map((c) => (
            <li key={c.id}>
              {OWN_IDEA_ELEMENT_LABELS[c.kind]}: {c.title} · {c.provenance.kind} ·{" "}
              {c.origin === "INTERNAL_CKR" ? "внутри ЦКР" : "внешний"} ·{" "}
              {c.provenance.sourceLabel}
              {c.requiresCheck ? " · требует проверки" : ""}
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Что не найдено</h2>
        {idea.missing.length === 0 ? (
          <p className="text-sm text-muted">Критических пробелов нет.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {idea.missing.map((m) => (
              <li key={m.kind + m.reason}>{m.reason}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Экономика</h2>
        <ul className="space-y-1 text-sm">
          <li>Вложения (CAPEX): {formatMoneyRu(idea.economics.capex)}</li>
          <li>Оборотный капитал: {formatMoneyRu(idea.economics.workingCapital)}</li>
          <li>Финансирование: {formatMoneyRu(idea.economics.financing)}</li>
          <li>Выручка: {formatMoneyRu(idea.economics.revenue)}</li>
          <li>Переменные расходы: {formatMoneyRu(idea.economics.variableCosts)}</li>
          <li>Постоянные расходы: {formatMoneyRu(idea.economics.fixedCosts)}</li>
          <li>Стоимость финансирования: {formatMoneyRu(idea.economics.financingCost)}</li>
          <li>Прибыль: {formatMoneyRu(idea.economics.profit)}</li>
          <li>Маржа: {idea.economics.marginPct.amount == null || idea.economics.marginPct.kind === "UNKNOWN" ? "UNKNOWN" : `${idea.economics.marginPct.kind === "INFERENCE" ? "~" : ""}${idea.economics.marginPct.amount}%`}</li>
          <li>Окупаемость: {formatPaybackMonths(idea.economics.paybackMonths)}</li>
        </ul>
        {idea.economics.scenarios ? (
          <p className="text-sm text-muted">
            Сценарии прибыли: конс. {formatMoneyRu(idea.economics.scenarios.conservative)} ·
            база {formatMoneyRu(idea.economics.scenarios.base)} · опт.{" "}
            {formatMoneyRu(idea.economics.scenarios.optimistic)}
          </p>
        ) : null}
        <p className="text-xs text-muted">{idea.economics.disclaimer}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Что нужно проверить</h2>
        {idea.nextChecks.length === 0 ? (
          <p className="text-sm text-muted">Дополнительных проверок нет.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {idea.nextChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Источники</h2>
        <ul className="space-y-1 text-sm">
          {idea.components.map((c) => (
            <li key={c.id + "-src"}>
              {c.provenance.sourceLabel} ({c.provenance.trustLevel}
              {c.provenance.sourceUrl ? ` · ${c.provenance.sourceUrl}` : ""})
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">Риски и проверки</h2>
        <ul className="list-disc pl-5 text-sm">
          {idea.risks.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg">История</h2>
        <ul className="space-y-1 text-xs text-muted">
          {idea.events.map((e) => (
            <li key={e.id}>
              {e.at}: {e.note}
            </li>
          ))}
        </ul>
      </section>

      <OwnIdeaActionsForm ideaId={idea.id} />
    </div>
  );
}
