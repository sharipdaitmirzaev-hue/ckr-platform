import { RegistrationStartedTracker } from "@/components/analytics/registration-started-tracker";
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
      <RegistrationStartedTracker />
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Регистрация
      </h1>
      <p className="mt-2 text-sm text-muted">
        Создайте аккаунт в экосистеме ЦКР. Путь: Главная → Лия → Регистрация →
        Роль → Онбординг → Первое действие.
      </p>

      <ol className="mt-4 space-y-1 text-xs text-muted">
        <li>1. Регистрация</li>
        <li>2. Роль и профиль</li>
        <li>3. Онбординг с подсказкой по роли</li>
        <li>4. Первое действие (идея/проект, интерес, профиль, партнёры)</li>
      </ol>
      <p className="mt-3 text-xs text-muted">
        Ещё до регистрации можно спросить Лию на{" "}
        <Link href="/lia" className="text-accent hover:underline">
          /lia
        </Link>
        .
      </p>

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
