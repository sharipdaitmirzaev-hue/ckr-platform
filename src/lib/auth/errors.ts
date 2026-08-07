import { isByteStringError } from "../http/byte-string";

const GENERIC_AUTH_ERROR =
  "Не удалось выполнить действие. Попробуйте ещё раз или обратитесь в поддержку.";

const ENV_KEY_ERROR =
  "Ошибка конфигурации сервера авторизации. Администратору: проверьте Supabase-ключи в /etc/ckr/ckr.env (без кириллицы) и перезапустите сервис.";

export function mapAuthError(message?: string) {
  if (!message) return "Произошла ошибка. Попробуйте ещё раз.";

  if (
    isByteStringError(message) ||
    /вне ByteString/i.test(message) ||
    /кириллица в ключе/i.test(message) ||
    /ANON_KEY|PUBLISHABLE_KEY/i.test(message)
  ) {
    // Частая причина на production: в apikey/Authorization попал символ >255
    // (битый ключ в env). Имя пользователя тут ни при чём.
    return ENV_KEY_ERROR;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (normalized.includes("user already registered")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Подтвердите email перед входом.";
  }
  if (normalized.includes("password")) {
    return "Пароль слишком короткий или не соответствует требованиям.";
  }
  if (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("failed to fetch")
  ) {
    return "Нет связи с сервером авторизации. Попробуйте позже.";
  }
  if (
    normalized.includes("typeerror") ||
    normalized.includes("cannot convert") ||
    normalized.includes("undici") ||
    normalized.includes("econnrefused") ||
    /at\s+\S+\s+\(/.test(message)
  ) {
    return GENERIC_AUTH_ERROR;
  }

  return message;
}
