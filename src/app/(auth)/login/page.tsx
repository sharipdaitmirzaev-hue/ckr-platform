import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Вход",
};

type LoginPageProps = {
  searchParams?: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Вход в ЦКР
      </h1>
      <p className="mt-2 text-sm text-muted">
        Войдите, чтобы открыть личный кабинет и управлять профилем.
      </p>

      {searchParams?.error === "blocked" ? (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          Аккаунт заблокирован администратором ЦКР. Обратитесь в поддержку.
        </p>
      ) : null}

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
