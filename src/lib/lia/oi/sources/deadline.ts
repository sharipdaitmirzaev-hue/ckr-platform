/**
 * Deadline awareness for auctions / tenders / support programs.
 * Raises priority when ending soon — does NOT auto-boost opportunity_score.
 */

import type { LiaOiPriority } from "@/types/lia-oi";

const MS_DAY = 24 * 60 * 60 * 1000;

export function parseDeadline(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // ISO
  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString();

  // DD.MM.YYYY or DD.MM.YYYY HH:mm
  const m = trimmed.match(
    /(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/,
  );
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const yyyy = Number(m[3]);
    const hh = m[4] ? Number(m[4]) : 23;
    const min = m[5] ? Number(m[5]) : 59;
    const d = new Date(yyyy, mm, dd, hh, min, 0);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

export function extractDeadlineFromText(text: string): string | null {
  if (!text) return null;
  const patterns = [
    /(?:до|окончани[ея]|дедлайн|срок подачи|при[её]м заявок до)[:\s]+(\d{1,2}[./]\d{1,2}[./]\d{4}(?:\s+\d{1,2}:\d{2})?)/i,
    /(\d{1,2}[./]\d{1,2}[./]\d{4})\s*(?:г(?:ода)?\.?)?/,
    /(\d{4}-\d{2}-\d{2}T?\d{0,2}:?\d{0,2})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const parsed = parseDeadline(m[1]);
      if (parsed) return parsed;
    }
  }
  return null;
}

export function daysRemaining(deadlineAt?: string | null, now = Date.now()): number | null {
  if (!deadlineAt) return null;
  const t = Date.parse(deadlineAt);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - now) / MS_DAY);
}

/** Priority bump from deadline — never changes opportunity_score. */
export function priorityFromDeadline(
  base: LiaOiPriority,
  days: number | null,
): LiaOiPriority {
  if (days == null) return base;
  if (days < 0) return base;
  if (days <= 3) return "URGENT";
  if (days <= 7) {
    if (base === "URGENT") return "URGENT";
    return "HIGH_PRIORITY";
  }
  if (days <= 14 && (base === "NORMAL" || base === "INTERESTING")) {
    return "INTERESTING";
  }
  return base;
}

export function deadlineLabel(days: number | null): string | null {
  if (days == null) return null;
  if (days < 0) return "Срок истёк";
  if (days === 0) return "До окончания: сегодня";
  if (days === 1) return "До окончания: 1 день";
  if (days < 5) return `До окончания: ${days} дня`;
  return `До окончания: ${days} дней`;
}
