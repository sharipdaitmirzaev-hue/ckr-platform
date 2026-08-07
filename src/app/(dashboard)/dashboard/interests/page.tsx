import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { InterestButton } from "@/features/interests/components/interest-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMyInterests } from "@/lib/interests/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Интересы" };

export const dynamic = "force-dynamic";

export default async function DashboardInterestsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/interests");

  const interests = await listMyInterests(current.user.id);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Интересы"
        description="Проекты, возможности и инвестиционные предложения, отмеченные как интересные."
      />

      {interests.length === 0 ? (
        <Card variant="surface" className="space-y-3 p-5">
          <p className="text-sm text-muted">
            Пока нет отмеченных интересов. Откройте каталог и нажмите
            «Интересно».
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/projects" className="text-accent hover:underline">
              Проекты
            </Link>
            <Link href="/opportunities" className="text-accent hover:underline">
              Возможности
            </Link>
            <Link href="/investments" className="text-accent hover:underline">
              Инвестиции
            </Link>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {interests.map((item) => (
            <li key={item.id}>
              <Card
                as="article"
                variant="surface"
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{item.typeLabel}</Badge>
                    <span className="text-xs text-muted">
                      {new Date(item.createdAt ?? "").toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <Link
                    href={item.href}
                    className="block font-display text-lg text-foreground transition-colors hover:text-accent"
                  >
                    {item.title || "Объект интереса"}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={item.href}
                    className="text-sm text-accent hover:underline"
                  >
                    Открыть
                  </Link>
                  <InterestButton
                    targetType={item.targetType}
                    targetId={item.targetId}
                    initiallyInterested
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
