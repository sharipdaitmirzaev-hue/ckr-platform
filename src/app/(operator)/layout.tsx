import { OperatorHeader } from "@/components/operator/operator-header";
import { Container } from "@/components/ui/container";
import { requireOperator } from "@/lib/auth/require-operator";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireOperator();

  return (
    <div className="min-h-screen">
      <OperatorHeader
        fullName={current.user.fullName}
        email={current.user.email}
        isPlatformAdmin={current.isPlatformAdmin}
      />
      <Container className="py-8">{children}</Container>
    </div>
  );
}
