import { EXPERT_SPECIALIZATIONS, EXPERT_STATUSES } from "@/config/experts";
import { z } from "zod";

export const expertProfileFormSchema = z.object({
  specialization: z.enum(EXPERT_SPECIALIZATIONS, {
    error: "Выберите специализацию",
  }),
  headline: z.string().trim().min(5, "Заголовок не короче 5 символов").max(160),
  description: z
    .string()
    .trim()
    .min(40, "Описание не короче 40 символов")
    .max(12000),
  experienceYears: z.coerce
    .number()
    .int("Укажите целое число лет")
    .min(0)
    .max(70),
  services: z.string().trim().min(10, "Опишите услуги").max(4000),
  region: z.string().trim().min(2, "Укажите регион"),
  status: z.enum(EXPERT_STATUSES, { error: "Выберите статус" }),
});

export type ExpertProfileFormInput = z.infer<typeof expertProfileFormSchema>;
