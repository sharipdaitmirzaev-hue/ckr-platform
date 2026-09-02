const PLACEHOLDER_RE =
  /example\.com|example\.org|\.example(?:[./:]|$)|localhost|127\.0\.0\.1|\bfixture\b|e2e_ckr|\bsmoke\b/i;

export function isPlaceholderSource(input: {
  url?: string | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  id?: string | null;
}): boolean {
  const blob = [input.url, input.sourceType, input.sourceLabel, input.id]
    .filter(Boolean)
    .join(" ");
  return PLACEHOLDER_RE.test(blob);
}

export function isGenericFinancingPage(input: {
  url?: string | null;
  title?: string | null;
}): boolean {
  const blob = `${input.url || ""} ${input.title || ""}`.toLowerCase();
  const bank =
    /sberbank|sber\.ru|vtb\.ru|alfabank|tinkoff|банки\.ру|banki\.ru|\bcredits?\b|\bкредит/;
  const confirmed = /оферта|одобрен|договор лизинг|ключевая ставка сделки/;
  return bank.test(blob) && !confirmed.test(blob);
}
