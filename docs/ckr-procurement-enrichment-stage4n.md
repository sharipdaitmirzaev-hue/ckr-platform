# Stage 4N — Source Access & Procurement Enrichment

**Branch:** `cursor/ckr-procurement-enrichment-4n-ff37`  
**Base:** `cursor/ckr-demand-intelligence-4m-ff37`  
**Production:** untouched (no deploy, no migration apply)

## 1. BEFORE snapshot (production, read-only)

| Item | Value |
|---|---|
| Production commit | `cfdc8ef` |
| Health | OK |
| TINDA request | `223decd8-…` FIND_BUYER / IN_PROGRESS |
| Need | SEEK_BUYER food/beverage · Дагестан / Махачкала |
| REAL GOOD | 0 |
| REAL ACCEPTABLE | 4 |
| WEAK | 2 |
| Useful published procurement | 4 |
| DETAIL success (Stage 4M live) | **0 / 8** (`pagesFetched=0`, `pagesFetchFailed=8`) |
| EIS | DEGRADED / unavailable from VPS |
| Kontur | HTTP 403 |
| TINDA mutated? | **No** |

## 2. Current procurement architecture

```
Need → Query Planner → provider (Serper + adapters)
  → search hits → candidate
  → safeFetch (DETAIL) → extractor
  → LIA OI → quality → Controlled Publish
  → opportunity → Feed → Owner Workbench
```

Stage 4N adds **multi-source Procurement Resolver** between failed primary fetch and OI enrich:

```
safeFetch(primary URL) fail
  → resolveProcurementDetail(noticeId)
       official EIS SOAP (if credentials)
       → trusted secondary HTML (star-pro, zakupki360, tektorg)
       → search evidence URLs
       → unresolved
  → provenance FACT/INFERENCE/UNKNOWN
  → confidence label
```

## 3. Exact EIS failure

| Layer | Result |
|---|---|
| DNS | OK → `95.167.245.92` |
| TCP 443 | **TIMEOUT** from production VPS |
| TLS | not reached |
| HTTP / WAF | not reached on connect |
| Class | **tcp_timeout** (network route / geo / provider filtering — not app bug) |

`int.zakupki.gov.ru` — same TCP timeout class.

## 4. Network diagnosis (read-only)

| Host | Result |
|---|---|
| zakupki.gov.ru | DNS OK, TCP 443 timeout |
| notice URL on EIS | same |
| zakupki.kontur.ru | TLS OK, **HTTP 403** |
| star-pro.ru | OK |
| zakupki360.ru | OK |
| tektorg.ru | OK |
| cbr.ru | OK (control) |

No CAPTCHA bypass, no residential proxies, no UA spoofing as human.

## 5. Official access methods investigated

| Method | Exists now? | Official? | Credentials? | CKR fit |
|---|---|---|---|---|
| A. Public HTML zakupki.gov.ru | Yes | Yes | No | **Unreachable from VPS (TCP)** |
| B. Open data portals | Partial / regional | Yes | Usually no | Low freshness for active notices |
| C. Official dumps | FTP **closed 01.01.2025** | Was | N/A | Dead |
| D. Feeds/RSS | Limited | Mixed | No | Incomplete |
| E. XML exports | Via integration | Yes | Token/ЭЦП | Needs owner creds |
| F. SOAP/API (ТФФ) | Yes (integration) | Yes | **Token + often GOST/ЭЦП** | Best long-term |
| G. Bulk datasets | Historical / delayed | Yes | Varies | Not live DETAIL |
| H. Search by notice ID | Yes (HTML/SOAP) | Yes | HTML none / SOAP yes | HTML blocked on VPS |
| I. Regional dumps | Spotty | Mixed | Varies | Supplement only |
| J/K. 44-FZ / 223-FZ | Covered by EIS | Yes | Same | Same access model |

**Public unauthenticated REST API for full live DETAIL: not available.**  
Do not invent an API.

## 6. Credentials required?

**YES — for official live EIS SOAP:**

```
REQUIRES OWNER CREDENTIALS
```

Need (server-side only, `/etc/ckr/ckr.env`):

