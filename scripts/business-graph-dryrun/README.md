# Business Graph Stage 3A — isolated migration dry-run

Проверка additive migration `business_graph_*` на **временной** Postgres в Docker.

**Не использует production Supabase.** Не меняет `/etc/ckr/ckr.env`.

## Запуск

```bash
bash scripts/business-graph-dryrun/run.sh
```

Скрипт:
1. Поднимает disposable Postgres (`ckr-bg-dryrun`)
2. Bootstrap auth/roles + `is_admin`
3. Применяет `20260811160000_business_graph_stage3a.sql`
4. Валидирует schema/indexes/RLS
5. Останавливает контейнер

## Cleanup

```bash
docker rm -f ckr-bg-dryrun 2>/dev/null || true
```
