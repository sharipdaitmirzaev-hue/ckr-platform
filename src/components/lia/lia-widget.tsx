"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type LiaWidgetProps = {
  className?: string;
  compact?: boolean;
  /** Встроенная карточка (для главной/кабинета). По умолчанию — плавающая. */
  embedded?: boolean;
};

/**
 * Виджет ИИ-навигатора «Лия».
 * На страницах кроме /lia — плавающая кнопка; также можно встроить карточку.
 */
export function LiaWidget({
  className,
  compact = false,
  embedded = false,
}: LiaWidgetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideFloating =
    pathname === "/lia" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/admin");

  if (embedded) {
    return (
      <Card
        as="aside"
        variant="surface"
        className={cn(compact ? "p-4" : "p-5 sm:p-6", className)}
        aria-label="ИИ-навигатор Лия"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold text-foreground">
            Лия
          </p>
          <Badge variant="accent">MVP</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          ИИ-навигатор ЦКР: идея → проект → возможности → инвестиции → эксперты →
          решение.
        </p>
        {!compact ? (
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <span className="text-accent">—</span>
              Оформление бизнес-идеи
            </li>
            <li className="flex gap-2">
              <span className="text-accent">—</span>
              Подбор инвестиций, земли и экспертов
            </li>
            <li className="flex gap-2">
              <span className="text-accent">—</span>
              Черновик комплексного решения
            </li>
          </ul>
        ) : null}
        <Link
          href="/lia"
          className="mt-4 inline-flex text-sm text-accent transition-colors hover:text-foreground"
        >
          Открыть Лию →
        </Link>
      </Card>
    );
  }

  if (hideFloating) return null;

  return (
    <div className={cn("fixed bottom-5 right-5 z-40", className)}>
      {open ? (
        <Card
          as="aside"
          variant="surface"
          className="mb-3 w-[min(22rem,calc(100vw-2rem))] p-4 shadow-lg shadow-black/20"
          aria-label="ИИ-навигатор Лия"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg text-foreground">Лия</p>
              <p className="mt-1 text-xs text-muted">Навигатор решений ЦКР</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Закрыть
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Подберу проекты, возможности, инвестиции и экспертов. Ответы —
            предварительные рекомендации.
          </p>
          <Link
            href="/lia"
            className="mt-4 inline-flex rounded-sm border border-accent/40 bg-accent-muted px-3 py-2 text-sm text-accent transition-colors hover:border-accent"
          >
            Открыть диалог
          </Link>
        </Card>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 items-center gap-2 rounded-sm border border-accent/40 bg-background/95 px-4 text-sm font-medium text-accent shadow-lg shadow-black/25 backdrop-blur hover:bg-accent-muted"
        aria-expanded={open}
        aria-label="Открыть виджет Лии"
      >
        <span className="font-display text-base">Лия</span>
        <Badge variant="soft">AI</Badge>
      </button>
    </div>
  );
}
