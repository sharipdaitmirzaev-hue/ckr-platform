/**
 * Owner-facing official API + Serper status (no secrets).
 */

import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import {
  eisConnectionStatus,
  eisStatusMessage,
  fedresursConnectionStatus,
  fedresursStatusMessage,
} from "@/lib/lia/oi/sources/providers/config";
import type { OfficialApiConnectionStatus } from "@/lib/lia/oi/sources/providers/types";

export type LiaOiSourceStatusRow = {
  id: string;
  label: string;
  /** CONNECTED | NOT_CONFIGURED | UNAVAILABLE | LIVE | STUB */
  status: OfficialApiConnectionStatus | "LIVE" | "STUB";
  statusMessage: string;
  kind: "official_api" | "discovery";
};

export function getOfficialAndDiscoveryStatusRows(): LiaOiSourceStatusRow[] {
  const mode = resolveOiSearchMode();
  const provider = getInternetSearchProvider();
  const serperLive =
    mode.mode === "live" && provider.mode === "live";

  return [
    {
      id: "eis",
      label: "ЕИС",
      status: eisConnectionStatus(),
      statusMessage: eisStatusMessage(),
      kind: "official_api",
    },
    {
      id: "fedresurs",
      label: "ЕФРСБ",
      status: fedresursConnectionStatus(),
      statusMessage: fedresursStatusMessage(),
      kind: "official_api",
    },
    {
      id: "serper",
      label: "Serper",
      status: serperLive ? "LIVE" : "STUB",
      statusMessage: serperLive
        ? "LIVE"
        : `STUB/DEMO (${provider.label})`,
      kind: "discovery",
    },
  ];
}
