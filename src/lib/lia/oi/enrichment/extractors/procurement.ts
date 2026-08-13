/**
 * ProcurementExtractor — zakupki.gov.ru detail pages.
 */

import { extractOfficialIdFromUrl } from "@/lib/lia/oi/sources/candidate-factory";
import {
  computeDaysRemaining,
  extractDeadlineFromOfficialText,
} from "@/lib/lia/oi/enrichment/dates";
import { labeledValue } from "@/lib/lia/oi/enrichment/html";
import { extractLabeledMoney } from "@/lib/lia/oi/enrichment/money";
import { field, type OpportunityExtractor } from "@/lib/lia/oi/enrichment/types";
import type { LiaOiClaim, LiaOiStructuredField } from "@/types/lia-oi";

function claimFrom(f: LiaOiStructuredField): LiaOiClaim {
  return {
    field: f.field,
    value: String(f.value),
    kind: f.kind,
    sourceUrl: f.sourceUrl,
    sourceName: f.source === "official_page" ? "official page" : "trusted secondary",
    note: f.note,
  };
}

function isOfficialHost(url: string): boolean {
  return /zakupki\.gov\.ru/i.test(url);
}

function isTrustedMirror(url: string): boolean {
  return /star-pro\.ru|zakupki360\.ru|tektorg\.ru|expertcentre\.org/i.test(url);
}

export const procurementExtractor: OpportunityExtractor = {
  id: "ProcurementExtractor",
  matches(c) {
    const url = c.sources[0]?.url || c.canonicalUrl || "";
    return (
      c.sourceAdapterId === "procurement" ||
      c.opportunityType === "PROCUREMENT" ||
      isOfficialHost(url) ||
      isTrustedMirror(url)
    );
  },
  extract({ candidate, text, finalUrl, titleTag }) {
    const structured: LiaOiStructuredField[] = [];
    const patch: Record<string, unknown> = {};
    const official = isOfficialHost(finalUrl);
    const src = official
      ? ("official_page" as const)
      : ("trusted_secondary" as const);
    const url = finalUrl;

    const procurementId =
      extractOfficialIdFromUrl(url, "procurement") ||
      labeledValue(text, /(?:№\s*закупк|реестров\w*\s+номер|номер\s+извещения)/i) ||
      candidate.sourceObjectId ||
      null;
    const idf = field("procurement_id", procurementId, {
      source: src,
      confidence: procurementId ? 93 : 0,
      sourceUrl: url,
    });
    if (idf) {
      structured.push(idf);
      patch.sourceObjectId = String(procurementId);
    }

    const customer =
      labeledValue(text, /(?:заказчик|организация)/i) || candidate.customer;
    const cf = field("customer", customer, {
      source: src,
      confidence: customer ? 86 : 0,
      sourceUrl: url,
    });
    if (cf) {
      structured.push(cf);
      patch.customer = String(customer);
    }

    const subject =
      titleTag ||
      labeledValue(text, /(?:предмет\s+закупк|наименование\s+объекта)/i) ||
      candidate.title;
    const sf = field("procurement_subject", subject, {
      source: src,
      confidence: 88,
      sourceUrl: url,
    });
    if (sf) {
      structured.push(sf);
      if (subject && subject.length > 8) patch.title = subject;
    }

    const region =
      labeledValue(text, /(?:регион|место\s+поставки|субъект)/i) ||
      candidate.region;
    const rf = field("region", region, {
      source: src,
      confidence: region ? 84 : 0,
      sourceUrl: url,
    });
    if (rf) {
      structured.push(rf);
      patch.region = String(region);
    }

    const nmck = extractLabeledMoney(
      text,
      /нмцк|начальн[а-яё]*\s+максимальн[а-яё]*\s+цен|начальная\s+цена/i,
      "NMCK",
    );
    if (nmck) {
      const nf = field("nmck", nmck.amountRub, {
        source: src,
        confidence: 95,
        sourceUrl: url,
        note: nmck.raw,
      });
      if (nf) {
        structured.push(nf);
        patch.nmck = nmck.amountRub;
        patch.askingPrice = nmck.amountRub;
        patch.priceKind = "NMCK";
        patch.priceStatus = "KNOWN";
      }
    }

    const deadline =
      extractDeadlineFromOfficialText(text) || candidate.deadlineAt || null;
    const df = field("deadline_at", deadline, {
      source: src,
      confidence: deadline ? 90 : 0,
      sourceUrl: url,
    });
    if (df) {
      structured.push(df);
      patch.deadlineAt = deadline;
      patch.daysRemaining = computeDaysRemaining(deadline);
    }

    const stage =
      labeledValue(text, /(?:этап|статус|состояние)/i) ||
      candidate.procurementStage;
    const st = field("procurement_stage", stage, {
      source: src,
      confidence: stage ? 80 : 0,
      sourceUrl: url,
    });
    if (st) {
      structured.push(st);
      patch.procurementStage = String(stage);
    }

    const okpd = labeledValue(text, /(?:ОКПД|код\s+ОКПД|КТРУ)/i);
    const ok = field("okpd", okpd, {
      source: src,
      confidence: okpd ? 78 : 0,
      sourceUrl: url,
    });
    if (ok) {
      structured.push(ok);
      if (!candidate.industry) patch.industry = String(okpd);
    }

    structured.push(
      field("official_url", url, {
        source: src,
        confidence: 98,
        sourceUrl: url,
      })!,
    );
    patch.canonicalUrl = url;
    // Only mark official when HTML was fetched from zakupki.gov.ru
    if (official) patch.isOfficialSource = true;

    return {
      patch: patch as Partial<typeof candidate>,
      structuredFields: structured.filter(Boolean),
      claimsExtra: structured.filter(Boolean).map(claimFrom),
    };
  },
};
