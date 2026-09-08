(() => {
  const JOBS = ['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit'];
  let handled = false;

  const escapeHtml = value => String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  function statsUrl() {
    return String(window.STATS_API_URL || '').replace(/\/$/, '');
  }

  async function loadBeginnerStats() {
    const panel = document.getElementById('sharedStats');
    const meta = document.getElementById('sharedStatsMeta');
    if (!panel || !meta) return;

    const url = statsUrl();
    if (!url) {
      meta.textContent = 'Shared counts are not connected.';
      panel.innerHTML = '<div class="stats-empty">The quiz result is still valid. Shared community counts are unavailable because the counter is not connected.</div>';
      return;
    }

    try {
      const response = await fetch(`${url}/stats`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`stats request returned ${response.status}`);
      const data = await response.json();
      if (!data?.ok) throw new Error('stats unavailable');

      const classes = window.CLASS_DATA || {};
      const total = Number(data.total || 0);
      const sorted = JOBS.slice().sort((a,b) => (Number(data.totals?.[b] || 0) - Number(data.totals?.[a] || 0)) || JOBS.indexOf(a) - JOBS.indexOf(b));
      meta.textContent = `${total} completed quizzes counted`;

      panel.innerHTML = '<div class="stats-note">These are aggregate quiz completions. No quiz answers or personal details are stored.</div>' + sorted.map(key => {
        const count = Number(data.totals?.[key] || 0);
        const pct = total ? (count / total * 100) : 0;
        const cls = classes[key] || {};
        return `<div class="stats-row"><div class="stats-rank">${sorted.indexOf(key) + 1}</div><div class="stats-job"><strong>${escapeHtml(cls.name || key)}</strong><span>${escapeHtml(cls.family || '')}</span><div class="stats-meter"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
      }).join('');
    } catch (_) {
      meta.textContent = 'Shared results unavailable right now';
      panel.innerHTML = '<div class="stats-empty">Shared results are not available right now. Your Beginner result is unaffected.</div>';
    }
  }

  function check() {
    const results = document.getElementById('results');
    const winner = document.getElementById('winnerName');
    if (!results || !winner) return;

    const isBeginner = !results.classList.contains('hidden') && winner.textContent.trim() === 'Beginner';
    if (!isBeginner) {
      handled = false;
      return;
    }
    if (handled) return;
    handled = true;
    loadBeginnerStats();
  }

  function init() {
    const results = document.getElementById('results');
    if (!results) return;
    new MutationObserver(check).observe(results, { childList: true, subtree: true, attributes: true, characterData: true });
    check();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
