import { SectionHeading } from "@/components/ui/section-heading";
import { OwnerMarketDiscoveryForm } from "@/features/opportunity-discovery/components/owner-market-discovery-form";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  describeOpportunityBankApproach,
  OPPORTUNITY_BANK_BUCKETS,
  sourceGapSummary,
  REVIEW_WITHOUT_MIGRATION_NOTE,
} from "@/lib/opportunity-discovery";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Поиск · Кабинет владельца",
};

export const dynamic = "force-dynamic";

export default async function OwnerDiscoveryPage() {
  await requireStaff("/admin/owner/discovery");
  const gaps = sourceGapSummary();

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <div>
        <Link href="/admin/owner" className="text-sm text-accent hover:underline">
          ← Кабинет владельца
        </Link>
        <SectionHeading
          className="mt-3"
          title="Поиск вариантов"
          description="Сначала внутри ЦКР, затем интернет — только по вашему действию. Найденное проходит проверку перед показом клиенту."
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Поиск по рынку</h2>
        <p className="text-sm text-muted">
          Для инвесторов и банка ЦКР. Варианты остаются на проверке сотрудника.
        </p>
        <OwnerMarketDiscoveryForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Банк возможностей</h2>
        <p className="text-sm text-muted whitespace-pre-wrap">
          {describeOpportunityBankApproach()}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {OPPORTUNITY_BANK_BUCKETS.map((b) => (
            <li key={b.key}>
              <Link
                href={b.href}
                className="block rounded-sm border border-border px-3 py-2 text-sm hover:bg-surface"
              >
                {b.labelRu}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Чего не хватает в источниках</h2>
        <ul className="space-y-1 text-sm text-muted">
          {gaps.map((g) => (
            <li key={g.category}>
              {g.category}: live {g.live} · planned {g.planned} · gap {g.gap}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">{REVIEW_WITHOUT_MIGRATION_NOTE}</p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/owner/inbox" className="text-accent hover:underline">
          Заявки
        </Link>
        <Link
          href="/admin/owner/publishing"
          className="text-accent hover:underline"
        >
          К публикации
        </Link>
        <Link
          href="/admin/owner/lia/search"
          className="text-accent hover:underline"
        >
          Попросить Лию проверить
        </Link>
      </div>
    </div>
  );
}
