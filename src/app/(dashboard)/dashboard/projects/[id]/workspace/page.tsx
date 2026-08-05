import { ActivityTimeline } from "@/components/deals/activity-timeline";
import { DealCard } from "@/components/deals/deal-card";
import { MilestoneList } from "@/components/deals/milestone-list";
import { DocumentList } from "@/components/documents/document-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { dealParticipantRoleLabels } from "@/config/deals";
import { projectStageLabels, projectStatusLabels } from "@/config/projects";
import { AddParticipantForm } from "@/features/deals/components/add-participant-form";
import { CreateDealForm } from "@/features/deals/components/create-deal-form";
import { CreateMilestoneForm } from "@/features/deals/components/create-milestone-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  canAccessProjectWorkspace,
  listActivityForProject,
  listDealsForProject,
  listMilestonesForProject,
  listParticipantsForProject,
} from "@/lib/deals/queries";
import { listDocumentsForTarget } from "@/lib/documents/queries";
import { getProjectById } from "@/lib/projects/queries";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type WorkspacePageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Кабинет проекта",
};

export const dynamic = "force-dynamic";

export default async function ProjectWorkspacePage({
  params,
}: WorkspacePageProps) {
  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=/dashboard/projects/${params.id}/workspace`);

  const project = await getProjectById(params.id);
  if (!project) notFound();

  const allowed = await canAccessProjectWorkspace(
    project.id,
    current.user.id,
  );
  if (!allowed) {
    redirect("/dashboard/projects");
  }

  const isOwner = project.ownerId === current.user.id;

  const [deals, participants, milestones, activity, documents] =
    await Promise.all([
      listDealsForProject(project.id),
      listParticipantsForProject(project.id),
      listMilestonesForProject(project.id),
      listActivityForProject(project.id),
      listDocumentsForTarget("project", project.id),
    ]);

  // Unique participants by userId for display
  const uniqueParticipants = Array.from(
    new Map(participants.map((item) => [item.userId, item])).values(),
  );

  // Include owner in participants view
  const ownerListed = uniqueParticipants.some(
    (item) => item.userId === project.ownerId,
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Сопровождение ЦКР"
          title={project.title}
          description="Кабинет проекта: участники, сделки, этапы, документы и история. Внутренняя информация доступна только участникам."
        />
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/lia?project=${project.id}`} variant="outline">
            Помоги реализовать проект
          </ButtonLink>
          {isOwner ? (
            <ButtonLink
              href={`/dashboard/projects/${project.id}/edit`}
              variant="outline"
            >
              Редактировать
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/project/${project.id}`} variant="outline">
            Публичная карточка
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">
          {projectStatusLabels[project.status]}
        </Badge>
        <Badge variant="soft">
          {projectStageLabels[project.stage]}
        </Badge>
        <Badge variant="soft">{project.region}</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Участники</h2>
          <ul className="space-y-2 text-sm">
            {!ownerListed ? (
              <li className="rounded-sm border border-border px-3 py-2">
                <span className="text-foreground">
                  {project.ownerName || "Владелец проекта"}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {dealParticipantRoleLabels.owner}
                </span>
              </li>
            ) : null}
            {uniqueParticipants.map((item) => (
              <li
                key={item.id}
                className="rounded-sm border border-border px-3 py-2"
              >
                <span className="text-foreground">
                  {item.fullName || item.userId.slice(0, 8)}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {dealParticipantRoleLabels[item.role]}
                </span>
              </li>
            ))}
          </ul>
          {isOwner ? (
            <AddParticipantForm projectId={project.id} deals={deals} />
          ) : null}
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Сделки</h2>
          {deals.length > 0 ? (
            <div className="space-y-3">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  canManage={isOwner || deal.initiatorId === current.user.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Сделок пока нет.</p>
          )}
          {isOwner ? <CreateDealForm projectId={project.id} /> : null}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Задачи / этапы</h2>
          <MilestoneList
            milestones={milestones}
            projectId={project.id}
            canManage={isOwner}
          />
          {isOwner ? (
            <CreateMilestoneForm
              projectId={project.id}
              showSeed={milestones.length === 0}
            />
          ) : null}
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Документы</h2>
          <p className="text-sm text-muted">
            Документы, связанные с проектом. Загрузка — в разделе «Документы».
          </p>
          <DocumentList
            documents={documents}
            showRelated={false}
            canDelete={false}
            emptyText="Документов по проекту пока нет."
          />
          <ButtonLink href="/dashboard/documents" variant="outline">
            К документам
          </ButtonLink>
        </Card>
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">История</h2>
        <ActivityTimeline items={activity} />
      </Card>
    </div>
  );
}
