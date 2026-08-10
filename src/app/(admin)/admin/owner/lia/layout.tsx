import { LiaOiNav } from "@/components/lia/oi/lia-oi-nav";
import { LiaOiStubBanner } from "@/components/lia/oi/stub-banner";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";

export default async function LiaOiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireLiaOiOwner();
  await ensureLiaOiSeed(current.user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Лия · Центр возможностей
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Opportunity Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Закрытый контур владельца: поиск, анализ и решения по бизнес-возможностям.
          Обычные пользователи этот раздел не видят.
        </p>
      </div>
      <LiaOiStubBanner />
      <LiaOiNav />
      {children}
    </div>
  );
}