import type { CrmContactType } from "@/config/crm";

export const CRM_SEGMENT_TEMPLATE_IDS = [
  "customers",
  "suppliers",
  "partners",
] as const;

export type CrmSegmentTemplateId = (typeof CRM_SEGMENT_TEMPLATE_IDS)[number];

export type CrmSegmentTemplate = {
  id: CrmSegmentTemplateId;
  label: string;
  description: string;
  contactType: CrmContactType;
  name: string;
  companyName: string;
  notes: string;
  source: string;
};

/**
 * Шаблоны сегментов CRM по итогам пилота ТИНДА.
 * Не новые модули — готовые заготовки контактов.
 */
export const CRM_SEGMENT_TEMPLATES: CrmSegmentTemplate[] = [
  {
    id: "customers",
    label: "Клиенты",
    description: "Сегмент покупателей / заказчиков для воронки продаж.",
    contactType: "company",
    name: "Сегмент: клиенты",
    companyName: "Клиенты",
    notes:
      "Шаблон CRM «customers». Заполните ключевые аккаунты и SMB-клиентов. Без реальных ПДн в шаблоне.",
    source: "crm-template-customers",
  },
  {
    id: "suppliers",
    label: "Поставщики",
    description: "Сегмент поставщиков товаров, услуг и логистики.",
    contactType: "company",
    name: "Сегмент: поставщики",
    companyName: "Поставщики",
    notes:
      "Шаблон CRM «suppliers». Производители, дистрибьюторы, логистика.",
    source: "crm-template-suppliers",
  },
  {
    id: "partners",
    label: "Партнёры",
    description: "Стратегические, финансовые и экспертные партнёры.",
    contactType: "partner",
    name: "Сегмент: партнёры",
    companyName: "Партнёры",
    notes:
      "Шаблон CRM «partners». Совместные продажи, капитал, экспертиза.",
    source: "crm-template-partners",
  },
];

export function getCrmSegmentTemplate(
  id: string,
): CrmSegmentTemplate | null {
  return CRM_SEGMENT_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function isCrmSegmentTemplateId(
  value: string,
): value is CrmSegmentTemplateId {
  return (CRM_SEGMENT_TEMPLATE_IDS as readonly string[]).includes(value);
}
