import type {
  LiaOiCandidate,
  LiaOiStructuredField,
} from "@/types/lia-oi";

export type ExtractorInput = {
  candidate: LiaOiCandidate;
  html: string;
  text: string;
  finalUrl: string;
  titleTag: string | null;
};

export type ExtractorResult = {
  patch: Partial<LiaOiCandidate>;
  structuredFields: LiaOiStructuredField[];
  claimsExtra: LiaOiCandidate["claims"];
};

export type OpportunityExtractor = {
  id: string;
  matches: (c: LiaOiCandidate) => boolean;
  extract: (input: ExtractorInput) => ExtractorResult;
};

export function field(
  name: string,
  value: string | number | null | undefined,
  opts: {
    source: LiaOiStructuredField["source"];
    confidence: number;
    kind?: LiaOiStructuredField["kind"];
    sourceUrl?: string;
    note?: string;
  },
): LiaOiStructuredField | null {
  if (value == null || value === "") return null;
  return {
    field: name,
    value,
    source: opts.source,
    confidence: opts.confidence,
    kind: opts.kind ?? "FACT",
    sourceUrl: opts.sourceUrl,
    note: opts.note,
  };
}
