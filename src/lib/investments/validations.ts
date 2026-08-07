import {
  INVESTMENT_CURRENCIES,
  INVESTMENT_OFFER_STATUSES,
  INVESTMENT_TYPES,
} from "@/config/investments";
import { z } from "zod";

export const investmentOfferFormSchema = z
  .object({
    title: z.string().trim().min(3, "Название не короче 3 символов").max(160),
    description: z
      .string()
      .trim()
      .min(40, "Описание не короче 40 символов")
      .max(12000),
    amountMin: z.coerce.number().min(0, "Минимальная сумма некорректна"),
    amountMax: z.coerce.number().min(0, "Максимальная сумма некорректна"),
    currency: z.enum(INVESTMENT_CURRENCIES, { error: "Выберите валюту" }),
    regions: z.array(z.string().trim().min(1)).min(1, "Укажите хотя бы один регион"),
    categories: z
      .array(z.string().trim().min(1))
      .min(1, "Выберите хотя бы одно направление"),
    investmentType: z.enum(INVESTMENT_TYPES, {
      error: "Выберите тип участия",
    }),
    status: z.enum(INVESTMENT_OFFER_STATUSES, { error: "Выберите статус" }),
  })
  .refine((data) => data.amountMax >= data.amountMin, {
    message: "Максимальная сумма не может быть меньше минимальной",
    path: ["amountMax"],
  });

export type InvestmentOfferFormInput = z.infer<
  typeof investmentOfferFormSchema
>;
