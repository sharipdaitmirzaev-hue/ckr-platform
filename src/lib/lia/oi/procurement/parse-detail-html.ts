/**
 * Stage 4N — parse procurement DETAIL HTML from reachable mirrors.
 * Uses text extraction only (no DOM trust). Works for star-pro / zakupki360 / EIS-like pages.
 */

import { extractLabeledMoney } from "@/lib/lia/oi/enrichment/money";
import {
  extractDeadlineFromOfficialText,
  normalizeAbsoluteDate,
} from "@/lib/lia/oi/enrichment/dates";
import { stripHtml } from "@/lib/lia/oi/enrichment/html";
import type { ProcurementLifecycle } from "@/lib/lia/oi/procurement/types";

export type ParsedProcurementHtml = {
  noticeId: string | null;
  title: string | null;
  subject: string | null;
  customer: string | null;
  region: string | null;
  amount: number | null;
  deadlineAt: string | null;
  lifecycle: ProcurementLifecycle;
};

function decodeBasicEntities(raw: string): string {
  return raw
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const cp = Number.parseInt(h, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    })
    .replace(/&#(\d+);/g, (_, d) => {
      const cp = Number.parseInt(d, 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/«|»/g, '"');
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m?.[1]?.trim().replace(/\s+/g, " ") || null;
}

function detectLifecycle(text: string, deadlineAt: string | null): ProcurementLifecycle {
  const t = text.toLowerCase();
  if (/отмен|аннулир|cancelled/i.test(t)) return "CANCELLED";
  if (/статус\s*архив|текущая\s*стадия\s*архив|контракт\s*заключен|завершен[оа]?/i.test(t)) {
    return "CLOSED";
  }
  if (deadlineAt) {
    const ts = Date.parse(deadlineAt);
    if (Number.isFinite(ts) && ts < Date.now()) return "EXPIRED";
  }
  if (/подача\s*заявок|при[её]м\s*заявок|active/i.test(t)) return "ACTIVE";
  return "UNKNOWN";
}

export function parseProcurementDetailHtml(input: {
  html: string;
  noticeHint?: string | null;
  titleHint?: string | null;
}): ParsedProcurementHtml {
  const text = decodeBasicEntities(stripHtml(input.html)).replace(/\s+/g, " ");
  const noticeId =
    input.noticeHint ||
    firstMatch(text, /(?:номер\s*закупки|тендер\s*№|извещени[ея]\s*№?)\s*[:#]?\s*(\d{18,19})/i) ||
    firstMatch(text, /\b(\d{19})\b/) ||
    firstMatch(text, /\b(\d{18})\b/);

  const customer =
    firstMatch(
      text,
      /Заказчик\s+([А-ЯЁA-Z«"][^.]{8,160}?)(?:\s+Начальная|\s+ИНН|\s+К\s+организации|\s+Обеспечение|\s+Номер)/i,
    ) ||
    firstMatch(text, /Заказчик[:\s]+([^\n.]{8,160})/i);

  const subjectRaw =
    firstMatch(
      text,
      /(?:Объект закупки|Предмет закупки|Наименование закупки|Наименование объекта закупки)[:\s]+([^\n.]{5,200})/i,
    ) ||
    firstMatch(
      text,
      /(?:Описание\s+закупки|Что\s+закупают)[:\s]+([^\n.]{5,200})/i,
    );

  const subject =
    subjectRaw && !/^#?\s*Позиция\b/i.test(subjectRaw) && !/доля\s+кол/i.test(subjectRaw)
      ? subjectRaw
      : input.titleHint || null;

  const title =
    firstMatch(
      text,
      /(?:Закупка\s+\d{18,19}\s+Лот\s+\d+\s+)([^|#]+?)(?:\s+Зарегистрироваться|\s+Войти|\s+Сумма)/i,
    ) ||
    firstMatch(text, /<title[^>]*>\s*([^|<]{8,160})/i) ||
    // star-pro often has human title before "Лот"
    firstMatch(text, /([А-ЯЁA-Z][^|#]{8,120}?)\s+Лот\s+\d+/i) ||
    subject ||
    input.titleHint ||
    null;

  const region =
    firstMatch(
      text,
      /Регион[:\s]+((?:Северо-Кавказский федеральный округ\s+)?Республика Дагестан|Дагестан[^.]{0,40})/i,
    ) ||
    (/дагестан/i.test(text) ? "Дагестан" : null);

  const money =
    extractLabeledMoney(
      text,
      /нмцк|начальн[а-яё]*\s+(?:максимальн[а-яё]*\s+)?цен|сумма\s*\/\s*нмц|начальная\s+цена/i,
      "NMCK",
    ) || extractLabeledMoney(text, /на сумму/i, "NMCK");

  const deadlineRaw =
    firstMatch(
      text,
      /Подать заявку до[:\s]*(\d{2}\.\d{2}\.\d{4}(?:\s+\d{1,2}:\d{2})?(?:\s*(?:МСК|MSK))?)/i,
    ) ||
    firstMatch(
      text,
      /Подача заявок[:\s]*\d{2}\.\d{2}\.\d{4}[^\d-]*-\s*(\d{2}\.\d{2}\.\d{4}(?:\s+\d{1,2}:\d{2})?)/i,
    ) ||
    firstMatch(
      text,
      /(?:окончание|срок\s*подачи|при[её]м\s*заявок\s*до)[^0-9]{0,24}(\d{2}\.\d{2}\.\d{4}(?:\s+\d{1,2}:\d{2})?)/i,
    );

  const deadlineAt =
    normalizeAbsoluteDate(deadlineRaw) ||
    extractDeadlineFromOfficialText(text) ||
    normalizeAbsoluteDate(
      firstMatch(text, /до[:\s]*(\d{2}\.\d{2}\.\d{4}(?:\s+\d{1,2}:\d{2})?)/i),
    );

  const lifecycle = detectLifecycle(text, deadlineAt);

  return {
    noticeId,
    title: title ? title.slice(0, 240) : null,
    subject: subject ? subject.slice(0, 240) : null,
    customer: customer ? customer.slice(0, 200) : null,
    region,
    amount: money?.amountRub ?? null,
    deadlineAt,
    lifecycle,
  };
}
