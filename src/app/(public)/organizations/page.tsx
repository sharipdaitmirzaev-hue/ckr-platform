import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { filterOrganizationsCatalog } from "@/lib/company-intelligence/catalog";
import { listVerifiedOrganizations } from "@/lib/partners/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Компании · ЦКР" };
export const dynamic = "force-dynamic";

export default async function OrganizationsCatalogPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const region = String(searchParams?.region || "");
  const industry = String(searchParams?.industry || "");
  const offers = String(searchParams?.offers || "");
  const seeks = String(searchParams?.seeks || "");
  const q = String(searchParams?.q || "");

  const all = await listVerifiedOrganizations(200);
  const orgs = filterOrganizationsCatalog(all, {
    region,
    industry,
    offers,
    seeks,
    q,
    listedOnly: true,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Каталог"
        title="Компании и организации"
        description="Публичные verified карточки. Не Crunchbase — фокус на реальном региональном контексте ЦКР."
      />

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="region"
          defaultValue={region}
          placeholder="Регион"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="industry"
          defaultValue={industry}
          placeholder="Отрасль"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="offers"
          defaultValue={offers}
          placeholder="Что предлагает"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <input
          name="seeks"
          defaultValue={seeks}
          placeholder="Что ищет"
          className="h-10 rounded-sm border border-border bg-surface px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-sm bg-accent px-3 text-sm text-white sm:col-span-2 lg:col-span-1"
        >
          Фильтр
        </button>
      </form>

      <p className="text-sm text-muted">{orgs.length} компаний</p>

      <ul className="space-y-4">
        {orgs.map((o) => (
          <li key={o.id} className="border-b border-border pb-4">
            <Link
              href={`/organizations/${o.id}`}
              className="font-display text-xl text-foreground hover:text-accent"
            >
              {o.name}
            </Link>
            <div className="mt-1 flex flex-wrap gap-2">
              {o.region ? <Badge>{o.region}</Badge> : null}
              {o.industry ? <Badge>{o.industry}</Badge> : null}
              <Badge variant="accent">{o.verificationStatus}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">
              {(o.offersSummary || o.description || "—").slice(0, 180)}
            </p>
            {o.seeksSummary ? (
              <p className="mt-1 text-xs text-muted">Ищет: {o.seeksSummary}</p>
            ) : null}
          </li>
        ))}
        {orgs.length === 0 ? (
          <li className="text-sm text-muted">
            Пока нет verified компаний по фильтру. Owner может добавить через
            кабинет.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
