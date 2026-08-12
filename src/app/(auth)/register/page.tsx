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
        Создать аккаунт
      </h1>
      <p className="mt-2 text-sm text-muted">
        Аккаунт нужен, чтобы следить за рассмотрением идеи, получать ответы ЦКР
        и продолжить работу. Отправить идею можно и без регистрации.
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
      <p className="mt-3 text-sm text-muted">
        Хотите сначала рассказать идею?{" "}
        <Link href="/idea" className="text-accent hover:underline">
          Перейти к форме
        </Link>
      </p>
    </Card>
  );
}
