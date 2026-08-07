import { LIA_DISCLAIMER } from "@/config/lia";
import type {
  LiaCatalogDraft,
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
  catalogDraft: LiaCatalogDraft | null;
  provider: string;
};

export type LiaProvider = {
  id: string;
  generate: (input: LiaProviderInput) => Promise<LiaProviderOutput>;
};

const UNAVAILABLE_MESSAGE =
  "Лия временно недоступна. Сервис ИИ не ответил — попробуйте позже. Каталоги проектов, возможностей и экспертов доступны без ИИ.";

function unavailableOutput(
  reason: string,
  scenario: LiaScenarioId | null,
): LiaProviderOutput {
  return {
    content: UNAVAILABLE_MESSAGE,
    metadata: {
      disclaimer: LIA_DISCLAIMER,
      scenario,
      unavailable: true,
      providerError: reason,
    },
    results: [],
    projectDraft: null,
    solutionDraft: null,
    catalogDraft: null,
    provider: "unavailable",
  };
}

/**
 * Абстракция провайдера ИИ.
 * mock — только если LIA_PROVIDER=mock или нет ключа в non-strict режиме.
 * В production при настроенном openai mock не подменяется «тихо» при сбое —
 * возвращается user-friendly unavailable.
 * Secrets (LIA_API_KEY) никогда не отдаются клиенту.
 */
export function getLiaProvider(): LiaProvider {
  const apiKey = process.env.LIA_API_KEY?.trim();
  const providerName = (process.env.LIA_PROVIDER || "mock").toLowerCase();
  const isProd = process.env.NODE_ENV === "production";

  if (providerName === "mock") {
    return mockLiaProvider;
  }

  if (!apiKey) {
    if (isProd && providerName !== "mock") {
      return {
        id: "misconfigured",
        async generate(input) {
          return unavailableOutput("LIA_API_KEY не задан", input.scenario);
        },
      };
    }
    return mockLiaProvider;
  }

  if (providerName === "openai") {
    return createOpenAiCompatibleProvider(apiKey);
  }

  if (isProd) {
    return {
      id: "unknown-provider",
      async generate(input) {
        return unavailableOutput(
          `Неизвестный LIA_PROVIDER: ${providerName}`,
          input.scenario,
        );
      },
    };
  }

  return mockLiaProvider;
}

function createOpenAiCompatibleProvider(apiKey: string): LiaProvider {
  return {
    id: "openai-compatible",
    async generate(input) {
      const baseUrl = process.env.LIA_API_BASE_URL?.trim();
      if (!baseUrl) {
        return unavailableOutput("LIA_API_BASE_URL не задан", input.scenario);
      }

      const messages = [
        {
          role: "system",
          content:
            "Ты Лия — ИИ-навигатор платформы ЦКР. Давай предварительные рекомендации. Не создавай заявки и не меняй данные. Не давай юридических/финансовых гарантий. Отвечай по-русски кратко.",
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
        const response = await fetch(
          `${baseUrl.replace(/\/$/, "")}/chat/completions`,
          {
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
          },
        );

        if (!response.ok) {
          return unavailableOutput(`HTTP ${response.status}`, input.scenario);
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
          catalogDraft: null,
          provider: "openai-compatible",
        };
      } catch {
        return unavailableOutput("network_error", input.scenario);
      }
    },
  };
}

export const mockLiaProvider: LiaProvider = {
  id: "mock",
  async generate(input) {
    return {
      content:
        "Я Лия, навигатор ЦКР. Уточните задачу или выберите быстрый сценарий — подберу объекты платформы и следующие шаги. Для анализа проекта откройте карточку и нажмите «Анализ Лией».",
      metadata: {
        disclaimer: LIA_DISCLAIMER,
        scenario: input.scenario,
      },
      results: [],
      projectDraft: null,
      solutionDraft: null,
      catalogDraft: null,
      provider: "mock",
    };
  },
};
