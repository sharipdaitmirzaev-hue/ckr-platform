import { CURRENCIES, PROJECT_STAGES } from "@/config/projects";
import { z } from "zod";

/** Форма контента проекта. Жизненный цикл меняется отдельным action. */
export const projectFormSchema = z.object({
  title: z.string().trim().min(3, "Название не короче 3 символов").max(160),
  summary: z
    .string()
    .trim()
    .min(20, "Краткое описание не короче 20 символов")
    .max(400),
  description: z
    .string()
    .trim()
    .min(40, "Полное описание не короче 40 символов")
    .max(12000),
  category: z.string().trim().min(1, "Выберите категорию"),
  region: z.string().trim().min(2, "Укажите регион"),
  investmentRequired: z.coerce
    .number({ error: "Укажите сумму инвестиций" })
    .min(0, "Сумма не может быть отрицательной")
    .max(1_000_000_000_000, "Слишком большая сумма"),
  currency: z.enum(CURRENCIES, { error: "Выберите валюту" }),
  stage: z.enum(PROJECT_STAGES, { error: "Выберите стадию" }),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
