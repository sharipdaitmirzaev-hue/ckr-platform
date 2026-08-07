export function mapAuthError(message?: string) {
  if (!message) return "Произошла ошибка. Попробуйте ещё раз.";

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

  return message;
}
