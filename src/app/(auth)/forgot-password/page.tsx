import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Отправьте ссылку для сброса пароля аккаунта ЦКР.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Восстановление пароля
      </h1>
      <p className="mt-2 text-sm text-muted">
        Укажите email аккаунта — отправим ссылку для сброса пароля.
      </p>
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
