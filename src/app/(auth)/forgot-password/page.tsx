import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Восстановление пароля",
};

type Props = {
  searchParams?: { error?: string };
};

export default function ForgotPasswordPage({ searchParams }: Props) {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Восстановление пароля
      </h1>
      <p className="mt-2 text-sm text-muted">
        Укажите email аккаунта — пришлём ссылку для сброса пароля.
      </p>

      {searchParams?.error === "invalid_link" ? (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          Ссылка для сброса недействительна или устарела. Запросите новую.
        </p>
      ) : null}

      <ForgotPasswordForm />

      <p className="mt-6 text-sm text-muted">
        Вспомнили пароль?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </Card>
  );
}
