/**
 * Регрессия: кириллическое имя не должно попадать в HTTP Headers / Cookie как raw Unicode.
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

function toByteStringSafe(value) {
  if (isByteString(value)) return value;
  return encodeURIComponent(value);
}

function isByteStringError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ByteString/i.test(message) || /greater than 255/i.test(message);
}

function mapAuthError(message) {
  if (!message) return "Произошла ошибка. Попробуйте ещё раз.";
  if (isByteStringError(message)) {
    return "Не удалось сохранить данные регистрации. Проверьте имя и попробуйте ещё раз.";
  }
  return message;
}

test("Cyrillic Шарип is not a ByteString; index 7 Soft Sign reproduces undici error", () => {
  assert.equal(isByteString("Шарип"), false);
  assert.equal("xxxxxxxь".charCodeAt(7), 1100);
  assert.throws(
    () => new Headers({ Authorization: `Bearer ${"ьtoken"}` }),
    (error) => {
      assert.match(
        String(error.message),
        /character at index 7 has a value of 1100/,
      );
      return isByteStringError(error);
    },
  );
});

test("JSON body may carry Cyrillic full_name; token-only cookie must stay ASCII", () => {
  const fullName = "Шарип";
  const body = JSON.stringify({
    email: "sharip@example.com",
    data: { full_name: fullName },
  });
  assert.equal(JSON.parse(body).data.full_name, "Шарип");

  const tokenOnlySession = JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
    refresh_token: "refresh-token-value",
    expires_at: 1893456000,
    token_type: "bearer",
  });
  assert.equal(isByteString(tokenOnlySession), true);
  assert.doesNotThrow(
    () => new Headers({ "Set-Cookie": `sb-auth-token=${tokenOnlySession}` }),
  );

  // user-and-tokens raw JSON would break Set-Cookie
  const withUser = JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
    user: { user_metadata: { full_name: "Шарип" } },
  });
  assert.equal(isByteString(withUser), false);
  assert.throws(
    () => new Headers({ "Set-Cookie": `sb-auth-token=${withUser}` }),
    (error) => isByteStringError(error),
  );
  assert.doesNotThrow(
    () =>
      new Headers({
        "Set-Cookie": `sb-auth-token=${toByteStringSafe(withUser)}`,
      }),
  );
});

test("mapAuthError hides ByteString details from end users", () => {
  const mapped = mapAuthError(
    "Cannot convert argument to a ByteString because the character at index 7 has a value of 1100 which is greater than 255.",
  );
  assert.equal(mapped.includes("ByteString"), false);
  assert.equal(mapped.includes("1100"), false);
  assert.match(mapped, /регистрации|имя|ещё раз/i);
});
