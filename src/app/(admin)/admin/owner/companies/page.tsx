import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { listDagestanSeedCandidates } from "@/lib/company-intelligence/seed-candidates";
import { createClient } from "@/lib/supabase/server";
import { mapOrganizationRow } from "@/lib/partners/mappers";
import type { OrganizationRow } from "@/types/database";
import { OwnerCompanySeedForm } from "@/features/company-intelligence/owner-seed-form";
import { OwnerLiaEnrichButton } from "@/features/company-intelligence/owner-lia-enrich-button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Companies · Owner" };
export const dynamic = "force-dynamic";

export default async function OwnerCompaniesPage() {
  await requireLiaOiOwner();
  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);
  const orgs = (data as OrganizationRow[] | null)?.map(mapOrganizationRow) || [];
  const seeds = listDagestanSeedCandidates();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Владелец · Stage 4F"
        title="Company Intelligence"
        description="Ручной seed реальных компаний. Без mass import / fake / auto-publish. Matching не запускается."
      />

      <p className="text-sm space-x-3">
        <Link href="/organizations" className="text-accent hover:underline">
          Публичный каталог
        </Link>
        <Link href="/admin/owner/regional" className="text-accent hover:underline">
          Регионы
        </Link>
        <Link href="/dashboard/projects/create" className="text-accent hover:underline">
          + Проект
        </Link>
        <Link href="/dashboard/needs/new" className="text-accent hover:underline">
          + Need
        </Link>
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Добавить компанию</h2>
        <OwnerCompanySeedForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">В ЦКР сейчас ({orgs.length})</h2>
        <ul className="space-y-3">
          {orgs.map((o) => (
            <li key={o.id} className="border-b border-border py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/organizations/${o.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {o.name}
                </Link>
                <Badge>{o.region || "—"}</Badge>
                <Badge variant={o.verificationStatus === "verified" ? "accent" : undefined}>
                  {o.verificationStatus}
                </Badge>
              </div>
              <p className="text-muted">
                {o.industry || "—"} · offers: {(o.offersSummary || "—").slice(0, 80)}
              </p>
              <OwnerLiaEnrichButton organizationId={o.id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">
          Top-10 Dagestan seed candidates (не импортированы)
        </h2>
        <p className="text-xs text-muted">
          Только план для ручного owner seed. Production auto-import запрещён.
        </p>
        <ul className="space-y-3 text-sm">
          {seeds.map((s) => (
            <li key={s.id} className="border-b border-border py-2">
              <div className="font-medium">{s.name}</div>
              <div className="text-muted">
                {s.industry} · {s.region} · confidence {s.confidence}
              </div>
              <div className="text-muted">
                Source:{" "}
                <a
                  href={s.sourceUrl}
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.source}
                </a>
              </div>
              <div>Offers: {s.couldOffer}</div>
              <div>Needs: {s.couldNeed}</div>
              <div className="text-xs text-muted">{s.whyUseful}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
