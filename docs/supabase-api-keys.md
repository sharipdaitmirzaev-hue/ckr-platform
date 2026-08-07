# Supabase API keys в ЦКР

Текущий стек: `@supabase/supabase-js` **2.112.1**, `@supabase/ssr` **0.12.4**.

## Поддержка форматов

| Назначение | Новый ключ | Legacy ключ | Env в ЦКР |
|------------|------------|-------------|-----------|
| Клиент / SSR (RLS) | `sb_publishable_...` | `anon` (JWT) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` или `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Сервер / admin / seed | `sb_secret_...` | `service_role` (JWT) | `SUPABASE_SERVICE_ROLE_KEY` или `SUPABASE_SECRET_KEY` |

**Да:** publishable можно класть в `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
**Да:** secret можно класть в `SUPABASE_SERVICE_ROLE_KEY`.  
Имена переменных исторические; код принимает оба формата.

SDK распознаёт `sb_publishable_` / `sb_secret_` и передаёт их в заголовке `apikey`.  
Для REST/Auth клиентов без сессии Bearer fallback с новым ключом обрабатывается платформой (см. docs Supabase); Edge Functions в ЦКР для ядра не используются.

## Откуда брать в Dashboard

**Новые ключи:** Settings → API Keys → *Publishable and secret API keys*  
**Legacy:** Settings → API Keys → *Legacy API Keys* → `anon` / `service_role`

Legacy остаются рабочими до вывода из эксплуатации Supabase (план — конец 2026). Можно мигрировать постепенно.

## Чего не делать

- Не класть `sb_secret_...` / `service_role` в `NEXT_PUBLIC_*`
- Не коммитить ключи и не печатать их в логах
- В ручных `curl`/webhooks с **новыми** ключами слать только `apikey`, не `Authorization: Bearer <sb_...>`

## Проверка без раскрытия секрета

```bash
# только префикс/длина, не значение
set -a; source /etc/ckr/ckr.env; set +a
python3 - <<'PY'
import os
def kind(name):
    v = os.environ.get(name) or ""
    if not v: return f"{name}: missing"
    if v.startswith("sb_publishable_"): return f"{name}: publishable"
    if v.startswith("sb_secret_"): return f"{name}: secret"
    if v.count(".") == 2: return f"{name}: legacy_jwt"
    return f"{name}: unknown_format"
print(kind("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
print(kind("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"))
print(kind("SUPABASE_SERVICE_ROLE_KEY"))
print(kind("SUPABASE_SECRET_KEY"))
PY
```
