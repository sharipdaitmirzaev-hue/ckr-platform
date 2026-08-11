/**
 * Normalize Fedresurs REST JSON lot payload → OfficialProviderObject.
 */

import { field } from "@/lib/lia/oi/enrichment/types";
import type {
  OfficialDataChannel,
  OfficialProviderObject,
} from "@/lib/lia/oi/sources/providers/types";
import type { LiaOiStructuredField } from "@/types/lia-oi";

export type FedresursLotJson = {
  lotId?: string;
  id?: string;
  tradeNumber?: string;
  title?: string;
  assetDescription?: string;
  description?: string;
  region?: string;
  startingPrice?: number;
  currentPrice?: number;
  startPrice?: number;
  price?: number;
  deadline?: string;
  endDate?: string;
  status?: string;
  organizer?: string;
  officialUrl?: string;
  url?: string;
};

function toIso(raw?: string | null): string | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function parseFedresursLotJson(
  row: FedresursLotJson,
  options?: { dataChannel?: OfficialDataChannel },
): OfficialProviderObject | null {
  const lotId = String(row.lotId || row.id || "").trim();
  if (!lotId) return null;

  const channel = options?.dataChannel ?? "OFFICIAL_API";
  const sourceName =
    channel === "FIXTURE_DEMO"
      ? "ЕФРСБ (fixture JSON)"
      : "Официальный API ЕФРСБ";
  const conf = channel === "FIXTURE_DEMO" ? 90 : 96;
  const fieldSource =
    channel === "FIXTURE_DEMO" ? ("fixture" as const) : ("official_api" as const);

  const assetDescription =
    row.assetDescription || row.description || row.title || "Лот ЕФРСБ";
  const title = (row.title || assetDescription).slice(0, 180);
  const startingPrice =
    row.startingPrice ?? row.startPrice ?? row.price ?? null;
  const currentPrice = row.currentPrice ?? startingPrice;
  const deadlineAt = toIso(row.deadline || row.endDate || null);
  const status = row.status || null;
  const organizer = row.organizer || null;
  const region = row.region || null;
  const officialUrl =
    row.officialUrl ||
    row.url ||
    `https://bankrot.fedresurs.ru/trade/view.html?id=${encodeURIComponent(lotId)}`;

  const structuredFields: LiaOiStructuredField[] = [];
  const push = (
    name: string,
    value: string | number | null,
    confidence = conf,
  ) => {
    const f = field(name, value, {
      source: fieldSource,
      confidence,
      kind: "FACT",
      sourceUrl: officialUrl,
    });
    if (f) structuredFields.push(f);
  };

  push("lot_id", lotId, conf);
  push("official_url", officialUrl, conf);
  push("asset_description", assetDescription, conf - 2);
  if (region) push("region", region, conf - 2);
  if (startingPrice != null) push("starting_price", startingPrice, conf);
  if (currentPrice != null) push("current_price", currentPrice, conf);
  if (deadlineAt) push("deadline_at", deadlineAt, conf);
  if (status) push("auction_status", status, conf - 2);
  if (organizer) push("organizer", organizer, conf - 2);

  return {
    providerId: "fedresurs",
    rawOfficialId: lotId,
    title,
    description: [
      assetDescription,
      organizer ? `Организатор: ${organizer}` : null,
      status ? `Статус: ${status}` : null,
    ]
      .filter(Boolean)
      .join(". "),
    region,
    deadlineAt,
    status,
    officialUrl,
    structuredFields,
    claims: [
      {
        field: "lot_id",
        value: lotId,
        kind: "FACT",
        sourceName,
        sourceUrl: officialUrl,
      },
      ...(startingPrice != null
        ? [
            {
              field: "starting_price",
              value: String(startingPrice),
              kind: "FACT" as const,
              sourceName,
              sourceUrl: officialUrl,
            },
          ]
        : []),
      ...(status
        ? [
            {
              field: "auction_status",
              value: status,
              kind: "FACT" as const,
              sourceName,
              sourceUrl: officialUrl,
            },
          ]
        : []),
      ...(organizer
        ? [
            {
              field: "organizer",
              value: organizer,
              kind: "FACT" as const,
              sourceName,
              sourceUrl: officialUrl,
            },
          ]
        : []),
    ],
    dataChannel: channel,
    sourceConfidence: conf,
    organizer,
    assetDescription,
    startingPrice,
    currentPrice,
  };
}

export function parseFedresursLotsPayload(
  payload: unknown,
  options?: { dataChannel?: OfficialDataChannel },
): OfficialProviderObject[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown })?.items)
      ? ((payload as { items: FedresursLotJson[] }).items)
      : Array.isArray((payload as { lots?: unknown })?.lots)
        ? ((payload as { lots: FedresursLotJson[] }).lots)
        : [];
  const out: OfficialProviderObject[] = [];
  for (const row of items) {
    const obj = parseFedresursLotJson(row as FedresursLotJson, options);
    if (obj) out.push(obj);
  }
  return out;
}
