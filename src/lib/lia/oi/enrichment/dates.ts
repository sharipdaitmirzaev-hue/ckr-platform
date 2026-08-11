/**
 * Date / deadline normalization for Stage 2C.1.
 * Relative dates only when safely convertible from an explicit "N days/hours ago".
 */

import {
  daysRemaining,
  parseDeadline,
} from "@/lib/lia/oi/sources/deadline";

export function normalizeAbsoluteDate(raw?: string | null): string | null {
  return parseDeadline(raw);
}

/** Convert "3 hours ago" / "2 days ago" relative phrases when unambiguous. */
export function normalizeRelativeDate(
  raw?: string | null,
  now = Date.now(),
): string | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (!t) return null;

  const m = t.match(
    /(\d+)\s*(minute|minutes|min|hour|hours|day|days|week|weeks|час(?:а|ов)?|мин(?:ут[аы]?)?|дн(?:я|ей|и)?|недел[яиь]?)\s*ago/,
  );
  const mRu = t.match(
    /(\d+)\s*(час(?:а|ов)?|мин(?:ут[аы]?)?|дн(?:я|ей|и)?|недел[яиь]?)\s*назад/,
  );
  const hit = m || mRu;
  if (!hit) return null;
  const n = Number(hit[1]);
  if (!Number.isFinite(n) || n < 0 || n > 3650) return null;
  const unit = hit[2];
  let ms = 0;
  if (/min|мин/.test(unit)) ms = n * 60_000;
  else if (/hour|час/.test(unit)) ms = n * 3_600_000;
  else if (/day|дн/.test(unit)) ms = n * 86_400_000;
  else if (/week|недел/.test(unit)) ms = n * 7 * 86_400_000;
  else return null;
  return new Date(now - ms).toISOString();
}

export function normalizeAnyDate(raw?: string | null, now = Date.now()): string | null {
  return normalizeAbsoluteDate(raw) || normalizeRelativeDate(raw, now);
}

export function extractDeadlineFromOfficialText(text: string): string | null {
  const patterns = [
    /(?:окончание(?:\s+при[её]ма\s+заявок)?|завершение|срок\s+подачи(?:\s+заявок)?|при[её]м\s+заявок|дедлайн|дата\s+окончания|дата\s+проведения|дата\s+аукциона)[:\s]+(\d{1,2}[./]\d{1,2}[./]\d{4}(?:\s+\d{1,2}:\d{2})?)/i,
    /(?:до)\s+(\d{1,2}[./]\d{1,2}[./]\d{4}(?:\s+\d{1,2}:\d{2})?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const idx = m.index ?? 0;
    const ctx = text.slice(Math.max(0, idx - 48), idx + (m[0]?.length || 0) + 8);
    // publication / article date ≠ application deadline
    if (/опубликован|дата публикац|дата статьи|обновлен[оа]/i.test(ctx)) {
      continue;
    }
    const parsed = parseDeadline(m[1]);
    if (parsed) return parsed;
  }
  return null;
}

export function computeDaysRemaining(deadlineAt?: string | null): number | null {
  return daysRemaining(deadlineAt);
}
