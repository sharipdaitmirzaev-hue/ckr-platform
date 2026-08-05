"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { ApplicationForm } from "@/features/applications/components/application-form";
import type { ApplicationTargetType } from "@/types";
import { useState } from "react";

type ApplicationButtonProps = {
  targetType: ApplicationTargetType;
  targetId: string;
  label: string;
  isAuthenticated: boolean;
  isOwner: boolean;
};

export function ApplicationButton({
  targetType,
  targetId,
  label,
  isAuthenticated,
  isOwner,
}: ApplicationButtonProps) {
  const [open, setOpen] = useState(false);

  if (isOwner) {
    return null;
  }

  const nextPath =
    targetType === "project"
      ? `/project/${targetId}`
      : `/opportunity/${targetId}`;

  if (!isAuthenticated) {
    return (
      <ButtonLink
        href={`/login?next=${encodeURIComponent(nextPath)}`}
        variant="primary"
      >
        {label}
      </ButtonLink>
    );
  }

  return (
    <div className="w-full max-w-xl">
      {!open ? (
        <Button type="button" onClick={() => setOpen(true)}>
          {label}
        </Button>
      ) : (
        <Card variant="surface" className="p-5">
          <p className="font-display text-lg text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted">
            Заявка будет направлена владельцу через платформу ЦКР.
          </p>
          <ApplicationForm
            targetType={targetType}
            targetId={targetId}
            onCancel={() => setOpen(false)}
          />
        </Card>
      )}
    </div>
  );
}
