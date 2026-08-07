import { DOCUMENT_RELATED_TYPES } from "@/config/verification";
import { z } from "zod";

export const createVerificationRequestSchema = z.object({
  targetType: z.enum(DOCUMENT_RELATED_TYPES, {
    error: "Выберите объект проверки",
  }),
  targetId: z.string().uuid("Некорректный идентификатор"),
});

export const adminVerificationDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  adminComment: z.string().trim().max(2000).optional().or(z.literal("")),
});
