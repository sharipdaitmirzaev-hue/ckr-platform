import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { intentLabel } from "@/config/need-intents";
import { humanNeedStatus, UX_CTA } from "@/config/ux-simplification";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Что вам нужно" };
export const dynamic = "force-dynamic";

export default async function DashboardNeedsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/needs");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("owner_type", "user")
    .eq("owner_id", current.user.id)
    .order("created_at", { ascending: false });

  const needs = error
    ? []
    : ((data as NeedProfileRow[] | null) || []).map(rowToNeed);
  const tableMissing =
    error &&
    (error.message.includes("does not exist") ||
      error.code === "42P01" ||
      error.message.includes("schema cache"));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          title="Что вам нужно"
          description="Коротко опишите задачу. Подходящие варианты появятся в разделе «Возможности»."
        />
        <ButtonLink href="/idea">{UX_CTA.newRequest}</ButtonLink>
      </div>

      {tableMissing ? (
        <Card variant="surface" className="p-5 text-sm text-muted">
          Таблица need_profiles ещё не применена в этой среде.
        </Card>
      ) : null}

      {!tableMissing && needs.length === 0 ? (
        <Card variant="surface" className="space-y-3 p-5">
          <p className="text-sm text-muted">
            Пока пусто. Расскажите, что вам нужно — ЦКР поможет найти подходящие
            варианты.
          </p>
          <ButtonLink href="/idea">{UX_CTA.newRequest}</ButtonLink>
        </Card>
      ) : null}

      <ul className="space-y-3">
        {needs.map((n) => (
          <li key={n.id}>
            <Card
              as="article"
              variant="surface"
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{intentLabel(n.intentType)}</Badge>
                  <Badge>{humanNeedStatus(n.status)}</Badge>
                </div>
                <Link
                  href={`/dashboard/needs/${n.id}`}
                  className="font-display text-lg text-foreground hover:text-accent"
                >
                  {n.title}
                </Link>
                {n.description ? (
                  <p className="line-clamp-2 text-sm text-muted">
                    {n.description}
                  </p>
                ) : null}
              </div>
              <ButtonLink href={`/dashboard/needs/${n.id}`} size="sm">
                {UX_CTA.open}
              </ButtonLink>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
