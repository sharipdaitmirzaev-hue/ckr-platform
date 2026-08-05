import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Регистрация",
};

const roles = [
  "Предприниматель",
  "Инвестор",
  "Эксперт",
  "Компания",
] as const;

export default function RegisterPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Регистрация
      </h1>
      <p className="mt-2 text-sm text-muted">
        Создайте профиль в экосистеме ЦКР. Подключение Auth — Этап 1.
      </p>

      <form className="mt-8 space-y-4" action="#" method="post">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm text-muted">
            Имя или компания
          </label>
          <Input id="name" name="name" placeholder="Как к вам обращаться" disabled />
        </div>
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
          <label htmlFor="role" className="text-sm text-muted">
            Роль
          </label>
          <select
            id="role"
            name="role"
            disabled
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-muted"
            defaultValue=""
          >
            <option value="" disabled>
              Выберите роль
            </option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
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
            autoComplete="new-password"
            disabled
          />
        </div>
        <Button type="button" className="w-full" disabled>
          Создать аккаунт (скоро)
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </Card>
  );
}
