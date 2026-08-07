import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  canManageOrganization,
  organizationTypeLabels,
  organizationVerificationLabels,
  partnershipStatusLabels,
  partnershipTypeLabels,
} from "@/config/partners";
import { CreatePartnershipForm } from "@/features/partners/components/create-partnership-form";
import { OrganizationProfileForm } from "@/features/partners/components/organization-profile-form";
import { requirePartnerMembership } from "@/lib/auth/require-partner";
import { listPartnerships } from "@/lib/partners/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль организации",
};

export const dynamic = "force-dynamic";

export default async function PartnerProfilePage() {
  const session = await requirePartnerMembership();
  const org = session.primary.organization;
  const partnerships = await listPartnerships(org.id);
  const canManage = canManageOrganization(session.primary.role);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Организация"
        title="Профиль"
        description={`${organizationTypeLabels[org.type]} · ${
          organizationVerificationLabels[org.verificationStatus]
        }`}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={organizationVerificationLabels[org.verificationStatus]}
              tone={
                org.verificationStatus === "verified"
                  ? "success"
                  : org.verificationStatus === "pending"
                    ? "warning"
                    : "neutral"
              }
            />
          </div>
          <OrganizationProfileForm
            organization={org}
            canManage={canManage}
          />
        </Card>

        <div className="space-y-4">
          <Card variant="surface" className="space-y-4 p-5">
            <h2 className="font-display text-xl text-foreground">
              Партнёрства с ЦКР
            </h2>
            {canManage ? <CreatePartnershipForm /> : null}
          </Card>
          <ul className="space-y-3">
            {partnerships.map((item) => (
              <li key={item.id}>
                <Card variant="surface" className="space-y-1 p-4">
                  <p className="font-medium text-foreground">
                    {partnershipTypeLabels[item.type]}
                  </p>
                  <p className="text-sm text-muted">
                    {partnershipStatusLabels[item.status]}
                  </p>
                  {item.description ? (
                    <p className="text-sm text-muted">{item.description}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
