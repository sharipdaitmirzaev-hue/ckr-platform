import {
  OPPORTUNITY_CURRENCIES,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
} from "@/config/opportunities";
import { z } from "zod";

export const opportunityFormSchema = z.object({
  title: z.string().trim().min(3, "Название не короче 3 символов").max(160),
  description: z
    .string()
    .trim()
    .min(40, "Описание не короче 40 символов")
    .max(12000),
  type: z.enum(OPPORTUNITY_TYPES, { error: "Выберите тип возможности" }),
  region: z.string().trim().min(2, "Укажите регион"),
  city: z.string().trim().min(2, "Укажите город"),
  price: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
  }, z.coerce.number().min(0, "Цена не может быть отрицательной").nullable()),
  currency: z.enum(OPPORTUNITY_CURRENCIES, { error: "Выберите валюту" }),
  status: z.enum(OPPORTUNITY_STATUSES, { error: "Выберите статус" }),
});

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;
