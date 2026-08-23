import { CKR_OWN_IDEAS_NAV_LABEL, CKR_OWN_IDEAS_PATH } from "@/config/ckr-own-ideas";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store";
import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OwnIdeasDiagnosticsPage() {
  await requireLiaOiOwner();
  const run = getOwnIdeaStore().lastRun();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link href={CKR_OWN_IDEAS_PATH} className="text-sm text-accent hover:underline">
        ← {CKR_OWN_IDEAS_NAV_LABEL}
      </Link>
      <SectionHeading
        title="Opportunity Builder diagnostics"
        description="Служебные метрики поиска. Не для ежедневной работы."
      />
      {!run ? (
        <p className="text-sm text-muted">Запусков ещё не было.</p>
      ) : (
        <pre className="overflow-auto rounded-sm border border-border p-3 text-xs">
          {JSON.stringify(run, null, 2)}
        </pre>
      )}
    </div>
  );
}
