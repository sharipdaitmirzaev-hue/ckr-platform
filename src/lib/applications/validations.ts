import { APPLICATION_TARGET_TYPES } from "@/config/applications";
import { z } from "zod";

export const createApplicationSchema = z.object({
  targetType: z.enum(APPLICATION_TARGET_TYPES, {
    error: "Укажите тип объекта",
  }),
  targetId: z.string().uuid("Некорректный идентификатор объекта"),
  message: z
    .string()
    .trim()
    .min(20, "Сообщение не короче 20 символов")
    .max(4000, "Сообщение слишком длинное"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
