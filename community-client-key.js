(() => {
  const STORAGE_KEY = 'msclassic-quiz-client-key';
  const KEY_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;
  let memoryKey = '';

  function randomKey() {
    try {
      if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 32);
      }
    } catch (_) {}

    try {
      const bytes = new Uint8Array(24);
      globalThis.crypto?.getRandomValues(bytes);
      if (bytes.some(Boolean)) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
      }
    } catch (_) {}

    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`.slice(0, 32);
  }

  function getClientKey() {
    if (KEY_PATTERN.test(memoryKey)) return memoryKey;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (KEY_PATTERN.test(stored || '')) {
        memoryKey = stored;
        return stored;
      }
    } catch (_) {}

    const created = randomKey();
    memoryKey = created;
    try { localStorage.setItem(STORAGE_KEY, created); } catch (_) {}
    return created;
  }

  function isResultEndpoint(input) {
    try {
      const rawUrl = typeof input === 'string' ? input : input?.url;
      const statsUrl = window.STATS_API_URL;
      if (!rawUrl || !statsUrl) return false;
      const requestUrl = new URL(rawUrl, window.location.href);
      const targetUrl = new URL(statsUrl, window.location.href);
      return requestUrl.origin === targetUrl.origin && requestUrl.pathname.replace(/\/$/, '') === `${targetUrl.pathname.replace(/\/$/, '')}/result`;
    } catch (_) {
      return false;
    }
  }

  const previousFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (!isResultEndpoint(input)) return previousFetch(input, init);

    const requestHeaders = input instanceof Request ? input.headers : undefined;
    const headers = new Headers(requestHeaders || init?.headers || {});
    headers.set('X-Quiz-Client-Key', getClientKey());

    return previousFetch(input, { ...(init || {}), headers });
  };
})();
