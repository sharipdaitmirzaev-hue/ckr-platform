import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import { liaOiBucketLabels } from "@/config/lia-oi";
import { listCandidates } from "@/lib/lia/oi/store";
import type { LiaOiCandidate, LiaOiResultBucket } from "@/types/lia-oi";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Возможности Лии" };

function section(
  title: string,
  items: LiaOiCandidate[],
  empty: string,
) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-lg text-foreground">
        {title}{" "}
        <span className="text-sm font-normal text-muted">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function LiaOiOpportunitiesPage({
  searchParams,
}: {
  searchParams?: { saved?: string };
}) {
  const items = await listCandidates({
    savedOnly: searchParams?.saved === "1",
  });

  const byBucket = (b: LiaOiResultBucket) =>
    items.filter((c) => c.resultBucket === b);

  const top = byBucket("TOP_OPPORTUNITIES");
  const research = byBucket("NEEDS_RESEARCH");
  const catalogs = byBucket("SOURCE_CATALOGS");
  const rejected = byBucket("REJECTED");
  const unbucketed = items.filter((c) => !c.resultBucket);

  const found = items.length;
  const fit = top.length;
  const needCheck = research.length;
  const rejectedN = rejected.length;
  const catalogsN = catalogs.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground">
          Лента возможностей
        </h2>
        <p className="mt-2 text-sm text-muted">
          Не тысячи ссылок — шорт-лист после hard constraints, detail validation
          и buckets.
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
          <div>
            <dt className="text-muted">Найдено</dt>
            <dd className="text-foreground">{found}</dd>
          </div>
          <div>
            <dt className="text-muted">Подходит</dt>
            <dd className="text-foreground">{fit}</dd>
          </div>
          <div>
            <dt className="text-muted">Требует проверки</dt>
            <dd className="text-foreground">{needCheck}</dd>
          </div>
          <div>
            <dt className="text-muted">Отсеяно</dt>
            <dd className="text-foreground">{rejectedN}</dd>
          </div>
          <div>
            <dt className="text-muted">Каталоги</dt>
            <dd className="text-foreground">{catalogsN}</dd>
          </div>
        </dl>
      </div>

      {section(
        liaOiBucketLabels.TOP_OPPORTUNITIES,
        top,
        "Пока нет подтверждённых возможностей в бюджете — это честный результат.",
      )}
      {section(
        liaOiBucketLabels.NEEDS_RESEARCH,
        research,
        "Нет сигналов, требующих ручной проверки цены/данных.",
      )}
      {section(
        liaOiBucketLabels.SOURCE_CATALOGS,
        catalogs,
        "Каталоги не найдены.",
      )}
      {rejectedN > 0 ? (
        <details className="space-y-3">
          <summary className="cursor-pointer font-display text-lg text-foreground">
            {liaOiBucketLabels.REJECTED}{" "}
            <span className="text-sm font-normal text-muted">
              ({rejectedN})
            </span>
          </summary>
          <div className="mt-3 space-y-3">
            {rejected.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        </details>
      ) : null}

      {unbucketed.length > 0
        ? section("Без bucket (legacy)", unbucketed, "")
        : null}
    </div>
  );
}
