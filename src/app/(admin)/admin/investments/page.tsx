import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminTable } from "@/components/admin/admin-table";
import {
  StatusBadge,
  publishStatusTone,
  verificationStatusTone,
} from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  INVESTMENT_OFFER_STATUSES,
  investmentStatusLabels,
  investmentTypeLabels,
} from "@/config/investments";
import {
  VERIFICATION_STATUSES,
  verificationStatusLabels,
} from "@/config/verification";
import { adminUpdateInvestmentModerationAction } from "@/features/admin/actions";
import { ModerationForm } from "@/features/admin/components/moderation-form";
import { listAdminInvestments } from "@/lib/admin/queries";
import type {
  InvestmentOfferStatus,
  InvestmentType,
  VerificationStatus,
} from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Инвестиции" };

type InvestmentsPageProps = {
  searchParams?: { status?: string; verification?: string };
};

function formatAmount(min: number, max: number, currency: string) {
  const symbol = currency === "RUB" ? "₽" : currency;
  const a = new Intl.NumberFormat("ru-RU").format(min);
  const b = new Intl.NumberFormat("ru-RU").format(max);
  return min === max ? `${a} ${symbol}` : `${a} – ${b} ${symbol}`;
}

export default async function AdminInvestmentsPage({
  searchParams,
}: InvestmentsPageProps) {
  const status = INVESTMENT_OFFER_STATUSES.includes(
    searchParams?.status as InvestmentOfferStatus,
  )
    ? (searchParams?.status as InvestmentOfferStatus)
    : null;
  const verificationStatus = VERIFICATION_STATUSES.includes(
    searchParams?.verification as VerificationStatus,
  )
    ? (searchParams?.verification as VerificationStatus)
    : null;

  const investments = await listAdminInvestments({
    status,
    verificationStatus,
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Инвестиции"
        description="Просмотр инвестиционных предложений и модерация публикации."
      />

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Статус</p>
        <AdminFilterBar
          basePath="/admin/investments"
          param="status"
          current={status}
          allLabel="Все"
          preserve={{ verification: verificationStatus }}
          options={INVESTMENT_OFFER_STATUSES.map((item) => ({
            value: item,
            label: investmentStatusLabels[item],
          }))}
        />
        <p className="pt-2 text-xs uppercase tracking-[0.16em] text-muted">
          Проверка
        </p>
        <AdminFilterBar
          basePath="/admin/investments"
          param="verification"
          current={verificationStatus}
          allLabel="Все"
          preserve={{ status }}
          options={VERIFICATION_STATUSES.map((item) => ({
            value: item,
            label: verificationStatusLabels[item],
          }))}
        />
      </div>

      <AdminTable
        rows={investments}
        rowKey={(row) => row.id}
        emptyText="Инвестиционные предложения не найдены."
        columns={[
          {
            key: "title",
            header: "Предложение",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted">
                  {investmentTypeLabels[row.investmentType as InvestmentType] ??
                    row.investmentType}{" "}
                  · {row.ownerName || "Инвестор"} ·{" "}
                  {formatAmount(row.amountMin, row.amountMax, row.currency)}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Статус",
            cell: (row) => (
              <StatusBadge
                label={investmentStatusLabels[row.status]}
                tone={publishStatusTone(row.status)}
              />
            ),
          },
          {
            key: "verification",
            header: "Проверка",
            cell: (row) => (
              <StatusBadge
                label={verificationStatusLabels[row.verificationStatus]}
                tone={verificationStatusTone(row.verificationStatus)}
              />
            ),
          },
          {
            key: "moderate",
            header: "Модерация",
            cell: (row) => (
              <ModerationForm
                action={adminUpdateInvestmentModerationAction}
                id={row.id}
                status={row.status}
                verificationStatus={row.verificationStatus}
                statusOptions={INVESTMENT_OFFER_STATUSES.map((item) => ({
                  value: item,
                  label: investmentStatusLabels[item],
                }))}
              />
            ),
          },
          {
            key: "link",
            header: "",
            cell: (row) => (
              <ButtonLink
                href={`/investment/${row.id}`}
                size="sm"
                variant="outline"
              >
                Сайт
              </ButtonLink>
            ),
          },
        ]}
      />
    </div>
  );
}