- `LIA_EIS_ENABLED=1`
- `LIA_EIS_TOKEN=…`
- optional `LIA_EIS_ENDPOINT` (current ТФФ / GOST domains)
- possibly КриптоПро / certificate for GOST channels

Do **not** paste secrets into chat or git.

## 7. Alternative sources

| Source | Coverage | Freshness | Notice ID | Provenance label |
|---|---|---|---|---|
| star-pro.ru | Good regional | High | Yes | trusted secondary |
| zakupki360.ru | Broad | High | Yes | trusted secondary |
| tektorg.ru | Partial | Medium | Often | trusted secondary |
| Serper snippets | Discovery only | High | Sometimes | search only |

Aggregators are **never** labeled «официально подтверждено ЕИС» unless EIS itself was checked.

## 8. Chosen architecture

1. Keep Serper discovery (incl. mirror site: queries).
2. Primary DETAIL still tries official URL via `safeFetch`.
3. On failure → **Procurement Resolver** over trusted secondaries.
4. Compute-only confidence + per-FACT provenance (no migration).
5. In-memory DETAIL cache (6h) keyed by notice ID.
6. Quality gate **not** lowered.
7. No Matching / Synthesis / Scheduler / auto-publish.

## 9–12. Resolver / Provenance / Confidence / Cross-source

- Identity: 18–19 digit notice ID.
- Precedence: official → secondary → search → unresolved.
- Conflicts: keep first FACT; record `customer_conflict` as INFERENCE.
- Confidence: `OFFICIAL_CONFIRMED` | `MULTI_SOURCE_CONFIRMED` | `TRUSTED_SECONDARY` | `SEARCH_ONLY` | `UNVERIFIED`.
- Cross-source: ≥2 independent trusted secondaries agreeing on notice → `MULTI_SOURCE_CONFIRMED` (still not «EIS official»).

## 13. Product vocabulary

Added: `tea`, `coffee`, `dairy`, `mineral_water`, `food_service_supply`.  
False-positive guard for meat / medical / specialized baby nutrition when need is beverage-oriented.

Tea notice `0303300143726000006` now classifies as `tea` with strong product fit.

## 14. Company context

`assessAssortmentSufficiency` → INTERNAL recommendation if assortiment unknown.  
No CLIENT message. TINDA not mutated.

## 15. DETAIL cache

In-process map: `fetchedAt` / TTL. Reuses OI `firstSeenAt` / `lastSeenAt` for discovered/verified semantics. No new table.

## 16. Lifecycle

Parser sets ACTIVE / CLOSED / CANCELLED / EXPIRED from text + deadline vs now.  
Expired must not surface as «new» demand (existing Feed hard-filter retained).

## 17. Dedup

`sameOfficialIdentity` / notice ID remains primary. Same notice → one candidate.

## 18. Owner Workbench

Shows customer / subject / region / NMCK / deadline / verification label; UNKNOWN stays UNKNOWN.  
UI shell from Stage 4M preserved.

## 19. Controlled Publish

Unchanged: review → publish; owner locks; change_review for critical deltas.

## 20. Source health

EIS row reason: `credentials_missing` / `tcp_timeout` (INTERNAL). No secrets.

## 21. Security

Server-side credentials only; `safeFetch` SSRF guards retained; HTML untrusted; no browser secrets.

## 22. Migration

**None required.** Prefer compute-only.

## 23. Production

**Not deployed.** Dry-run / offline tests only on branch.

## 24. Success metric target

Improve DETAIL success rate vs Stage 4M baseline **0/8** via resolver + reachable mirrors.

## 25. Dry-run AFTER (branch, `CKR_4N_LIVE=1`, no DB writes)

| Metric | BEFORE (4M) | AFTER (4N dry-run on 5 known notices) |
|---|---|---|
| DETAIL success | 0/8 | **5/5** |
| Customers | snippet-limited | **5/5** |
| Amounts | often snippet | **3/5** (2 UNKNOWN kept) |
| Deadlines | often snippet | **5/5** |
| Official confirmed | 0 | 0 (EIS TCP + no SOAP creds) |
| Trusted secondary | — | 5 |
| Tea product fit | fail vocab | **18 (tea)** |

Production untouched. TINDA untouched.
