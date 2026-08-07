# Website Final Checklist — этап 68

Статусы: **PASS** | **NEEDS CONFIGURATION** | **NEEDS LEGAL REVIEW** | **BLOCKED**

| Область | Статус | Комментарий |
|---------|--------|-------------|
| Brand | PASS | ЦКР / слоган / палитра в `brand.ts`; место для файлов — `public/brand/` |
| Pages | PASS | Публичные маршруты + auth + legal |
| Navigation | PASS | Header / footer / mobile / legal links |
| Marketplace | PASS | Проекты, инвестиции, возможности, эксперты |
| Lia | PASS (код) / NEEDS CONFIGURATION | Нужны production `LIA_*` |
| Forms | PASS | Contacts → feedback, loading/success/error |
| Auth | PASS (код) / NEEDS CONFIGURATION | Callback + forgot/reset; нужны Auth URLs |
| Domain | NEEDS CONFIGURATION | Задать `NEXT_PUBLIC_SITE_URL` |
| Hosting | NEEDS CONFIGURATION | Подключить deploy |
| SSL | NEEDS CONFIGURATION | После DNS |
| Supabase | NEEDS CONFIGURATION | Отдельный production project + migrations |
| Storage | PASS (код) / NEEDS CONFIGURATION | Bucket + RLS в prod |
| Email | NEEDS CONFIGURATION | SMTP / templates в Supabase |
| SEO | PASS | metadataBase, sitemap, robots, OG image |
| Legal | NEEDS LEGAL REVIEW | `/privacy` `/terms` `/personal-data` — черновики |
| Analytics | PASS | First-party events без стороннего продукта |
| Mobile | PASS | Единый header/footer/forms; проверить на устройстве |
| Accessibility | PASS | labels, headings, focus на ключевых формах |
| Performance | PASS | next/font, next/image для логотипа, edge OG |
| Security | PASS (код) / NEEDS CONFIGURATION | Secrets в env; service role только server |
| Cookies | PASS | Нет необязательных third-party cookies → баннер не показываем |
| Company details | NEEDS CONFIGURATION | Заполнить `NEXT_PUBLIC_COMPANY_*` |
| Logo files | NEEDS CONFIGURATION | Загрузить в `public/brand/` при наличии исходников |

**BLOCKED** пунктов в коде нет: блокер только внешние ручные действия владельца.
