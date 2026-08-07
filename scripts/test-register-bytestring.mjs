/**
 * Регрессия ByteString при регистрации с кириллическим именем.
 *
 * Реальная причина production-ошибки
 *   "character at index 7 has a value of 1100"
 * — не имя «Шарип», а битый apikey/Authorization (ь на index 7), например
 *   eyJhbGcь... вместо eyJhbGci...
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import test from "node:test";

function isByteString(value) {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) return false;
  }
  return true;
}

function firstNonByteStringIndex(value) {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 255) return i;
  }
  return -1;
}

function isByteStringError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ByteString/i.test(message) || /greater than 255/i.test(message);
}

function mapAuthError(message) {
  if (!message) return "Произошла ошибка. Попробуйте ещё раз.";
  if (
    isByteStringError(message) ||
    /вне ByteString/i.test(message) ||
    /кириллица в ключе/i.test(message) ||
    /ANON_KEY|PUBLISHABLE_KEY/i.test(message)
  ) {
    return "Ошибка конфигурации сервера авторизации. Администратору: проверьте Supabase-ключи в /etc/ckr/ckr.env (без кириллицы) и перезапустите сервис.";
  }
  return message;
}

function buildHeaderSafeHeaders(init) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(init)) {
    if (!isByteString(value)) {
      const idx = firstNonByteStringIndex(value);
      throw new Error(
        `Проверьте NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY в /etc/ckr/ckr.env (кириллица в ключе недопустима). ByteString violation at index ${idx}.`,
      );
    }
    headers.set(key, value);
  }
  return headers;
}

/** Имитация signup: body с именем, headers только с ключом. */
function simulateSignUp({ fullName, anonKey }) {
  const body = JSON.stringify({
    email: "test@example.com",
    password: "TestPass123!",
    // full_name больше НЕ отправляем в user_metadata
  });
  assert.equal(body.includes(fullName), false);

  const headers = buildHeaderSafeHeaders({
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json;charset=UTF-8",
  });

  // tokens-only cookie — без user object / full_name
  const cookieValue = JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
    refresh_token: "refresh-token-value",
    token_type: "bearer",
    expires_at: 1893456000,
  });
  assert.equal(isByteString(cookieValue), true);
  assert.doesNotThrow(
    () => new Headers({ "Set-Cookie": `sb-auth-token=${cookieValue}` }),
  );

  // Имя пишется в profiles (UTF-8 JSON body), не в cookie/header
  const profileUpdate = JSON.stringify({ full_name: fullName });
  assert.equal(JSON.parse(profileUpdate).full_name, fullName);

  return { headers, body, cookieValue, profileUpdate };
}

test("production error signature: apikey with ь at index 7", () => {
  const badKey = "eyJhbGcьOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig";
  assert.equal(badKey.charCodeAt(7), 1100);
  assert.throws(
    () => new Headers({ apikey: badKey }),
    (error) => {
      assert.match(
        String(error.message),
        /character at index 7 has a value of 1100/,
      );
      return isByteStringError(error);
    },
  );
  assert.throws(
    () => buildHeaderSafeHeaders({ apikey: badKey }),
    (error) => /ANON_KEY|кириллица в ключе/i.test(String(error.message)),
  );
});

test("registration name Шарип + safe anon key → signup headers/cookie OK", () => {
  const goodKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sig";
  assert.equal(isByteString(goodKey), true);
  assert.equal(goodKey[7], "i");

  const result = simulateSignUp({
    fullName: "Шарип",
    anonKey: goodKey,
  });

  assert.equal(result.headers.get("apikey"), goodKey);
  assert.equal(JSON.parse(result.profileUpdate).full_name, "Шарип");
  assert.equal(isByteString(result.cookieValue), true);
  // cookie не содержит имени
  assert.equal(result.cookieValue.includes("Шарип"), false);
  assert.equal(result.cookieValue.includes("full_name"), false);
});

test("mapAuthError never shows raw ByteString to the user", () => {
  const mapped = mapAuthError(
    "Cannot convert argument to a ByteString because the character at index 7 has a value of 1100 which is greater than 255.",
  );
  assert.equal(mapped.includes("ByteString"), false);
  assert.equal(mapped.includes("1100"), false);
  assert.match(mapped, /конфигурации|ключа|ckr\.env/i);
});

test("user-and-tokens raw session with Cyrillic would break Set-Cookie via undici Headers without encodeURIComponent", () => {
  // Документируем опасный путь (мы его больше не используем: tokens-only).
  const withUser = JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
    user: { user_metadata: { full_name: "Шарип" } },
  });
  assert.equal(isByteString(withUser), false);
  assert.throws(
    () => new Headers({ "x-raw-cookie": withUser }),
    (error) => isByteStringError(error),
  );
});
