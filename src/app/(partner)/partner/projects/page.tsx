import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { canManageOrganization } from "@/config/partners";
import { CreateOrgProjectForm } from "@/features/partners/components/org-create-forms";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import { listOrganizationProjects } from "@/lib/partners/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Проекты организации",
};

export const dynamic = "force-dynamic";

export default async function PartnerProjectsPage() {
  const session = await requirePartnerMembership();
  const projects = await listOrganizationProjects(
    session.primary.organization.id,
  );
  const canManage = canManageOrganization(session.primary.role);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Организация"
        title="Проекты"
        description="Участие организации в проектах экосистемы ЦКР."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Новый проект организации
          </h2>
          {canManage ? (
            <CreateOrgProjectForm />
          ) : (
            <p className="text-sm text-muted">
              Создание доступно владельцу и менеджеру.
            </p>
          )}
        </Card>
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">Список</h2>
          {projects.length === 0 ? (
            <EmptyState
              title="Проектов пока нет"
              description="Создайте проект от имени организации."
            />
          ) : (
            projects.map((project) => (
              <Card key={project.id} variant="surface" className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/project/${project.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {project.title}
                  </Link>
                  <Badge variant="soft">{project.status}</Badge>
                </div>
                <p className="text-sm text-muted">{project.summary}</p>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
