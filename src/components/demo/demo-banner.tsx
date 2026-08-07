import { isDemoMode } from "@/lib/demo/mode";
import Link from "next/link";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="border-b border-accent/30 bg-accent-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="text-accent">Demo mode ЦКР</span>
          {" — "}
          каталоги открыты без регистрации. Личные данные, документы и переписка
          скрыты.
        </p>
        <Link
          href="/demo"
          className="shrink-0 text-accent transition-colors hover:underline"
        >
          О демонстрации →
        </Link>
      </div>
    </div>
  );
}
