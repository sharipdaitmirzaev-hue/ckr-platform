import { DocumentList } from "@/components/documents/document-list";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  documentRelatedTypeLabels,
  verificationRequestStatusLabels,
} from "@/config/verification";
import { UploadDocumentForm } from "@/features/documents/components/upload-document-form";
import { RequestVerificationForm } from "@/features/verification/components/request-verification-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listMyDocuments } from "@/lib/documents/queries";
import { getMyExpertProfile } from "@/lib/experts/queries";
import { listMyInvestmentOffers } from "@/lib/investments/queries";
import { listMyOpportunities } from "@/lib/opportunities/queries";
import { listMyProjects } from "@/lib/projects/queries";
import {
  listMyVerificationRequests,
} from "@/lib/verification/queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Документы" };

export default async function DashboardDocumentsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [documents, projects, opportunities, investments, expert, requests] =
    await Promise.all([
      listMyDocuments(current.user.id),
      listMyProjects(current.user.id),
      listMyOpportunities(current.user.id),
      listMyInvestmentOffers(current.user.id),
      getMyExpertProfile(current.user.id),
      listMyVerificationRequests(current.user.id),
    ]);

  const targets = [
    {
      relatedType: "profile" as const,
      relatedId: current.user.id,
      label: current.user.fullName || current.user.email,
    },
    ...projects.map((project) => ({
      relatedType: "project" as const,
      relatedId: project.id,
      label: project.title,
    })),
    ...opportunities.map((opportunity) => ({
      relatedType: "opportunity" as const,
      relatedId: opportunity.id,
      label: opportunity.title,
    })),
    ...investments.map((offer) => ({
      relatedType: "investment" as const,
      relatedId: offer.id,
      label: offer.title,
    })),
    ...(expert
      ? [
          {
            relatedType: "expert" as const,
            relatedId: expert.id,
            label: expert.headline || "Профиль эксперта",
          },
        ]
      : []),
  ];

  const verificationTargets = [
    {
      type: "profile" as const,
      id: current.user.id,
      label: "Профиль участника",
      status: current.user.verificationStatus ?? "unverified",
    },
    ...projects.map((project) => ({
      type: "project" as const,
      id: project.id,
      label: project.title,
      status: project.verificationStatus ?? "unverified",
    })),
    ...opportunities.map((opportunity) => ({
      type: "opportunity" as const,
      id: opportunity.id,
      label: opportunity.title,
      status: opportunity.verificationStatus ?? "unverified",
    })),
    ...investments.map((offer) => ({
      type: "investment" as const,
      id: offer.id,
      label: offer.title,
      status: offer.verificationStatus ?? "unverified",
    })),
    ...(expert
      ? [
          {
            type: "expert" as const,
            id: expert.id,
            label: expert.headline || "Профиль эксперта",
            status: expert.verificationStatus ?? "unverified",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Доверие"
        title="Документы и проверка"
        description="Загружайте подтверждающие материалы и запрашивайте проверку ЦКР для профиля, проектов, возможностей, инвестиций и экспертов."
      />

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Статусы проверки</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {verificationTargets.map((target) => {
            const pending = requests.some(
              (request) =>
                request.targetType === target.type &&
                request.targetId === target.id &&
                request.status === "pending",
            );

            return (
              <Card key={`${target.type}:${target.id}`} variant="surface" className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {documentRelatedTypeLabels[target.type]}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{target.label}</p>
                  </div>
                  <VerificationBadge status={target.status} />
                </div>
                {target.status === "verified" ? (
                  <p className="text-xs text-muted">Объект проверен ЦКР.</p>
                ) : pending ? (
                  <p className="text-xs text-muted">Заявка уже на рассмотрении.</p>
                ) : (
                  <RequestVerificationForm
                    targetType={target.type}
                    targetId={target.id}
                  />
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Загрузить документ</h2>
        <Card variant="surface" className="p-5 sm:p-6">
          <UploadDocumentForm targets={targets} />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Мои документы</h2>
        <DocumentList documents={documents} canDelete />
      </section>

      {requests.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">
            Мои заявки на проверку
          </h2>
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Card variant="surface" className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-foreground">
                      {documentRelatedTypeLabels[request.targetType]}
                      {request.targetTitle ? ` — ${request.targetTitle}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleString("ru-RU")
                        : null}
                    </p>
                  </div>
                  <p className="text-sm text-accent">
                    {verificationRequestStatusLabels[request.status]}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
