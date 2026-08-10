import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
      />
      <header className="relative z-10 px-5 py-6 sm:px-8">
        <Logo />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5 pb-8 text-center text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-accent">
          Вернуться на главную
        </Link>
        <Link href="/privacy" className="transition-colors hover:text-accent">
          Конфиденциальность
        </Link>
        <Link href="/terms" className="transition-colors hover:text-accent">
          Соглашение
        </Link>
      </footer>
    </div>
  );
}
