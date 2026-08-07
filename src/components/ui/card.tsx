import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const variants = {
  /** Каталожная карточка: акцентная линия сверху */
  catalog: "border-t border-border bg-transparent pt-5",
  /** Поверхность с рамкой — решения, виджеты, формы */
  surface: "border border-border bg-surface/60 p-5",
} as const;

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: keyof typeof variants;
  as?: "article" | "div" | "section" | "aside";
};

export function Card({
  className,
  variant = "catalog",
  as: Tag = "article",
  ...props
}: CardProps) {
  return (
    <Tag className={cn(variants[variant], className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-xl font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-2 text-sm leading-relaxed text-muted", className)}
      {...props}
    />
  );
}
