import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireAdmin();

  return (
    <div className="min-h-screen">
      <AdminHeader
        fullName={current.user.fullName}
        email={current.user.email}
      />
      <Container className="grid gap-6 py-8 md:grid-cols-[260px_1fr] lg:gap-8">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
