import { RegistrationStartedTracker } from "@/components/analytics/registration-started-tracker";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Регистрация",
  description:
    "Регистрация в ЦКР: выберите роль и сделайте первое действие — аудит с Лией, проект, интерес или профиль.",
};

export default function RegisterPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <RegistrationStartedTracker />
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Регистрация
      </h1>
      <p className="mt-2 text-sm text-muted">
        Три шага: регистрация → выбор роли → первое действие. До аккаунта можно
        спросить Лию на{" "}
        <Link href="/lia?scenario=business_audit" className="text-accent hover:underline">
          /lia
        </Link>
        .
      </p>

      <ol className="mt-4 space-y-1 text-xs text-muted">
        <li>1. Создайте аккаунт</li>
        <li>2. Выберите роль</li>
        <li>3. Сделайте первое действие (аудит / проект / интерес / профиль)</li>
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
