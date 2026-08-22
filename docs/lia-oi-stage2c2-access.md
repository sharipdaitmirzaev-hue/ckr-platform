# Stage 2C.2 — Official Data Access (диагностика)

Дата: 2026-08-11. Host: production `161.104.18.135` (NovaCloud).

## Credentials / access matrix

| SOURCE | DATA METHOD | OFFICIAL? | AUTH REQUIRED? | REGISTRATION REQUIRED? | COST | FIELDS AVAILABLE | RATE LIMIT | ACCESSIBLE FROM VPS? | RECOMMENDATION |
|---|---|---|---|---|---|---|---|---|---|
| ЕИС (zakupki.gov.ru) | SOAP СОИ / getDocsIP | Yes | Yes (token; GOST TLS на новых доменах) | Yes (ЛК ЕИС / организация) | Free for SOI token path; infra for GOST may cost | procurement id, customer, subject, NMCK, dates, docs XML | Vendor-defined | **No** — TCP:443 timeout to zakupki/int hosts | Primary: SOAP after owner registers token; not HTML |
| ГИС Торги (torgi.gov.ru) | HTML portal / «Открытые данные» section | Yes | Public pages claimed; machine feeds unclear without portal access | Portal registration for participation; open data TBD | Free (public) | lot/notice fields when HTML/open data available | n/a | **No** — TCP:443 timeout | Need open-data dump access from allowed network OR official feed once reachable |
| ЕФРСБ | REST API (`bank-publications-*-fedresurs.ru`) | Yes | Yes (login/password → JWT) | Yes (contract with Interfax/operator) | Contract | trades, lots, publications structured | ~8 rps/IP (docs) | API host **reachable**; needs credentials. HTML detail on `old.bankrot` → **401** | Primary: REST API after contract |
| МСП.РФ | HTML | Yes | Public, but WAF | No for browse | Free | program pages when allowed | n/a | TCP OK, **HTTP 403** | Not primary; use corpmsp/мойбизнес or future MSP API if published |
| Корпорация МСП (corpmsp.ru) | HTML | Yes | No | No | Free | mostly landing/news; weak DETAIL | n/a | **Yes** (200) | Discovery/fallback only until structured feed exists |
| Мой бизнес | HTML | Yes | No | No | Free | measures catalog pages | n/a | **Yes** (200) | Discovery/fallback; prefer structured regional feeds later |
| data.gov.ru | Open data portal | Yes | Usually no for public datasets | Sometimes publisher-specific | Free | varies by dataset | n/a | **Yes** | Check datasets for auctions/procurement dumps as secondary |

## Recommended transport (after credentials)

1. **procurement** → ЕИС SOAP XML (token) → normalize → OpportunityCandidate  
2. **auction_assets** → ЕФРСБ REST (contract) + ГИС Торги open data when network allows  
3. **support_programs** → keep Serper discovery + HTML enrich on reachable DETAIL; seek MSP open datasets  
4. **Serper** → general discovery / fallback only  

## Matching readiness recommendation (do not start Matching yet)

**HARD MATCH** needs confirmed: type, official id, region, money (price/NMCK/support), status/stage, official URL.  
**SOFT MATCH** may use PARTIAL with explicit low confidence.  

Currently HARD MATCH volume ≈ 0 from live official detail. Do not start Matching Engine until at least one official structured channel (ЕИС token and/or ЕФРСБ contract) is live.
