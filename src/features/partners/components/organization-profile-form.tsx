"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZATION_TYPES,
  organizationTypeLabels,
} from "@/config/partners";
import {
  updateOrganizationAction,
  type PartnerActionState,
} from "@/features/partners/actions";
import type { Organization } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: PartnerActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Сохранение…" : "Сохранить"}
    </Button>
  );
}

type OrganizationProfileFormProps = {
  organization: Organization;
  canManage: boolean;
};

export function OrganizationProfileForm({
  organization,
  canManage,
}: OrganizationProfileFormProps) {
  const [state, action] = useFormState(updateOrganizationAction, initialState);

  if (!canManage) {
    return (
      <p className="text-sm text-muted">
        Редактирование доступно владельцу и менеджеру организации.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm text-muted">
          Название
        </label>
        <Input
          id="profile-name"
          name="name"
          required
          defaultValue={organization.name}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-type" className="text-sm text-muted">
          Тип
        </label>
        <select
          id="profile-type"
          name="type"
          defaultValue={organization.type}
          className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm"
        >
          {ORGANIZATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {organizationTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="profile-region" className="text-sm text-muted">
            Регион
          </label>
          <Input
            id="profile-region"
            name="region"
            defaultValue={organization.region}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-city" className="text-sm text-muted">
            Город
          </label>
          <Input
            id="profile-city"
            name="city"
            defaultValue={organization.city}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-website" className="text-sm text-muted">
          Сайт
        </label>
        <Input
          id="profile-website"
          name="website"
          defaultValue={organization.website}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="profile-industry" className="text-sm text-muted">
            Отрасль
          </label>
          <Input
            id="profile-industry"
            name="industry"
            defaultValue={organization.industry || ""}
            placeholder="beverage / food / manufacturing"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-legal-name" className="text-sm text-muted">
            Юр. название
          </label>
          <Input
            id="profile-legal-name"
            name="legalName"
            defaultValue={organization.legalName || ""}
            placeholder="UNKNOWN если нет"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-inn" className="text-sm text-muted">
            ИНН
          </label>
          <Input
            id="profile-inn"
            name="inn"
            defaultValue={organization.inn || ""}
            placeholder="только подтверждённый"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-ogrn" className="text-sm text-muted">
            ОГРН
          </label>
          <Input
            id="profile-ogrn"
            name="ogrn"
            defaultValue={organization.ogrn || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-offers" className="text-sm text-muted">
          Что предлагает
        </label>
        <Input
          id="profile-offers"
          name="offersSummary"
          defaultValue={organization.offersSummary || ""}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-seeks" className="text-sm text-muted">
          Что ищет
        </label>
        <Input
          id="profile-seeks"
          name="seeksSummary"
          defaultValue={organization.seeksSummary || ""}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-products" className="text-sm text-muted">
          Продукты / услуги
        </label>
        <Input
          id="profile-products"
          name="productsServices"
          defaultValue={organization.productsServices || ""}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-description" className="text-sm text-muted">
          Описание
        </label>
        <textarea
          id="profile-description"
          name="description"
          rows={4}
          defaultValue={organization.description}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
      </div>
      {organization.verificationStatus !== "verified" ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="requestVerification"
            className="accent-[var(--ckr-accent)]"
          />
          Отправить на проверку ЦКР
        </label>
      ) : null}
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </form>
  );
}
