/**
 * Публичная правовая идентичность ЦКР.
 * ЦКР — проект/бренд; оператор — ИП (не отдельное юрлицо).
 *
 * Не заполняйте ИНН/ОГРНИП/адрес/телефон без подтверждённых значений.
 * Пустые поля не выводятся на сайт.
 */
import { siteConfig } from "@/config/site";

export const legalConfig = {
  projectShortName: "ЦКР",
  projectFullName: "Центр комплексных решений",
  /** Как называть ЦКР в правовых формулировках */
  projectKindLabel: "проект/бренд",

  founderFullName: "Дайитмирзаев Шарип Абдурахманович",
  founderStatement: "Основатель ЦКР — Дайитмирзаев Шарип Абдурахманович",

  operator: {
    type: "individual_entrepreneur" as const,
    /** Кратко для footer и документов */
    shortLabel: "ИП Дайитмирзаев Шарип Абдурахманович",
    /** Полное ФИО ИП */
    fullName: "Дайитмирзаев Шарип Абдурахманович",
    /** TODO: предоставить поставщиком реквизитов — не выдумывать */
    inn: null as string | null,
    /** TODO: предоставить поставщиком реквизитов — не выдумывать */
    ogrnip: null as string | null,
    /** TODO: публичный адрес (если нужен на сайте) */
    address: null as string | null,
    /** Публичный email из siteConfig */
    email: siteConfig.supportEmail,
    /** TODO: публичный телефон (если нужен на сайте) */
    phone: null as string | null,
    /** Банковские реквизиты на сайт не выводим, пока нет явной публичной необходимости */
    bankDetailsPublished: false,
  },

  /** Спокойные формулировки для UI */
  copy: {
    activityLine:
      "Деятельность осуществляется ИП Дайитмирзаевым Шарипом Абдурахмановичем.",
    projectDefinition:
      "«ЦКР» / «Центр комплексных решений» — название проекта (бренда). Отдельного юридического лица с таким наименованием на текущем этапе нет.",
    requisitesIntro:
      "ЦКР (Центр комплексных решений) — проект/бренд, используемый в предпринимательской деятельности индивидуального предпринимателя Дайитмирзаева Шарипа Абдурахмановича.",
    homeSupport:
      "Платформа для поиска, развития и объединения бизнес-возможностей.",
  },
} as const;

export type LegalPublicField = {
  label: string;
  value: string;
};

/** Только подтверждённые публичные поля для таблицы реквизитов. */
export function getPublishedLegalFields(): LegalPublicField[] {
  const o = legalConfig.operator;
  const fields: LegalPublicField[] = [
    {
      label: "Индивидуальный предприниматель",
      value: o.fullName,
    },
  ];
  if (o.inn) fields.push({ label: "ИНН", value: o.inn });
  if (o.ogrnip) fields.push({ label: "ОГРНИП", value: o.ogrnip });
  if (o.address) fields.push({ label: "Адрес", value: o.address });
  if (o.email) fields.push({ label: "Email", value: o.email });
  if (o.phone) fields.push({ label: "Телефон", value: o.phone });
  return fields;
}

/** Поля, которых ещё нет в проекте (для внутреннего отчёта / TODO). */
export const legalMissingPublicFields = [
  "ИНН",
  "ОГРНИП",
  "публичный адрес",
  "публичный телефон",
] as const;
