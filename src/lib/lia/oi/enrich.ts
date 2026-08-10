/**
 * Ограниченное обогащение TOP DETAIL-страниц через safe-fetch.
 * HTML — untrusted; не влияет на system prompt Лии.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import {
  extractIndustryHint,
  extractLocationFromText,
  extractMoneyFromText,
  extractPublicContacts,
} from "@/lib/lia/oi/extract";
import { classifyPageType, isCatalogPageType } from "@/lib/lia/oi/page-type";
import { safeFetch } from "@/lib/http/safe-fetch";
import type { LiaOiCandidate, LiaOiClaim } from "@/types/lia-oi";

function stripHtml(html: string): string {
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
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000);
}

function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const t = m[1].replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 200) : null;
}

function extractPayback(text: string): string | null {
  const m = text.match(
    /окупаем\w*[^\d]{0,12}(\d+(?:[.,]\d+)?)\s*(лет|год|мес)/i,
  );
  return m ? m[0].slice(0, 80) : null;
}

function extractArea(text: string): string | null {
  const m = text.match(
    /(\d+(?:[.,]\d+)?)\s*(м²|м2|кв\.?\s*м|га)\b/i,
  );
  return m ? m[0] : null;
}

function extractRevenueProfit(text: string): {
  revenue?: number;
  profit?: number;
} {
  const rev = text.match(
    /выручк\w*[^\d]{0,16}(\d+(?:[.,]\d+)?)\s*(млн|миллион)?/i,
  );
  const prof = text.match(
    /прибыл\w*[^\d]{0,16}(\d+(?:[.,]\d+)?)\s*(млн|миллион)?/i,
  );
  const toAmt = (m: RegExpMatchArray | null) => {
    if (!m) return undefined;
    let n = Number(m[1].replace(",", "."));
    if (!Number.isFinite(n)) return undefined;
    if ((m[2] || "").toLowerCase().startsWith("млн") || (m[2] || "").toLowerCase().startsWith("миллион")) {
      n *= 1_000_000;
    }
    return Math.round(n);
  };
  return { revenue: toAmt(rev), profit: toAmt(prof) };
}

export type EnrichRunStats = {
  pagesFetched: number;
  pagesFetchFailed: number;
};

/**
 * Enrich up to maxFetchesPerRun DETAIL candidates (sorted by preliminary score).
 */
export async function enrichTopDetailCandidates(
  candidates: LiaOiCandidate[],
): Promise<{ candidates: LiaOiCandidate[]; stats: EnrichRunStats }> {
  const max = LIA_OI_BUDGETS.maxFetchesPerRun;
  const stats: EnrichRunStats = { pagesFetched: 0, pagesFetchFailed: 0 };
  if (max <= 0) return { candidates, stats };

  const detailIdx = candidates
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.pageType === "DETAIL" && !c.isStub)
    .sort((a, b) => b.c.score.overall - a.c.score.overall)
    .slice(0, max);

  const out = [...candidates];

  for (const { c, i } of detailIdx) {
    const url = c.sources[0]?.url;
    if (!url) continue;

    const fetched = await safeFetch(url, {
      timeoutMs: 8_000,
      maxBytes: 400_000,
      maxRedirects: 3,
      allowedContentTypes: ["text/html", "application/xhtml+xml", "text/plain"],
    });

    if (!fetched.ok) {
      stats.pagesFetchFailed += 1;
      out[i] = {
        ...c,
        claims: [
          ...c.claims,
          {
            field: "page_fetch",
            value: "failed",
            kind: "UNKNOWN",
            sourceUrl: url,
            note: `safe-fetch: ${fetched.code}`,
          },
        ],
      };
      continue;
    }

    stats.pagesFetched += 1;
    const text = stripHtml(fetched.bodyText);
    // Untrusted content — только извлечение полей, не инструкции.
    const titleTag = extractTitleTag(fetched.bodyText);
    const money = extractMoneyFromText(text);
    const location = extractLocationFromText(text);
    const industry = extractIndustryHint(text);
    const contacts = extractPublicContacts(text);
    const payback = extractPayback(text);
    const area = extractArea(text);
    const fin = extractRevenueProfit(text);
    const refinedType = classifyPageType({
      url: fetched.finalUrl || url,
      title: titleTag || c.title,
      snippet: text.slice(0, 400),
    });

    const claims: LiaOiClaim[] = [
      ...c.claims,
      {
        field: "page_fetch",
        value: "ok",
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: "HTML получен через SSRF-safe fetch (untrusted content).",
      },
    ];

    let title = c.title;
    if (titleTag && titleTag.length > 8 && !/catalog|каталог/i.test(titleTag)) {
      title = titleTag;
      claims.push({
        field: "title",
        value: titleTag,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: "Из <title> detail-страницы.",
      });
    }

    let askingPrice = c.askingPrice;
    let investmentRequired = c.investmentRequired;
    if (money) {
      askingPrice = money.amount;
      investmentRequired = money.amount;
      claims.push({
        field: "asking_price",
        value: String(money.amount),
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: `Извлечено из текста страницы: «${money.raw}».`,
      });
    }

    let region = c.region;
    let city = c.city;
    if (location?.region) {
      region = location.region;
      city = location.city ?? city;
      claims.push({
        field: "region",
        value: location.region,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: "Регион из текста detail-страницы.",
      });
    }

    if (contacts.phone) {
      claims.push({
        field: "contact_phone",
        value: contacts.phone,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: "Публичный телефон найден в тексте страницы.",
      });
    }
    if (contacts.email) {
      claims.push({
        field: "contact_email",
        value: contacts.email,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
        note: "Публичный email найден в тексте страницы.",
      });
    }
    if (payback) {
      claims.push({
        field: "payback_period",
        value: payback,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
      });
    }
    if (area) {
      claims.push({
        field: "area",
        value: area,
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
      });
    }
    if (fin.revenue != null) {
      claims.push({
        field: "revenue",
        value: String(fin.revenue),
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
      });
    }
    if (fin.profit != null) {
      claims.push({
        field: "profit",
        value: String(fin.profit),
        kind: "FACT",
        sourceUrl: fetched.finalUrl || url,
      });
    }

    const description =
      text.length > c.description.length
        ? text.slice(0, 600)
        : c.description;

    out[i] = {
      ...c,
      title,
      description,
      askingPrice: askingPrice ?? null,
      investmentRequired: investmentRequired ?? null,
      region,
      city,
      industry: industry || c.industry,
      paybackPeriod: payback || c.paybackPeriod,
      area: area || c.area,
      revenue: fin.revenue ?? c.revenue,
      profit: fin.profit ?? c.profit,
      contactPhone: contacts.phone || c.contactPhone,
      contactEmail: contacts.email || c.contactEmail,
      pageType: refinedType,
      isCatalogSource: isCatalogPageType(refinedType),
      enrichedFromFetch: true,
      claims,
      sources: c.sources.map((s, idx) =>
        idx === 0
          ? { ...s, url: fetched.finalUrl || s.url }
          : s,
      ),
    };
  }

  return { candidates: out, stats };
}
