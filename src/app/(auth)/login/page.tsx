import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return (
    <div className="border border-border bg-surface/80 p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Вход в ЦКР
      </h1>
      <p className="mt-2 text-sm text-muted">
        Авторизация через Supabase будет подключена на Этапе 1.
      </p>

      <form className="mt-8 space-y-4" action="#" method="post">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-muted">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.ru"
            autoComplete="email"
            disabled
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-muted">
            Пароль
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled
          />
        </div>
        <Button type="button" className="w-full" disabled>
          Войти (скоро)
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Регистрация
        </Link>
      </p>
    </div>
  );
}
