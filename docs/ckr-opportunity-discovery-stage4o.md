# Stage 4O — CKR Opportunity Discovery & Intelligence

## Goal

Единая архитектура поиска возможностей в **двух режимах**:

1. **REQUEST_DRIVEN** — есть заявка/идея → сначала ЦКР → при необходимости интернет  
2. **MARKET_DRIVEN** — без заявки owner ищет рынок → review → банк для будущих клиентов  

**Не создаём:** Matching Engine, Synthesis, Scheduler, auto-outreach, auto-publish.

## Architecture audit (summary)

| Entity | Class | SoT | Request search | Market opp | New for 4O? |
|--------|-------|-----|----------------|------------|-------------|
| ckr_requests | workflow | DB | root | no | no |
| need_profiles | demand | DB | primary filter | weak PUBLIC signal | no |
| organizations | resource | DB | yes | no (company ≠ opp) | no |
| projects | supply | DB | yes | yes | no |
| opportunities | supply/signal | DB | yes (published) | yes | no |
| investment_offers | supply | DB | yes | yes | no |
| expert_profiles | resource | DB | yes | yes | no |
| applications / partnerships | workflow | DB | no / indirect | no | no |
| lia_oi_* | pre-market | DB | staff discovery | after Controlled Publish | no |
| Personalized Feed | ranking | compute + feedback | yes | no | no |
| Demand Intel 4M | workflow | compute | yes | no | no |
| Procurement 4N | enricher | compute | supports | no | no |
| Business Graph | overlay | DB | not SoT for 4O | no | no |

**Duplicates found:** name collision `opportunities` vs `lia_oi_opportunities` vs graph OPPORTUNITY — разные SoT, не сливать.  
**New tables:** **нет** (review через `ckr_request_events`).

## Contracts

- `OpportunitySearchContext` — только confirmed fields  
- `DiscoveryCandidate` — presentation DTO (не dump в `opportunities`)  
- `DiscoverySearchPlan` — PASS 1 INTERNAL → PASS 2–4 external (owner-gated)  
- Source categories — text catalog (`PROCUREMENT`, `INVESTMENT_PROJECT`, …)

## Owner UX

- Inbox: «Поиск внутри ЦКР» / «Расширить поиск»  
- `/admin/owner/discovery` — market-driven + банк (read-layer)

## Opportunity Bank

Read aggregation over existing entities + Controlled Publish. **Не** новая таблица.

## Company learning

`proposeCompanyFactsFromText` → PROPOSED only. Owner confirm required. No auto Company update.

## Tests

```bash
npm run test:ckr-opportunity-discovery-stage4o
```

## Hard stops

Production deploy · migration apply · Matching · Synthesis · Scheduler · Stage 4P — **NO**.
