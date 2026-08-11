/**
 * Normalize EIS SOAP/XML notice export → OfficialProviderObject.
 */

import { field } from "@/lib/lia/oi/enrichment/types";
import {
  parseXmlDate,
  parseXmlMoney,
  xmlAllBlocks,
  xmlTagText,
} from "@/lib/lia/oi/sources/providers/xml";
import type {
  OfficialDataChannel,
  OfficialProviderObject,
} from "@/lib/lia/oi/sources/providers/types";
import type { LiaOiStructuredField } from "@/types/lia-oi";

function regionFromBlock(block: string): string | null {
  const places = xmlAllBlocks(block, "kladrPlace");
  for (const p of places) {
    const name = xmlTagText(p, "fullName");
    if (name) return name;
  }
  const addr = xmlTagText(block, "factAddress");
  if (!addr) return null;
  const m = addr.match(
    /^([^,]+(?:область|край|республика|округ)|г\.\s*[А-Яа-яЁё-]+)/i,
  );
  return m?.[1]?.trim() || addr.split(",")[0]?.trim() || null;
}

function customerFromBlock(block: string): string | null {
  const orgs = xmlAllBlocks(block, "responsibleOrg");
  for (const org of orgs) {
    const name = xmlTagText(org, "fullName");
    if (name) return name;
  }
  return xmlTagText(block, "organizationName");
}

export function parseEisNoticeXml(
  xml: string,
  options?: { dataChannel?: OfficialDataChannel },
): OfficialProviderObject[] {
  const channel = options?.dataChannel ?? "OFFICIAL_API";
  const sourceName =
    channel === "FIXTURE_DEMO"
      ? "ЕИС (fixture XML)"
      : "Официальный API ЕИС";
  const conf = channel === "FIXTURE_DEMO" ? 90 : 96;
  const fieldSource =
    channel === "FIXTURE_DEMO" ? ("fixture" as const) : ("official_api" as const);

  const blocks = [
    ...xmlAllBlocks(xml, "fcsNotificationEF"),
    ...xmlAllBlocks(xml, "fcsNotificationEP"),
    ...xmlAllBlocks(xml, "notificationInfo"),
  ];

  const out: OfficialProviderObject[] = [];

  for (const block of blocks) {
    const procurementId =
      xmlTagText(block, "purchaseNumber") ||
      xmlTagText(block, "regNumber") ||
      xmlTagText(block, "id");
    if (!procurementId) continue;

    const subject =
      xmlTagText(block, "purchaseObjectInfo") ||
      xmlTagText(block, "objectInfo") ||
      "Закупка ЕИС";
    const customer = customerFromBlock(block);
    const nmck =
      parseXmlMoney(xmlTagText(block, "maxPrice")) ||
      parseXmlMoney(xmlTagText(block, "price"));
    const collecting = xmlAllBlocks(block, "collecting")[0] || "";
    const deadlineAt =
      parseXmlDate(xmlTagText(collecting, "endDate")) ||
      parseXmlDate(xmlTagText(block, "endDate")) ||
      parseXmlDate(xmlTagText(block, "collectingEndDate"));
    const stage =
      xmlTagText(block, "purchaseStage") || xmlTagText(block, "stage");
    const officialUrl =
      xmlTagText(block, "href") ||
      `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=${encodeURIComponent(procurementId)}`;
    const region = regionFromBlock(block);

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

    push("procurement_id", procurementId, conf);
    push("official_url", officialUrl, conf);
    push("procurement_subject", subject, conf - 2);
    if (customer) push("customer", customer, conf - 2);
    if (region) push("region", region, conf - 4);
    if (nmck != null) push("nmck", nmck, conf);
    if (deadlineAt) push("deadline_at", deadlineAt, conf);
    if (stage) push("procurement_stage", stage, conf - 2);

    const title = `Закупка ${procurementId}: ${subject}`.slice(0, 180);
    const description = [
      subject,
      customer ? `Заказчик: ${customer}` : null,
      stage ? `Этап: ${stage}` : null,
      nmck != null ? `НМЦК: ${nmck.toLocaleString("ru-RU")} ₽` : null,
    ]
      .filter(Boolean)
      .join(". ");

    out.push({
      providerId: "eis",
      rawOfficialId: procurementId,
      title,
      description,
      region,
      deadlineAt,
      status: stage,
      officialUrl,
      structuredFields,
      claims: [
        {
          field: "procurement_id",
          value: procurementId,
          kind: "FACT",
          sourceName,
          sourceUrl: officialUrl,
        },
        {
          field: "procurementId",
          value: procurementId,
          kind: "FACT",
          sourceName,
          sourceUrl: officialUrl,
        },
        ...(customer
          ? [
              {
                field: "customer",
                value: customer,
                kind: "FACT" as const,
                sourceName,
                sourceUrl: officialUrl,
              },
            ]
          : []),
        ...(nmck != null
          ? [
              {
                field: "nmck",
                value: String(nmck),
                kind: "FACT" as const,
                sourceName,
                sourceUrl: officialUrl,
              },
            ]
          : []),
        ...(deadlineAt
          ? [
              {
                field: "deadline_at",
                value: deadlineAt,
                kind: "FACT" as const,
                sourceName,
                sourceUrl: officialUrl,
              },
            ]
          : []),
      ],
      dataChannel: channel,
      sourceConfidence: conf,
      customer,
      subject,
      nmck,
    });
  }

  return out;
}
