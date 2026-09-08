(() => {
  const STORAGE_KEY = 'msclassic-quiz-client-key';
  const KEY_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;
  let memoryKey = '';
  function randomKey() {
    try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 32); } catch (_) {}
    try { const bytes = new Uint8Array(24); globalThis.crypto?.getRandomValues(bytes); if (bytes.some(Boolean)) return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 32); } catch (_) {}
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`.slice(0, 32);
  }
  function getClientKey() {
    if (KEY_PATTERN.test(memoryKey)) return memoryKey;
    try { const stored = localStorage.getItem(STORAGE_KEY); if (KEY_PATTERN.test(stored || '')) { memoryKey = stored; return stored; } } catch (_) {}
    const created = randomKey(); memoryKey = created; try { localStorage.setItem(STORAGE_KEY, created); } catch (_) {} return created;
  }
  function isResultEndpoint(input) {
    try {
      const rawUrl = typeof input === 'string' ? input : input?.url;
      const statsUrl = window.STATS_API_URL;
      if (!rawUrl || !statsUrl) return false;
      const requestUrl = new URL(rawUrl, window.location.href);
      const targetUrl = new URL(statsUrl, window.location.href);
      return requestUrl.origin === targetUrl.origin && requestUrl.pathname.replace(/\/$/, '') === `${targetUrl.pathname.replace(/\/$/, '')}/result`;
    } catch (_) { return false; }
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

// Project expert class profiles onto the traits the 20 answer vectors can actually express.
// This is a deterministic model calibration, not a popularity prior: the expert profiles
// remain the source, while the answer space determines which parts are observable.
(() => {
  const classes = window.CLASS_DATA || {};
  const questions = window.QUIZ_QUESTIONS || [];
  const vectors = window.QUIZ_OPTION_VECTORS || {};
  const dimensions = Object.keys(window.QUIZ_DIMS || {});
  const dimWeights = window.QUIZ_DIM_WEIGHTS || {};
  if (!questions.length || !dimensions.length) return;
  const vectorFor = (id, letter) => {
    const sparse = vectors[id]?.[letter.charCodeAt(0) - 65] || {};
    return Object.fromEntries(dimensions.map(dim => [dim, typeof sparse[dim] === 'number' ? sparse[dim] : 0.5]));
  };
  const distance = (vector, profile) => {
    let sum = 0; let total = 0;
    dimensions.forEach(dim => {
      const active = Math.abs((vector[dim] ?? 0.5) - 0.5) * 2;
      if (active < 0.08) return;
      const weight = Number(dimWeights[dim] ?? 1) * active;
      sum += Math.abs((vector[dim] ?? 0.5) - (profile[dim] ?? 0.5)) * weight;
      total += weight;
    });
    return total ? sum / total : 0.5;
  };
  for (const cls of Object.values(classes)) {
    const source = cls.dims || {};
    const aggregate = Object.fromEntries(dimensions.map(dim => [dim, 0.5]));
    const evidence = Object.fromEntries(dimensions.map(dim => [dim, 0]));
    for (const question of questions) {
      let best = null;
      for (const [letter] of question.options) {
        const candidate = vectorFor(question.id, letter);
        const d = distance(candidate, source);
        if (!best || d < best.d) best = {candidate, d};
      }
      if (!best) continue;
      dimensions.forEach(dim => {
        const value = best.candidate[dim];
        const signal = Math.abs(value - 0.5) * 2;
        if (signal < 0.08) return;
        aggregate[dim] = ((aggregate[dim] * evidence[dim]) + value * signal) / (evidence[dim] + signal);
        evidence[dim] += signal;
      });
    }
    dimensions.forEach(dim => {
      const original = Number(source[dim] ?? 0.5);
      const projected = evidence[dim] ? aggregate[dim] : 0.5;
      cls.dims[dim] = Math.max(0.05, Math.min(0.95, 0.35 * original + 0.65 * projected));
    });
  }
})();
