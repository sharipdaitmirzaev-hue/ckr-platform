"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITIES,
  documentRelatedTypeLabels,
  documentTypeLabels,
  documentVisibilityLabels,
} from "@/config/verification";
import {
  uploadDocumentAction,
  type DocumentActionState,
} from "@/features/documents/actions";
import type { DocumentRelatedType } from "@/types";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState: DocumentActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Загрузка..." : "Загрузить документ"}
    </Button>
  );
}

export type UploadTargetOption = {
  relatedType: DocumentRelatedType;
  relatedId: string;
  label: string;
};

type UploadDocumentFormProps = {
  targets: UploadTargetOption[];
  defaultTargetId?: string;
};

export function UploadDocumentForm({
  targets,
  defaultTargetId,
}: UploadDocumentFormProps) {
  const [state, formAction] = useFormState(uploadDocumentAction, initialState);
  const initial =
    targets.find((item) => item.relatedId === defaultTargetId) ?? targets[0];
  const [selectedKey, setSelectedKey] = useState(
    initial
      ? `${initial.relatedType}:${initial.relatedId}`
      : "",
  );

  if (targets.length === 0 || !initial) {
    return (
      <p className="text-sm text-muted">
        Нет объектов для привязки документа. Создайте проект, возможность или
        профиль эксперта.
      </p>
    );
  }

  const [relatedType, relatedId] = selectedKey.split(":") as [
    DocumentRelatedType,
    string,
  ];

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent"
        >
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="target" className="text-sm text-muted">
          Объект
        </label>
        <select
          id="target"
          required
          value={selectedKey}
          onChange={(event) => setSelectedKey(event.target.value)}
          className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
        >
          {targets.map((target) => (
            <option
              key={`${target.relatedType}:${target.relatedId}`}
              value={`${target.relatedType}:${target.relatedId}`}
            >
              {documentRelatedTypeLabels[target.relatedType]} — {target.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="relatedType" value={relatedType} />
        <input type="hidden" name="relatedId" value={relatedId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="documentType" className="text-sm text-muted">
            Тип документа
          </label>
          <select
            id="documentType"
            name="documentType"
            required
            defaultValue="other"
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {documentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="visibility" className="text-sm text-muted">
            Видимость
          </label>
          <select
            id="visibility"
            name="visibility"
            required
            defaultValue="review"
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {DOCUMENT_VISIBILITIES.map((item) => (
              <option key={item} value={item}>
                {documentVisibilityLabels[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-muted">
          Название
        </label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Устав компании / презентация проекта"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="file" className="text-sm text-muted">
          Файл
        </label>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
        />
        <p className="text-xs text-muted">PDF, Office или изображение. До 20 МБ.</p>
      </div>

      <SubmitButton />
    </form>
  );
}
