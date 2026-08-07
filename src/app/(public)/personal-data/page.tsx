import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Обработка персональных данных",
  description:
    "Сведения об обработке персональных данных в ЦКР. Черновик — требует юридической проверки.",
  openGraph: {
    title: `Персональные данные · ${siteConfig.name}`,
    description: "Обработка персональных данных ЦКР (черновик).",
    url: "/personal-data",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/personal-data" },
};

export default function PersonalDataPage() {
  return (
    <LegalPageShell title="Обработка персональных данных">
      <p>
        Настоящий раздел описывает категории данных, которые может обрабатывать{" "}
        {brand.name}: идентификационные (имя, email), контактные, данные
        профиля, сведения о проектах и обращениях, технические логи безопасности.
      </p>
      <p>
        Правовые основания (после юридической проверки): исполнение соглашения,
        согласие субъекта, законные интересы оператора в части безопасности и
        предотвращения злоупотреблений.
      </p>
      <p>
        Сроки хранения определяются необходимостью работы сервиса и требованиями
        законодательства. Документы и файлы хранятся в Storage с разграничением
        доступа (RLS).
      </p>
      <p>
        Передача данных провайдерам инфраструктуры (хостинг, база данных, email)
        осуществляется только в объёме, необходимом для работы сервиса.
      </p>
      <p>
        Для реализации прав субъекта персональных данных используйте /contacts
        или контакты из реквизитов ЦКР, когда они будут опубликованы.
      </p>
    </LegalPageShell>
  );
}
