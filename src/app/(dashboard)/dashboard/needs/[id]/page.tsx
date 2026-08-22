import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NeedStatusActions } from "@/features/need-profile/components/need-status-actions";
import { intentLabel } from "@/config/need-intents";
import { humanNeedStatus, UX_CTA } from "@/config/ux-simplification";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Что нужно" };
export const dynamic = "force-dynamic";

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const need = rowToNeed(data as NeedProfileRow);

  const { data: events } = await supabase
    .from("need_profile_events")
    .select("event_type,created_at,payload")
    .eq("need_profile_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/needs" className="text-sm text-accent hover:underline">
        ← Что вам нужно
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{intentLabel(need.intentType)}</Badge>
          <Badge>{humanNeedStatus(need.status)}</Badge>
        </div>
        <h1 className="font-display text-3xl text-foreground">{need.title}</h1>
        <p className="text-sm text-muted">{need.description}</p>
      </div>

      <Card variant="surface" className="grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted">Бюджет</p>
          <p>
            {need.budgetMax != null
              ? `до ${need.budgetMax.toLocaleString("ru-RU")} ${need.currency}`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted">Регионы</p>
          <p>{need.regions.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-muted">Отрасли</p>
          <p>{need.industries.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-muted">Подбор вариантов</p>
          <p>
            {need.matchingEnabled ? "ЦКР ищет варианты" : "Подбор на паузе"}
          </p>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="font-display text-xl">Действия</h2>
        <NeedStatusActions id={need.id} status={need.status} />
        <Link
          href="/dashboard/for-you"
          className="inline-flex text-sm text-accent hover:underline"
        >
          {UX_CTA.open} возможности →
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl">История</h2>
        <ul className="space-y-1 text-sm text-muted">
          {(events || []).map((e, i) => (
            <li key={`${e.created_at}-${i}`}>
              {e.event_type} · {e.created_at}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
