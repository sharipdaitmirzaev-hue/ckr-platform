# Stage 4Q — Собственные идеи ЦКР

Proactive Opportunity Builder. Owner-only. Manual run. No Matching / Synthesis / Scheduler.

## SoT

Production SoT: таблицы `ckr_own_ideas` + `ckr_own_idea_runs` через `SupabaseOwnIdeaStore`.
`memoryOwnIdeaStore` только для unit tests / явного `CKR_OWN_IDEA_STORE=memory` (запрещён в production).

Почему не `projects`: marketplace supply, публичный slug, чужой жизненный цикл.  
Почему не `ckr_requests IDEA`: это клиентская идея (4H).  
Почему не `lia_oi_opportunities`: внешние сигналы, не авторская связка ЦКР.

## Запреты

Нет auto-publish, outreach, заявок, Matching edges, Scheduler.

## Миграция

`supabase/migrations/20260823220000_ckr_own_ideas_stage4q.sql` — additive, RLS `is_admin`. Production apply только по команде DEPLOY + отдельный план.
