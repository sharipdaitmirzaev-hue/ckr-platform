/**
 * AuctionAssetExtractor — torgi.gov.ru / fedresurs detail pages.
 */

import { extractOfficialIdFromUrl } from "@/lib/lia/oi/sources/candidate-factory";
import {
  computeDaysRemaining,
  extractDeadlineFromOfficialText,
} from "@/lib/lia/oi/enrichment/dates";
import { labeledValue } from "@/lib/lia/oi/enrichment/html";
import { extractLabeledMoney, extractPrimaryMoney } from "@/lib/lia/oi/enrichment/money";
import { field, type OpportunityExtractor } from "@/lib/lia/oi/enrichment/types";
import type { LiaOiClaim, LiaOiStructuredField } from "@/types/lia-oi";

function claimFrom(
  f: LiaOiStructuredField,
): LiaOiClaim {
  return {
    field: f.field,
    value: String(f.value),
    kind: f.kind,
    sourceUrl: f.sourceUrl,
    sourceName: "official page",
    note: f.note,
  };
}

export const auctionAssetExtractor: OpportunityExtractor = {
  id: "AuctionAssetExtractor",
  matches(c) {
    return (
      c.sourceAdapterId === "auction_assets" ||
      c.opportunityType === "AUCTION_ASSET" ||
      /torgi\.gov\.ru|bankrot\.fedresurs\.ru/i.test(c.sources[0]?.url || "")
    );
  },
  extract({ candidate, text, finalUrl, titleTag }) {
    const structured: LiaOiStructuredField[] = [];
    const patch: Record<string, unknown> = {};
    const src = "official_page" as const;
    const url = finalUrl;

    const lotId =
      extractOfficialIdFromUrl(url, "lot") ||
      labeledValue(text, /(?:номер\s+лот|лот\s*№|lot\s*id|извещение\s*№)/i) ||
      candidate.sourceObjectId ||
      null;
    const lotField = field("lot_id", lotId, {
      source: src,
      confidence: lotId ? 92 : 0,
      sourceUrl: url,
    });
    if (lotField) {
      structured.push(lotField);
      patch.sourceObjectId = String(lotId);
    }

    const objectName =
      titleTag ||
      labeledValue(text, /(?:предмет|наименование|объект)/i) ||
      candidate.title;
    const nameField = field("object_name", objectName, {
      source: src,
      confidence: 88,
      sourceUrl: url,
    });
    if (nameField) {
      structured.push(nameField);
      if (objectName && objectName.length > 8) patch.title = objectName;
    }

    const assetType =
      labeledValue(text, /(?:тип\s+имуществ|вид\s+имуществ|категория)/i) ||
      candidate.assetType ||
      null;
    const at = field("asset_type", assetType, {
      source: src,
      confidence: assetType ? 80 : 0,
      sourceUrl: url,
    });
    if (at) {
      structured.push(at);
      patch.assetType = String(assetType);
    }

    const region =
      labeledValue(
        text,
        /(?:регион|субъект\s+рф|местонахождение|место\s+нахождения)/i,
      ) || candidate.region;
    const rf = field("region", region, {
      source: src,
      confidence: region ? 85 : 0,
      sourceUrl: url,
    });
    if (rf) {
      structured.push(rf);
      patch.region = String(region);
    }

    const address = labeledValue(text, /(?:адрес|местоположение)/i);
    const af = field("address", address, {
      source: src,
      confidence: address ? 80 : 0,
      sourceUrl: url,
    });
    if (af) {
      structured.push(af);
      patch.address = String(address);
    }

    const startMoney =
      extractLabeledMoney(
        text,
        /начальн[а-яё]*\s*цен|стартов[а-яё]*\s*цен|цена\s+лот/i,
        "STARTING_AUCTION_PRICE",
      ) || extractPrimaryMoney(text, ["STARTING_AUCTION_PRICE"]);
    if (startMoney && startMoney.kind !== "UNKNOWN") {
      const sf = field("starting_price", startMoney.amountRub, {
        source: src,
        confidence: 95,
        sourceUrl: url,
        note: startMoney.raw,
      });
      if (sf) {
        structured.push(sf);
        patch.startingPrice = startMoney.amountRub;
        patch.askingPrice = startMoney.amountRub;
        patch.priceKind = "STARTING_AUCTION_PRICE";
        patch.priceStatus = "KNOWN";
      }
    }

    const curMoney = extractLabeledMoney(
      text,
      /текущ[а-яё]*\s*цен|текущ[а-яё]*\s+ставк|последн[а-яё]*\s+ставк/i,
      "CURRENT_AUCTION_PRICE",
    );
    if (curMoney) {
      const cf = field("current_price", curMoney.amountRub, {
        source: src,
        confidence: 92,
        sourceUrl: url,
        note: curMoney.raw,
      });
      if (cf) {
        structured.push(cf);
        patch.currentPrice = curMoney.amountRub;
      }
    }

    const status =
      labeledValue(text, /(?:статус|состояние\s+торгов|этап)/i) ||
      (/завершен/i.test(text + (titleTag || "")) ? "Завершено" : null);
    const st = field("auction_status", status, {
      source: src,
      confidence: status ? 85 : 0,
      sourceUrl: url,
    });
    if (st) {
      structured.push(st);
      patch.auctionStatus = String(status);
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

    const organizer =
      labeledValue(text, /(?:организатор|конкурсный\s+управляющий|заказчик\s+торгов)/i) ||
      candidate.organizer;
    const of = field("organizer", organizer, {
      source: src,
      confidence: organizer ? 82 : 0,
      sourceUrl: url,
    });
    if (of) {
      structured.push(of);
      patch.organizer = String(organizer);
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
