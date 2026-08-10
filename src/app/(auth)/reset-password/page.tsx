import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Новый пароль",
};

export default async function ResetPasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=invalid_link");
  }

  return (
    <Card as="div" variant="surface" className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Новый пароль
      </h1>
      <p className="mt-2 text-sm text-muted">
        Придумайте новый пароль для входа в ЦКР.
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
