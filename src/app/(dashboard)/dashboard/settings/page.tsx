import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resolveCabinetContext } from "@/lib/cabinet/access";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Профиль" };
export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const cabinet = await resolveCabinetContext(current.user.id, current.roles);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Профиль"
        description="Данные аккаунта и быстрый доступ к разделам."
      />

      <section className="space-y-3 border-t border-border pt-6 md:hidden">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Ещё</p>
        <ul className="space-y-2 text-sm">
          {cabinet.hasOrganization ? (
            <li>
              <Link href="/partner" className="text-accent hover:underline">
                Компания
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/onboarding" className="text-accent hover:underline">
              Профиль и роли
            </Link>
          </li>
          <li>
            <Link href="/dashboard/billing" className="text-accent hover:underline">
              Оплата и подписка
            </Link>
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/onboarding" variant="outline">
          Открыть профиль и роли
        </ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="outline">
          Оплата и подписка
        </ButtonLink>
        {cabinet.hasOrganization ? (
          <ButtonLink href="/partner" variant="outline">
            Компания
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
