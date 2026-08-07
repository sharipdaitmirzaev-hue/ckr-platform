/**
 * Реквизиты и контакты ЦКР.
 * Не придумывать значения: заполняются через env / этот файл владельцем.
 * Пустые поля не отображаются в UI.
 */

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export type CompanyDetails = {
  legalName: string;
  displayName: string;
  inn: string;
  ogrn: string;
  ogrnip: string;
  address: string;
  email: string;
  phone: string;
  telegram: string;
  workingHours: string;
};

/** Централизованные реквизиты. Источник: env (предпочтительно) или пустые строки. */
export const companyDetails: CompanyDetails = {
  legalName: env("NEXT_PUBLIC_COMPANY_LEGAL_NAME"),
  displayName: env("NEXT_PUBLIC_COMPANY_DISPLAY_NAME") || "ЦКР",
  inn: env("NEXT_PUBLIC_COMPANY_INN"),
  ogrn: env("NEXT_PUBLIC_COMPANY_OGRN"),
  ogrnip: env("NEXT_PUBLIC_COMPANY_OGRNIP"),
  address: env("NEXT_PUBLIC_COMPANY_ADDRESS"),
  email: env("NEXT_PUBLIC_COMPANY_EMAIL"),
  phone: env("NEXT_PUBLIC_COMPANY_PHONE"),
  telegram: env("NEXT_PUBLIC_COMPANY_TELEGRAM"),
  workingHours: env("NEXT_PUBLIC_COMPANY_WORKING_HOURS"),
};

export function hasValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim());
}

/** Поля реквизитов для блока «О компании» — без пустых строк. */
export function getFilledCompanyFields(): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (hasValue(companyDetails.legalName)) {
    rows.push({ label: "Юридическое название", value: companyDetails.legalName });
  }
  if (hasValue(companyDetails.inn)) {
    rows.push({ label: "ИНН", value: companyDetails.inn });
  }
  if (hasValue(companyDetails.ogrn)) {
    rows.push({ label: "ОГРН", value: companyDetails.ogrn });
  }
  if (hasValue(companyDetails.ogrnip)) {
    rows.push({ label: "ОГРНИП", value: companyDetails.ogrnip });
  }
  if (hasValue(companyDetails.address)) {
    rows.push({ label: "Адрес", value: companyDetails.address });
  }
  if (hasValue(companyDetails.email)) {
    rows.push({ label: "Email", value: companyDetails.email });
  }
  if (hasValue(companyDetails.phone)) {
    rows.push({ label: "Телефон", value: companyDetails.phone });
  }
  if (hasValue(companyDetails.telegram)) {
    rows.push({ label: "Telegram", value: companyDetails.telegram });
  }
  if (hasValue(companyDetails.workingHours)) {
    rows.push({ label: "Часы работы", value: companyDetails.workingHours });
  }
  return rows;
}

export function companyMailtoHref(): string | null {
  return hasValue(companyDetails.email)
    ? `mailto:${companyDetails.email}`
    : null;
}

export function companyTelegramHref(): string | null {
  if (!hasValue(companyDetails.telegram)) return null;
  const handle = companyDetails.telegram.replace(/^@/, "");
  if (handle.startsWith("http")) return handle;
  return `https://t.me/${handle}`;
}

export function companyPhoneHref(): string | null {
  if (!hasValue(companyDetails.phone)) return null;
  const digits = companyDetails.phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}
