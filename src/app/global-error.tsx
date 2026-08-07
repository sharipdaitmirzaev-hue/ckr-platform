"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#071522",
          color: "#F2F2F2",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <p style={{ color: "#C9A227", letterSpacing: "0.16em", fontSize: 12 }}>
            ОШИБКА
          </p>
          <h1 style={{ fontSize: 28, marginTop: 12 }}>Сбой приложения</h1>
          <p style={{ color: "#BFC4CA", marginTop: 12, lineHeight: 1.5 }}>
            Не удалось загрузить ЦКР. Обновите страницу или попробуйте позже.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#C9A227",
              color: "#071522",
              border: 0,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        </div>
      </body>
    </html>
  );
}
