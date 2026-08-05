import { ASSIGNABLE_ROLES } from "@/config/roles";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Укажите корректный email"),
  password: z.string().min(8, "Пароль не менее 8 символов"),
  fullName: z.string().trim().min(2, "Укажите имя"),
  role: z.enum(ASSIGNABLE_ROLES, {
    error: "Выберите роль",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Укажите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите имя"),
  companyName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  roles: z
    .array(z.enum(ASSIGNABLE_ROLES))
    .min(1, "Выберите хотя бы одну роль"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
