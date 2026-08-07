# Публичный сайт ЦКР

Этап 66 — CKR Website Build. Полноценный внешний сайт на базе существующей платформы.  
Новые бизнес-модули не добавлялись.

Версия: **0.66.0-beta**.

---

## 1. Структура сайта

| Страница | Маршрут | Содержание |
|---|---|---|
| Главная | `/` | Hero, как работает, роли, marketplace preview, кейс, Лия |
| О ЦКР | `/about` | Миссия, идея, принципы, как работаем, роли |
| Услуги | `/services` | 6 категорий + каталог `services` |
| Лия | `/lia` | Интеллектуальный помощник, сценарии, вход «Расскажите о вашей задаче» |
| Предприниматель | `/entrepreneur` | Проблема → помощь → путь → CTA |
| Инвестор | `/investor` | Проекты, возможности, аналитика, интересы |
| Эксперт | `/expert` | Участие, компетенции, репутация |
| Организация | `/organization` | Партнёрство, проекты, возможности |
| Marketplace | `/projects` `/investments` `/opportunities` `/experts` | Поиск, фильтры, карточки, CTA |
| Кейсы | `/cases` | ТИНДА: реальные vs планируемые |
| Доверие | `/trust` | Принципы, роли, репутация, прозрачность |
| Контакты | `/contacts` | Контакты, форма, ссылки |

SEO: metadata / Open Graph на страницах, `sitemap.ts`, `robots.ts`.

---

## 2. Пользовательские пути

1. **Посетитель → аудит:** `/` → «Получить аудит» → `/lia` → BusinessAuditReport → регистрация / проект  
2. **Разместить проект:** `/` → регистрация → create project  
3. **Marketplace:** каталоги → карточка → интерес / заявка  
4. **Услуги → контакт:** `/services` → CTA → `/contacts` или Лия  
5. **Роль:** `/entrepreneur`… → регистрация с preselect роли  

---

## 3. Точки конверсии

- Hero CTA: аудит / проект / возможности  
- «Расскажите о вашей задаче» на `/lia` и главной  
- Категории услуг с CTA  
- Форма `/contacts` (`contact_started` + feedback)  
- Регистрация (`registration_started` / `registration_completed`)  

Конфиг: `src/config/ckr-website.ts`.

---

## 4. Аналитика сайта

| Событие | Где |
|---|---|
| `website_view` | все публичные страницы |
| `service_view` / `service_viewed` | `/services` |
| `lia_started` / `lia_started_from_public` | `/lia` |
| `project_view` / `project_viewed` | `/project/[id]` |
| `case_view` / `case_viewed` | `/cases` |
| `contact_started` | `/contacts` |
| `registration_started` | `/register` |

---

## 5. Принципы дизайна

- Бренд ЦКР первым сигналом на главной  
- Доверие, бизнес, технологичность без перегруза  
- Один фокус на секцию; CTA в конце пути  

См. также: [public-website-packaging.md](./public-website-packaging.md), [go-live.md](./go-live.md).
