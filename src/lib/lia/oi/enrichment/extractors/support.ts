/**
 * SupportProgramExtractor — MSP / corpmsp / мойбизнес detail pages.
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
    sourceName: "official page",
    note: f.note,
  };
}

export const supportProgramExtractor: OpportunityExtractor = {
  id: "SupportProgramExtractor",
  matches(c) {
    return (
      c.sourceAdapterId === "support_programs" ||
      c.opportunityType === "SUPPORT_PROGRAM" ||
      /(мсп\.рф|xn--l1agf\.xn--p1ai|corpmsp\.ru|мойбизнес\.рф)/i.test(
        c.sources[0]?.url || "",
      )
    );
  },
  extract({ candidate, text, finalUrl, titleTag }) {
    const structured: LiaOiStructuredField[] = [];
    const patch: Record<string, unknown> = {};
    const src = "official_page" as const;
    const url = finalUrl;

    const programId =
      extractOfficialIdFromUrl(url, "program") ||
      candidate.sourceObjectId ||
      null;
    const idf = field("program_id", programId, {
      source: src,
      confidence: programId ? 80 : 0,
      sourceUrl: url,
    });
    if (idf) {
      structured.push(idf);
      patch.sourceObjectId = String(programId);
    }

    const programName = titleTag || candidate.title;
    const nf = field("program_name", programName, {
      source: src,
      confidence: 88,
      sourceUrl: url,
    });
    if (nf) {
      structured.push(nf);
      if (programName && programName.length > 5) patch.title = programName;
    }

    const operator =
      labeledValue(text, /(?:оператор|оператор\s+мер|реализует|оператор\s+программ)/i) ||
      (/корпор\w*\s+мсп|corpmsp/i.test(text + url)
        ? "Корпорация МСП"
        : /мсп\.рф|цифровая\s+платформа/i.test(text + url)
          ? "Цифровая платформа МСП"
          : null);
    const of = field("operator", operator, {
      source: src,
      confidence: operator ? 84 : 0,
      sourceUrl: url,
    });
    if (of) structured.push(of);

    const supportType =
      labeledValue(
        text,
        /(?:вид\s+поддержк[а-яё]*|тип\s+поддержк[а-яё]*|форма\s+поддержк[а-яё]*)/i,
      ) ||
      (/грант/i.test(text) ? "Грант" : null) ||
      (/субсид/i.test(text) ? "Субсидия" : null) ||
      (/льготн[а-яё]*\s+кредит|займ/i.test(text) ? "Льготный кредит" : null) ||
      candidate.supportType ||
      null;
    const st = field("support_type", supportType, {
      source: src,
      confidence: supportType ? 82 : 0,
      sourceUrl: url,
    });
    if (st) {
      structured.push(st);
      patch.supportType = String(supportType);
    }

    const amount = extractLabeledMoney(
      text,
      /размер|сумма|до\s+|объ[её]м\s+поддерж|грант\s+до|субсид\w*\s+до/i,
      "SUPPORT_AMOUNT",
    );
    if (amount) {
      const af = field("support_amount", amount.amountRub, {
        source: src,
        confidence: 90,
        sourceUrl: url,
        note: amount.raw,
      });
      if (af) {
        structured.push(af);
        patch.supportAmount = amount.amountRub;
        patch.investmentRequired = amount.amountRub;
        patch.priceKind = "SUPPORT_AMOUNT";
        patch.priceStatus = "KNOWN";
      }
    }

    const region =
      labeledValue(text, /(?:регион|субъект\s+рф|территория)/i) ||
      candidate.region ||
      (/по\s+всей\s+росси|федеральн/i.test(text) ? "Россия" : null);
    const rf = field("region", region, {
      source: src,
      confidence: region ? 80 : 0,
      sourceUrl: url,
    });
    if (rf) {
      structured.push(rf);
      patch.region = String(region);
    }

    const industries =
      labeledValue(text, /(?:отрасл|виды\s+деятельности|ОКВЭД)/i) ||
      candidate.industry;
    const inf = field("industries", industries, {
      source: src,
      confidence: industries ? 75 : 0,
      sourceUrl: url,
    });
    if (inf) {
      structured.push(inf);
      patch.industry = String(industries);
    }

    const eligibility = labeledValue(
      text,
      /(?:требования|кто\s+может|условия\s+участ|критерии)/i,
    );
    const ef = field("eligibility", eligibility, {
      source: src,
      confidence: eligibility ? 72 : 0,
      sourceUrl: url,
    });
    if (ef) {
      structured.push(ef);
      patch.eligibility = String(eligibility);
    }

    const deadline =
      extractDeadlineFromOfficialText(text) || candidate.deadlineAt || null;
    const df = field("deadline_at", deadline, {
      source: src,
      confidence: deadline ? 88 : 0,
      sourceUrl: url,
    });
    if (df) {
      structured.push(df);
      patch.deadlineAt = deadline;
      patch.daysRemaining = computeDaysRemaining(deadline);
    }

    structured.push(
      field("official_url", url, {
        source: src,
        confidence: 98,
        sourceUrl: url,
      })!,
    );
    patch.canonicalUrl = url;
    patch.isOfficialSource = true;

    return {
      patch: patch as Partial<typeof candidate>,
      structuredFields: structured.filter(Boolean),
      claimsExtra: structured.filter(Boolean).map(claimFrom),
    };
  },
};
