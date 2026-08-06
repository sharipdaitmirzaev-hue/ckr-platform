# Коммуникации и центр активности ЦКР

Этап 14: единое место, где пользователь видит события, связанные с ним и его проектами.

---

## Архитектура

```text
/dashboard                  — обзор + рекомендации Лии + активность
/dashboard/notifications    — NotificationCenter
/dashboard/activity         — ActivityFeed
/messages                   — чаты (conversations / messages)
        ↓
notifications · activity_feed · conversations · messages
        ↓
RLS: только свои данные
```

Миграция: `supabase/migrations/20260325240000_notifications_activity_messages.sql`  
(расширяет foundation Этапа 4).

---

## 1. Уведомления

Таблица `notifications` (расширена):

| Поле | Описание |
|---|---|
| `user_id` | Получатель |
| `type` | Тип события |
| `title` | Заголовок |
| `message` | Текст (Stage 14); `body` синхронизируется |
| `related_type` / `related_id` | Связанный объект |
| `is_read` | Прочитано; синхронизируется с `read_at` |
| `link` | Прямой переход |
| `application_id` | Совместимость с Этапом 4 |

**Типы:** `application` · `message` · `project_update` · `deal_update` · `document` · `verification` · `system`  
(также сохраняются legacy: `application_received`, `application_status`)

### NotificationCenter

- список уведомлений;
- отметка одним / всеми прочитанными;
- переход к объекту (`hrefForNotification`).

Страница: `/dashboard/notifications`  
Компонент: `src/components/notifications/notification-center.tsx`

Создание: RPC `create_notification(...)`, триггеры заявок и сообщений.

---

## 2. Активность

Таблица `activity_feed`:

| Поле | Описание |
|---|---|
| `user_id` | Владелец ленты |
| `project_id` | Опционально |
| `action_type` | Тип действия |
| `description` | Текст |
| `metadata` | jsonb |
| `created_at` | Время |

Источники:

- создание проекта (триггер);
- зеркало `project_activity` → лента владельца;
- RPC `log_activity_feed`.

Хранит: создание проекта, статусы, участников, документы, завершение этапов (через mirror).

### ActivityFeed

Страницы: `/dashboard/activity`, виджет на `/dashboard`  
Компонент: `src/components/activity/activity-feed.tsx`

---

## 3. Чаты

Существующие таблицы:

- `conversations` (+ `project_id`, `title`, `updated_at`)
- `conversation_members`
- `messages`

Диалог создаётся при `accepted` заявке (триггер).  
Новое сообщение → уведомление собеседникам.

Страница: `/messages?c=<conversationId>`

Компоненты:

- `ChatList`
- `ChatWindow`
- `MessageBubble`

Функции: список диалогов, просмотр, отправка, связь с проектом.

---

## 4. Лия — «Мои рекомендации»

Блок на `/dashboard` и `/lia` (для авторизованных).

Показывает:

- новые события (непрочитанные уведомления);
- следующие шаги по этапам проектов;
- важные действия (черновики, диалоги, сделки).

Реализация: `src/lib/lia/recommendations.ts` + `LiaRecommendations`.  
Только рекомендации — без автодействий.

---

## Безопасность

| Данные | Политика |
|---|---|
| Уведомления | `user_id = auth.uid()` |
| activity_feed | `user_id = auth.uid()` |
| Диалоги / сообщения | только `conversation_members` |
| Проекты в рекомендациях | свои (`listMyProjects`) |

Пользователь не видит чужие уведомления, диалоги и ленты.

---

## Ключевые файлы

| Путь | Назначение |
|---|---|
| `src/config/notifications.ts` | Типы, подписи, href |
| `src/lib/notifications/*` | Запросы уведомлений |
| `src/lib/activity/*` | Лента активности |
| `src/lib/messages/*` | Диалоги и сообщения |
| `src/features/notifications/actions.ts` | Прочитано |
| `src/features/messages/actions.ts` | Отправка |
| `src/app/(dashboard)/messages/page.tsx` | UI чатов |
| `src/lib/lia/recommendations.ts` | Рекомендации Лии |
