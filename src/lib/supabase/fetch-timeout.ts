/** Fetch с таймаутом — чтобы auth/middleware не висели бесконечно. */
export function createTimeoutFetch(timeoutMs: number = 10_000): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const parentSignal = init?.signal;
    if (parentSignal) {
      if (parentSignal.aborted) {
        clearTimeout(timer);
        controller.abort();
      } else {
        parentSignal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };
}
