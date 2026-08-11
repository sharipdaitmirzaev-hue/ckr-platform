import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { NeedCreateForm } from "@/features/need-profile/components/need-create-form";
import { NeedNlForm } from "@/features/need-profile/components/need-nl-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Новая потребность" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ intent?: string }>;

export default async function NewNeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/needs/new");
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/needs" className="text-sm text-accent hover:underline">
          ← Мои потребности
        </Link>
        <SectionHeading
          className="mt-3"
          title="Что вы хотите сделать?"
          description="Выберите карточку и заполните коротко — или опишите запрос своими словами. Matching не запускается."
        />
      </div>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">Короткая форма</h2>
        <NeedCreateForm defaultIntent={sp.intent} />
      </Card>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">
          Опишите своими словами
        </h2>
        <p className="text-sm text-muted">
          Лия (парсер) предложит структуру. Сохранение только после вашего
          подтверждения.
        </p>
        <NeedNlForm />
      </Card>
    </div>
  );
}
