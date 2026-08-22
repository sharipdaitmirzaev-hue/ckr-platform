import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Container } from "@/components/ui/container";
import { requireStaff } from "@/lib/auth/require-staff";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireStaff("/admin/crm");

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <AdminHeader
        fullName={current.user.fullName}
        email={current.user.email}
      />
      <Container className="grid gap-6 py-8 md:grid-cols-[260px_1fr] lg:gap-8">
        <AdminSidebar isPlatformAdmin={current.isPlatformAdmin} />
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
