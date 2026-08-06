import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default function RegisterPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Регистрация
      </h1>
      <p className="mt-2 text-sm text-muted">
        Создайте аккаунт в экосистеме ЦКР. После регистрации — выбор роли,
        профиль и первый шаг с подсказкой Лии.
      </p>

      <ol className="mt-4 space-y-1 text-xs text-muted">
        <li>1. Регистрация</li>
        <li>2. Выбор роли</li>
        <li>3. Профиль</li>
        <li>4. Первое действие (проект / Лия / каталог)</li>
      </ol>

      <Suspense fallback={<p className="mt-8 text-sm text-muted">Загрузка формы…</p>}>
        <RegisterForm />
      </Suspense>

      <p className="mt-6 text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </Card>
  );
}
