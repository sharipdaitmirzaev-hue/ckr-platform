import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import {
  listOrganizationApplications,
  listOrganizationMembers,
} from "@/lib/partners/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Заявки организации",
};

export const dynamic = "force-dynamic";

export default async function PartnerApplicationsPage() {
  const session = await requirePartnerMembership();
  const members = await listOrganizationMembers(
    session.primary.organization.id,
  );
  const { incoming, outgoing } = await listOrganizationApplications(
    session.primary.organization.id,
    members.map((member) => member.userId),
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Организация"
        title="Заявки"
        description="Входящие на сущности организации и исходящие от сотрудников."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">Входящие</h2>
          {incoming.length === 0 ? (
            <EmptyState
              title="Входящих нет"
              description="Заявки на проекты и предложения организации появятся здесь."
            />
          ) : (
            incoming.map((item) => (
              <Card key={item.id} variant="surface" className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{item.target_type}</Badge>
                  <Badge variant="soft">{item.status}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {item.message?.slice(0, 160) || "Без сообщения"}
                </p>
              </Card>
            ))
          )}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground">Исходящие</h2>
          {outgoing.length === 0 ? (
            <EmptyState
              title="Исходящих нет"
              description="Заявки сотрудников организации на объекты экосистемы."
            />
          ) : (
            outgoing.map((item) => (
              <Card key={item.id} variant="surface" className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{item.target_type}</Badge>
                  <Badge variant="soft">{item.status}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {item.message?.slice(0, 160) || "Без сообщения"}
                </p>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
