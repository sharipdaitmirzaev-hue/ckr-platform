"use client";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.2 12S5.5 5.5 12 5.5 21.8 12 21.8 12 18.5 18.5 12 18.5 2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3.25 3.25 0 0 0 4.6 4.6" />
      <path d="M9.4 5.7A9.7 9.7 0 0 1 12 5.5C18.5 5.5 21.8 12 21.8 12a17.4 17.4 0 0 1-3.2 3.9" />
      <path d="M6.1 6.3A17.6 17.6 0 0 0 2.2 12S5.5 18.5 12 18.5c1.4 0 2.7-.3 3.8-.7" />
    </svg>
  );
}

export type PasswordInputProps = Omit<InputProps, "type">;

/** Поле пароля с кнопкой «показать / скрыть». */
export function PasswordInput({
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        className={cn(
          "absolute inset-y-0 right-0 flex w-11 items-center justify-center",
          "text-muted transition-colors hover:text-foreground",
          "focus-visible:outline-none focus-visible:text-foreground",
        )}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? (
          <EyeOffIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
