import { ContactStartedTracker } from "@/components/analytics/contact-started-tracker";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CKR_CONTACTS } from "@/config/ckr-website";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/features/website/components/contact-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакты",
  description: CKR_CONTACTS.description,
  openGraph: {
    title: `Контакты · ${siteConfig.name}`,
    description: CKR_CONTACTS.description,
    url: "/contacts",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <>
      <ContactStartedTracker />
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Контакты</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {CKR_CONTACTS.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {CKR_CONTACTS.description}
          </p>
          <p className="mt-4 text-sm text-muted">
            Email:{" "}
            <a
              href={`mailto:${CKR_CONTACTS.email}`}
              className="text-accent hover:underline"
            >
              {CKR_CONTACTS.email}
            </a>
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Card variant="surface" className="p-6 sm:p-8">
            <SectionHeading
              eyebrow="Форма"
              title="Обращение в ЦКР"
              description="Сообщение сохраняется для команды платформы. Лия не отправляет письма автоматически."
            />
            <div className="mt-8">
              <ContactForm />
            </div>
          </Card>

          <div className="space-y-8">
            <div>
              <SectionHeading eyebrow="Ссылки" title="Быстрые переходы" />
              <ul className="mt-6 space-y-3">
                {CKR_CONTACTS.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-accent hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border pt-8">
              <p className="text-sm text-muted">
                Нужен быстрый разбор задачи? Начните с аудита Лии — без длинных
                форм.
              </p>
              <div className="mt-4">
                <ButtonLink href="/lia?scenario=business_audit">
                  Расскажите о вашей задаче
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
