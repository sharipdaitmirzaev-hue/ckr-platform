import { isByteStringError } from "../http/byte-string";

const GENERIC_AUTH_ERROR =
  "Не удалось выполнить действие. Попробуйте ещё раз или обратитесь в поддержку.";

export function mapAuthError(message?: string) {
  if (!message) return "Произошла ошибка. Попробуйте ещё раз.";

  if (isByteStringError(message)) {
    return "Не удалось сохранить данные регистрации. Проверьте имя и попробуйте ещё раз.";
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
  // Не показываем сырые TypeError / undici / stack-подобные сообщения.
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
