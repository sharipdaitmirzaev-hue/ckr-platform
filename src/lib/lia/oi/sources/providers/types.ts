/**
 * Stage 2C.3 — Official structured API providers (ЕИС SOAP, ЕФРСБ REST).
 * Separate from OpportunitySourceAdapter; adapters consume these providers.
 */

import type { LiaOiProvenanceKind, LiaOiStructuredField } from "@/types/lia-oi";

/** Connection readiness shown in Owner UI (never exposes secrets). */
export type OfficialApiConnectionStatus =
  | "CONNECTED"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE";

export type OfficialApiProviderId = "eis" | "fedresurs";

export type OfficialDataChannel =
  | "OFFICIAL_API"
  | "SERPER_DISCOVERY"
  | "FIXTURE_DEMO";

export type OfficialProviderObject = {
  providerId: OfficialApiProviderId;
  /** Raw official id (procurement_id / lot_id) */
  rawOfficialId: string;
  title: string;
  description: string;
  region: string | null;
  deadlineAt: string | null;
  status: string | null;
  officialUrl: string;
  /** FACT structured fields from official payload */
  structuredFields: LiaOiStructuredField[];
  claims: Array<{
    field: string;
    value: string;
    kind: LiaOiProvenanceKind;
    sourceName: string;
    sourceUrl?: string;
    note?: string;
  }>;
  /** Channel that produced this object */
  dataChannel: OfficialDataChannel;
  sourceConfidence: number;
  /** Provider-specific extras */
  customer?: string | null;
  subject?: string | null;
  nmck?: number | null;
  organizer?: string | null;
  assetDescription?: string | null;
  startingPrice?: number | null;
  currentPrice?: number | null;
};

export type OfficialProviderQuery = {
  rawQuery: string;
  limit: number;
  /** When true and credentials present — may call remote API */
  allowLive: boolean;
  /** Force official-format fixtures (stub / tests / not configured) */
  useFixtures: boolean;
};

export type OfficialProviderResult = {
  providerId: OfficialApiProviderId;
  label: string;
  connectionStatus: OfficialApiConnectionStatus;
  transport: "fixture" | "http_api";
  objects: OfficialProviderObject[];
  error?: string | null;
  /** Human status line for Owner UI (no secrets) */
  statusMessage: string;
};

export type OfficialProvider = {
  id: OfficialApiProviderId;
  label: string;
  getConnectionStatus: () => OfficialApiConnectionStatus;
  getStatusMessage: () => string;
  search: (query: OfficialProviderQuery) => Promise<OfficialProviderResult>;
};
