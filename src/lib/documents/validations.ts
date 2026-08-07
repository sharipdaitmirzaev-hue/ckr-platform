import {
  DOCUMENT_RELATED_TYPES,
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITIES,
} from "@/config/verification";
import { z } from "zod";

export const uploadDocumentSchema = z.object({
  name: z.string().trim().min(2, "Укажите название документа").max(200),
  documentType: z.enum(DOCUMENT_TYPES, { error: "Выберите тип документа" }),
  relatedType: z.enum(DOCUMENT_RELATED_TYPES, {
    error: "Выберите объект",
  }),
  relatedId: z.string().uuid("Некорректный идентификатор объекта"),
  visibility: z.enum(DOCUMENT_VISIBILITIES, {
    error: "Выберите видимость",
  }),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
