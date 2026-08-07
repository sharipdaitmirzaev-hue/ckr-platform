import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Новый пароль",
  description: "Задайте новый пароль для аккаунта ЦКР.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Новый пароль
      </h1>
      <p className="mt-2 text-sm text-muted">
        Откройте эту страницу по ссылке из письма. Затем задайте новый пароль.
      </p>
      <ResetPasswordForm />
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Вернуться ко входу
        </Link>
      </p>
    </Card>
  );
}
