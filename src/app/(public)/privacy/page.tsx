import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { brand } from "@/config/brand";
import { COOKIE_POLICY } from "@/config/legal";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Как ЦКР обрабатывает данные пользователей. Черновик — требует юридической проверки.",
  openGraph: {
    title: `Конфиденциальность · ${siteConfig.name}`,
    description: "Политика конфиденциальности ЦКР (черновик).",
    url: "/privacy",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Политика конфиденциальности">
      <p>
        {brand.name} ({brand.fullName}) обрабатывает данные, необходимые для
        работы платформы: регистрация, профиль, проекты, обращения и сессии
        авторизации.
      </p>
      <p>
        Цели обработки: предоставление сервиса, безопасность, связь по
        обращениям, улучшение продукта. Данные не продаются третьим лицам.
      </p>
      <p>{COOKIE_POLICY.summary}</p>
      <p>
        Для уточнения реквизитов оператора персональных данных и каналов связи
        см. страницу контактов после заполнения данных владельцем ЦКР.
      </p>
      <p>
        Пользователь может запросить доступ, исправление или удаление данных
        через форму на /contacts или email, указанный в реквизитах.
      </p>
    </LegalPageShell>
  );
}
