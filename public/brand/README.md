# Бренд-материалы ЦКР

Не заменять программный wordmark/ShieldMark «новым сгенерированным» логотипом.

## Куда положить исходные файлы

| Файл | Назначение |
|------|------------|
| `logo.svg` или `logo.png` | Основной логотип (header / footer) |
| `favicon.ico` | Скопировать также в `src/app/favicon.ico` |
| `apple-touch-icon.png` | 180×180 |
| `icon-192.png` | PWA / manifest |
| `icon-512.png` | PWA / manifest |
| `og.png` | Open Graph 1200×630 (опционально; есть динамический OG) |

После загрузки файлов:

1. При необходимости обновите `NEXT_PUBLIC_BRAND_LOGO_PATH=/brand/logo.svg`
2. Пересоберите сайт (`npm run build`)
3. Проверьте `/`, favicon и превью ссылок (Open Graph)

Пока файлов нет, UI использует существующий ShieldMark + wordmark «ЦКР».
