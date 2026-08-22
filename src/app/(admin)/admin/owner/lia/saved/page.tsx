import { OpportunityCard } from "@/components/lia/oi/opportunity-card";
import { listCandidates } from "@/lib/lia/oi/store";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Сохранённые возможности" };

export default async function LiaOiSavedPage() {
  const items = await listCandidates({ savedOnly: true });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Сохранённые</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Пока ничего не сохранено. В карточке нажмите «Сохранить» или
          «Интересно».
        </p>
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
