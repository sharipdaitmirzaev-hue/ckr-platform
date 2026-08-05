import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Вход в ЦКР
      </h1>
      <p className="mt-2 text-sm text-muted">
        Войдите, чтобы открыть личный кабинет и управлять профилем.
      </p>

      <Suspense fallback={<p className="mt-8 text-sm text-muted">Загрузка формы...</p>}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Регистрация
        </Link>
      </p>
    </Card>
  );
}
