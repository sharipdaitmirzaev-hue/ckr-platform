import { DocumentList } from "@/components/documents/document-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  VERIFICATION_REQUEST_STATUSES,
  documentRelatedTypeLabels,
  verificationRequestStatusLabels,
} from "@/config/verification";
import { adminDecideVerificationAction } from "@/features/verification/actions";
import { listDocumentsForTarget } from "@/lib/documents/queries";
import { listVerificationRequestsForAdmin } from "@/lib/verification/queries";
import type { VerificationRequestStatus } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Проверки — Админ" };

export const dynamic = "force-dynamic";

type AdminVerificationsPageProps = {
  searchParams?: { status?: string };
};

export default async function AdminVerificationsPage({
  searchParams,
}: AdminVerificationsPageProps) {
  const status = VERIFICATION_REQUEST_STATUSES.includes(
    searchParams?.status as VerificationRequestStatus,
  )
    ? (searchParams?.status as VerificationRequestStatus)
    : "pending";

  const requests = await listVerificationRequestsForAdmin({ status });

  const withDocuments = await Promise.all(
    requests.map(async (request) => ({
      request,
      documents: await listDocumentsForTarget(
        request.targetType,
        request.targetId,
      ),
    })),
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Заявки на проверку"
        description="Просматривайте документы участников и подтверждайте или отклоняйте проверку ЦКР."
      />

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        {VERIFICATION_REQUEST_STATUSES.map((item) => (
          <Link
            key={item}
            href={`/admin/verifications?status=${item}`}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-sm transition-colors",
              status === item
                ? "border-accent/50 bg-accent-muted text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {verificationRequestStatusLabels[item]}
          </Link>
        ))}
      </div>

      {withDocuments.length === 0 ? (
        <p className="text-sm text-muted">Заявок в этом статусе нет.</p>
      ) : (
        <ul className="space-y-6">
          {withDocuments.map(({ request, documents }) => (
            <li key={request.id}>
              <Card variant="surface" className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="accent">
                        {documentRelatedTypeLabels[request.targetType]}
                      </Badge>
                      <Badge variant="soft">
                        {verificationRequestStatusLabels[request.status]}
                      </Badge>
                    </div>
                    <h2 className="mt-3 font-display text-xl text-foreground">
                      {request.targetTitle || request.targetId}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Заявитель: {request.userName || "Участник ЦКР"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Документы
                  </h3>
                  <div className="mt-3">
                    <DocumentList
                      documents={documents}
                      showRelated={false}
                      emptyText="Документов к заявке нет."
                    />
                  </div>
                </div>

                {request.status === "pending" ? (
                  <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
                    <form
                      action={adminDecideVerificationAction}
                      className="space-y-3"
                    >
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <label className="block text-sm text-muted">
                        Комментарий (необязательно)
                        <textarea
                          name="adminComment"
                          rows={3}
                          className="mt-2 flex w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground"
                        />
                      </label>
                      <Button type="submit">Подтвердить</Button>
                    </form>

                    <form
                      action={adminDecideVerificationAction}
                      className="space-y-3"
                    >
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <label className="block text-sm text-muted">
                        Причина отказа
                        <textarea
                          name="adminComment"
                          rows={3}
                          required
                          className="mt-2 flex w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground"
                        />
                      </label>
                      <Button type="submit" variant="outline">
                        Отклонить
                      </Button>
                    </form>
                  </div>
                ) : request.adminComment ? (
                  <p className="border-t border-border pt-4 text-sm text-muted">
                    Комментарий: {request.adminComment}
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
