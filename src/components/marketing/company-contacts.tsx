import {
  companyDetails,
  companyMailtoHref,
  companyPhoneHref,
  companyTelegramHref,
  getFilledCompanyFields,
  hasValue,
} from "@/config/company-details";

/** Контакты/реквизиты — только заполненные поля. */
export function CompanyContacts({
  showLegal = false,
}: {
  showLegal?: boolean;
}) {
  const fields = showLegal
    ? getFilledCompanyFields()
    : getFilledCompanyFields().filter((row) =>
        ["Email", "Телефон", "Telegram", "Адрес", "Часы работы"].includes(
          row.label,
        ),
      );

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted">
        Контактные данные ЦКР будут опубликованы после заполнения реквизитов
        владельцем платформы. Пока напишите через форму на этой странице.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm text-muted">
      {fields.map((row) => {
        let href: string | null = null;
        if (row.label === "Email") href = companyMailtoHref();
        if (row.label === "Телефон") href = companyPhoneHref();
        if (row.label === "Telegram") href = companyTelegramHref();

        return (
          <li key={row.label}>
            <span className="text-foreground">{row.label}: </span>
            {href ? (
              <a href={href} className="text-accent hover:underline">
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </li>
        );
      })}
      {hasValue(companyDetails.displayName) && showLegal ? (
        <li>
          <span className="text-foreground">Бренд: </span>
          {companyDetails.displayName}
        </li>
      ) : null}
    </ul>
  );
}
