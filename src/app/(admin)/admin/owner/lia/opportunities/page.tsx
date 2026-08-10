import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import { listCandidates } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Возможности Лии" };

export default async function LiaOiOpportunitiesPage({
  searchParams,
}: {
  searchParams?: { saved?: string };
}) {
  const items = listCandidates({
    savedOnly: searchParams?.saved === "1",
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">
        Лента возможностей
      </h2>
      <p className="text-sm text-muted">
        Не тысячи ссылок — шорт-лист после normalize, dedup, analyze и scoring.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Лента пуста.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
