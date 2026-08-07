"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
};

/**
 * Кнопка submit с подтверждением (без отдельного modal-слоя).
 * Для деструктивных и необратимых действий форм.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
