import { LIA_DISCLAIMER } from "@/config/lia";
import type {
  LiaMessage,
  LiaMessageMetadata,
  LiaResultLink,
  LiaScenarioId,
  ProjectDraft,
  SolutionDraft,
} from "@/types/lia";

export type LiaProviderInput = {
  userMessage: string;
  scenario: LiaScenarioId | null;
  history: Pick<LiaMessage, "role" | "content" | "metadata">[];
};

export type LiaProviderOutput = {
  content: string;
  metadata: LiaMessageMetadata;
  results: LiaResultLink[];
  projectDraft: ProjectDraft | null;
  solutionDraft: SolutionDraft | null;
  provider: string;
};

export type LiaProvider = {
  id: string;
  generate: (input: LiaProviderInput) => Promise<LiaProviderOutput>;
};

/**
 * Абстракция провайдера ИИ.
 * Сейчас: mock (без ключа) или openai-compatible stub (если задан LIA_API_KEY).
 * Позже: OpenAI / внешняя / локальная модель через тот же контракт.
 */
export function getLiaProvider(): LiaProvider {
  const apiKey = process.env.LIA_API_KEY?.trim();
  const providerName = (process.env.LIA_PROVIDER || "mock").toLowerCase();

  if (!apiKey || providerName === "mock") {
    return mockLiaProvider;
  }

  // Ключ задан — пока безопасный stub: не уводим сырые данные во внешний API
  // до явной настройки LIA_PROVIDER=openai и серверной интеграции.
  if (providerName === "openai") {
    return createOpenAiCompatibleProvider(apiKey);
  }

  return mockLiaProvider;
}

function createOpenAiCompatibleProvider(apiKey: string): LiaProvider {
  return {
    id: "openai-compatible",
    async generate(input) {
      // На Этапе 9 не делаем сетевой вызов по умолчанию без явного base URL.
      // Если base не задан — безопасный fallback на mock-логику.
      const baseUrl = process.env.LIA_API_BASE_URL?.trim();
      if (!baseUrl) {
        const mock = await mockLiaProvider.generate(input);
        return {
          ...mock,
          provider: "openai-compatible-fallback-mock",
          metadata: {
            ...mock.metadata,
            note: "LIA_API_BASE_URL не задан — использован mock-ответ.",
            hasApiKey: Boolean(apiKey),
          },
        };
      }

      // Минимальный совместимый вызов; в историю не передаём приватные документы.
      const messages = [
        {
          role: "system",
          content:
            "Ты Лия — ИИ-навигатор платформы ЦКР. Давай предварительные рекомендации. Не давай юридических/финансовых гарантий. Отвечай по-русски кратко.",
        },
        ...input.history
          .filter((item) => item.role === "user" || item.role === "assistant")
          .slice(-12)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 1500),
          })),
        { role: "user", content: input.userMessage.slice(0, 1500) },
      ];

      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.LIA_MODEL || "gpt-4o-mini",
            messages,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const mock = await mockLiaProvider.generate(input);
          return {
            ...mock,
            provider: "openai-compatible-error-fallback",
            metadata: {
              ...mock.metadata,
              providerError: `HTTP ${response.status}`,
            },
          };
        }

        const json = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content =
          json.choices?.[0]?.message?.content?.trim() ||
          "Не удалось получить ответ модели. Попробуйте уточнить запрос.";

        return {
          content: `${content}\n\n_${LIA_DISCLAIMER}_`,
          metadata: {
            disclaimer: LIA_DISCLAIMER,
            scenario: input.scenario,
          },
          results: [],
          projectDraft: null,
          solutionDraft: null,
          provider: "openai-compatible",
        };
      } catch {
        const mock = await mockLiaProvider.generate(input);
        return {
          ...mock,
          provider: "openai-compatible-network-fallback",
        };
      }
    },
  };
}

/** Экспортируем mock для движка сценариев (поиск/черновики собираются снаружи). */
export const mockLiaProvider: LiaProvider = {
  id: "mock",
  async generate(input) {
    return {
      content:
        "Я Лия, навигатор ЦКР. Уточните задачу или выберите быстрый сценарий — подберу объекты платформы и следующие шаги.",
      metadata: {
        disclaimer: LIA_DISCLAIMER,
        scenario: input.scenario,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      provider: "mock",
    };
  },
};
