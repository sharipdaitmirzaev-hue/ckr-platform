/** Shared untrusted HTML → text helpers for Stage 2C.1 extractors. */

export function stripHtml(html: string, maxLen = 40_000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : " ";
    })
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const t = m[1].replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 240) : null;
}

export function extractMetaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  const m = html.match(re) || html.match(re2);
  return m?.[1]?.trim() || null;
}

const NEXT_LABEL =
  /(?:Регион|Адрес|Статус|Окончание|Организатор|Заказчик|НМЦК|Тип(?:\s+имуществ[а-яё]*)?|Предмет|Этап|Отрасль|Требования|Вид(?:\s+поддержк[а-яё]*)?|Срок|ОКПД|Место|Начальн[а-яё]*|Текущ[а-яё]*|Оператор|Размер)/i;

/** Prefer labeled value near a Russian/English label. */
export function labeledValue(
  text: string,
  labels: RegExp,
): string | null {
  const re = new RegExp(`(?:${labels.source})\\s*[:\\-–]?\\s*`, "i");
  const m = text.match(re);
  if (!m || m.index == null) return null;
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const stop = rest.search(
    new RegExp(`\\s+(?:${NEXT_LABEL.source})\\s*[:\\-–]|[.;]|$`, "i"),
  );
  const raw = (stop >= 0 ? rest.slice(0, stop) : rest)
    .trim()
    .replace(/\s+/g, " ");
  if (!raw || raw.length < 2) return null;
  return raw.slice(0, 160);
}
