"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRM_SEGMENT_TEMPLATES } from "@/config/crm-templates";
import { applyCrmSegmentTemplateAction } from "@/features/crm/actions";
import { useTransition } from "react";

export function CrmSegmentTemplates() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-foreground">
          Шаблоны сегментов
        </h2>
        <p className="mt-1 text-sm text-muted">
          customers · suppliers · partners — заготовки по итогам пилота ТИНДА.
        </p>
      </div>
      <ul className="space-y-3">
        {CRM_SEGMENT_TEMPLATES.map((template) => (
          <li
            key={template.id}
            className="rounded-sm border border-border px-3 py-3"
          >
            <p className="text-sm font-medium text-foreground">
              {template.label}{" "}
              <span className="font-mono text-xs text-muted">
                ({template.id})
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">{template.description}</p>
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                startTransition(async () => {
                  await applyCrmSegmentTemplateAction(formData);
                  event.currentTarget.reset();
                });
              }}
            >
              <input type="hidden" name="templateId" value={template.id} />
              <Input
                name="organizationLabel"
                placeholder="Метка организации (опционально), напр. ООО ТИНДА"
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="confirm" value="on" required />
                Подтверждаю создание контакта-сегмента
              </label>
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                {pending ? "…" : `Применить «${template.label}»`}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
