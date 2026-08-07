# Модуль «Документы и верификация» — ЦКР

## Цель

Система доверия ЦКР: участники и гости видят, какие профили, проекты, компании, инвесторы и эксперты прошли проверку.

Поток:

1. Пользователь загружает документы.  
2. Отправляет заявку на проверку.  
3. Админ просматривает материалы.  
4. Сущность получает статус `verified` или остаётся / возвращается в `unverified`.

---

## Статусы проверки сущностей

Поле `verification_status` (`unverified` | `pending` | `verified`) есть у:

| Сущность | Таблица |
|---|---|
| Профиль участника | `profiles` |
| Проект | `projects` |
| Возможность | `opportunities` |
| Инвестиционное предложение | `investment_offers` |
| Профиль эксперта | `expert_profiles` |

В UI статус показывает компонент `VerificationBadge`.

---

## Таблица `documents`

| Поле | Описание |
|---|---|
| `owner_id` | Владелец файла |
| `related_type` | `profile` / `project` / `opportunity` / `investment` / `expert` |
| `related_id` | id связанного объекта |
| `name` | Название |
| `document_type` | Тип документа |
| `file_url` | Путь в Storage bucket `documents` |
| `visibility` | `private` / `review` / `public` |
| `status` | `uploaded` / `pending` / `verified` / `rejected` |

### Типы документов

`business_plan`, `presentation`, `company_document`, `ownership_document`, `license`, `certificate`, `financial`, `other`.

### RLS документов

| Кто | Правило |
|---|---|
| Владелец | Видит, загружает, обновляет, удаляет свои |
| Admin | Полный доступ |
| Гости | Видят только `visibility = public` и `status = verified` |

---

## Таблица `verification_requests`

| Поле | Описание |
|---|---|
| `user_id` | Заявитель |
| `target_type` | Тип объекта (как `related_type`) |
| `target_id` | id объекта |
| `status` | `pending` / `approved` / `rejected` |
| `admin_comment` | Комментарий администратора |

При создании заявки цель переводится в `pending`.  
При одобрении — в `verified`, связанные документы review/pending → `verified`.  
При отказе — цель → `unverified`, pending-документы → `rejected`.

---

## Storage

Bucket: `documents` (private).

Путь файла:

```text
{user_id}/{related_type}/{related_id}/{uuid}-{filename}
```

Политики Storage:

- пользователь загружает только в свою папку `{auth.uid()}/...`;
- чтение/удаление — владелец или admin;
- для UI выдаются signed URL (1 час).

---

## Страницы

| Маршрут | Назначение |
|---|---|
| `/dashboard/documents` | Загрузка документов, статусы, заявки на проверку |
| `/admin/verifications` | Админ: список заявок, документы, подтверждение / отказ |

Доступ к `/admin/*` — только роль `admin` (`requireAdmin()` + RLS).

Роль admin назначается вручную в БД:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID', 'admin');
```

---

## Компоненты

| Компонент | Назначение |
|---|---|
| `VerificationBadge` | Бейдж статуса проверки |
| `DocumentList` | Список документов со ссылками |
| `UploadDocumentForm` | Загрузка файла + метаданные |

---

## Связь с другими модулями

- Каталоги проектов / возможностей / инвестиций / экспертов показывают `VerificationBadge`.  
- Экспертный кабинет ссылается на `/dashboard/documents` для материалов проверки.  
- Это основа доверия перед модулями сообщений и admin API.
