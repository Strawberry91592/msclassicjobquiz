(() => {
  const statsUrl = () => String(window.STATS_API_URL || '').replace(/\/$/, '');
  const jobs = [
    ['fighter','Fighter','Warrior'],
    ['page','Page','Warrior'],
    ['spearman','Spearman','Warrior'],
    ['fp','F/P Wizard','Magician'],
    ['il','I/L Wizard','Magician'],
    ['cleric','Cleric','Magician'],
    ['hunter','Hunter','Bowman'],
    ['crossbow','Crossbowman','Bowman'],
    ['assassin','Assassin','Thief'],
    ['bandit','Bandit','Thief']
  ];

  const escapeHtml = value => String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');

  // The old opening-page totals were useful as a prototype, but the rankings
  // now live behind a dedicated control so the landing modal stays focused.
  document.getElementById('openingCommunity')?.remove();
  // project-enhancements.js still contains legacy opening-panel initialization
  // for compatibility with older markup. It runs its init on DOMContentLoaded,
  // so remove the legacy panel again after that initializer has run.
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('openingCommunity')?.remove();
  }, {once:true});

  const wrap = document.querySelector('.theme-switch-wrap');
  const themeToggle = document.getElementById('themeToggle');
  if (!wrap || !themeToggle || document.getElementById('communityToggle')) return;

  const toggle = document.createElement('button');
  toggle.id = 'communityToggle';
  toggle.className = 'theme-toggle community-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label','Open community rankings');
  toggle.setAttribute('aria-haspopup','dialog');
  toggle.setAttribute('aria-expanded','false');
  toggle.title = 'Open community rankings';
  toggle.innerHTML = '<span class="community-toggle-icon" aria-hidden="true">🏆</span><span>Rankings</span>';
  wrap.insertBefore(toggle, themeToggle);

  const modal = document.createElement('section');
  modal.id = 'communityRankingsModal';
  modal.className = 'community-ranking-modal';
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-labelledby','communityRankingsTitle');
  modal.hidden = true;
  modal.innerHTML = `
    <div class="community-rankings-dialog panel">
      <div class="community-rankings-titlebar">
        <div class="community-rankings-titlebar-left">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="bar-text">MAPLE WORLD RANKINGS</span>
        </div>
        <button class="community-close-btn" type="button" aria-label="Close community rankings" title="Close">×</button>
      </div>
      <div class="community-rankings-content">
        <div class="community-rankings-head">
          <div>
            <div class="community-rankings-kicker">COMMUNITY RESULTS</div>
            <h2 id="communityRankingsTitle">2nd Job rankings</h2>
            <p>These rankings do not show which job is objectively best. They show which jobs are most often matched to the playstyles of people who completed the quiz.</p>
          </div>
          <div class="community-live-status" aria-live="polite">
            <span class="community-live-dot" aria-hidden="true"></span>
            <span class="community-live-label">LIVE</span>
            <span class="community-updated" id="communityUpdated">Waiting for results…</span>
          </div>
        </div>
        <div id="communityRankingsStats" class="community-rankings-stats" aria-live="polite"></div>
        <div class="community-rankings-footnote">Updates automatically while this window is open. New submissions may take a short time to appear in the analytics totals.</div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const statsPanel = document.getElementById('communityRankingsStats');
  const updatedLabel = document.getElementById('communityUpdated');
  const closeBtn = modal.querySelector('.community-close-btn');
  const nativeFetch = window.fetch.bind(window);
  let pollTimer = null;
  let refreshInFlight = false;

  const style = document.createElement('style');
  style.textContent = `
    .theme-switch-wrap{display:flex;justify-content:flex-end;align-items:center;gap:8px}
    .community-toggle{min-width:0}
    .community-toggle-icon{font-size:.9em;line-height:1;display:inline-flex;align-items:center}
    .community-ranking-modal{position:fixed;inset:0;z-index:20;padding:20px;background:rgba(20,34,50,.58);overflow:auto}
    .community-rankings-dialog{width:min(960px,100%);margin:8vh auto 4vh;overflow:hidden;background:rgba(255,255,255,.98)}
    .community-rankings-titlebar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 14px;border-bottom:1px solid #c4d8e4;background:linear-gradient(180deg,#71a8d1,#598fb9);border-radius:14px 14px 0 0;color:#fff}
    .community-rankings-titlebar-left{display:flex;align-items:center;gap:6px}
    .community-rankings-titlebar .dot{width:7px;height:7px;border-radius:50%;background:#edf8ff}
    .community-rankings-titlebar .bar-text{margin-left:2px;font-size:11px;font-weight:900;letter-spacing:.1em}
    .community-close-btn{width:28px;height:28px;padding:0;border:1px solid rgba(255,255,255,.55);border-radius:8px;background:rgba(255,255,255,.13);color:#fff;font-size:21px;line-height:1;cursor:pointer}
    .community-close-btn:hover{background:rgba(255,255,255,.22)}
    .community-rankings-content{padding:clamp(20px,3vw,30px)}
    .community-rankings-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:15px}
    .community-rankings-kicker{color:#5e8a4d;font-size:10px;font-weight:900;letter-spacing:.11em}
    .community-rankings-head h2{margin:5px 0 5px;color:#315f85;font-size:clamp(27px,3.1vw,39px);line-height:1.08}
    .community-rankings-head p{margin:0;max-width:650px;color:#687983;line-height:1.5;font-size:13px}
    .community-live-status{display:grid;grid-template-columns:auto auto;align-items:center;justify-items:end;gap:2px 6px;min-width:145px;padding:8px 10px;border:1px solid #d6e4ed;border-radius:10px;background:#f7fbfd;text-align:right}
    .community-live-dot{grid-row:1 / span 2;width:8px;height:8px;border-radius:50%;background:#69ad59;box-shadow:0 0 0 3px rgba(105,173,89,.14)}
    .community-live-label{font-size:9px;font-weight:900;letter-spacing:.12em;color:#477f3d}
    .community-updated{font-size:9px;color:#7b8991}
    .community-rankings-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .community-rank-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid #dbe5ea;border-radius:11px;background:#fbfdff}
    .community-rank-row.community-rank-top{grid-column:1/-1;background:#f2f9ee;border-color:#bed8e5}
    .community-rank-number{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:#e9f4fb;color:#3f78a0;font-weight:900;font-size:12px}
    .community-rank-top .community-rank-number{background:#e8f3df;color:#4c8d42}
    .community-rank-job strong{display:block;color:#315e79;font-size:13px}
    .community-rank-job span{display:block;margin-top:2px;color:#85939a;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .community-rank-meter{height:7px;margin-top:7px;border-radius:999px;overflow:hidden;background:#eef3f6;border:1px solid #dbe5ea}
    .community-rank-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6aa6cb,#4f8d49)}
    .community-rank-total{text-align:right;min-width:62px}
    .community-rank-total b{display:block;color:#315e79;font-size:17px}
    .community-rank-total span{display:block;color:#85939a;font-size:9px}
    .community-rank-summary{grid-column:1/-1;padding-bottom:1px;color:#72808a;font-size:11px;font-weight:800}
    .community-rank-state{grid-column:1/-1;padding:24px 14px;border:1px dashed #c8d6df;border-radius:11px;text-align:center;color:#71818b;font-size:12px;line-height:1.55}
    .community-rank-state strong{display:block;color:#526d7f;font-size:13px;margin-bottom:3px}
    .community-rankings-footnote{margin-top:12px;color:#819099;font-size:10px;line-height:1.5;text-align:center}
    body.night-mode .community-ranking-modal{background:rgba(5,12,22,.72)}
    body.night-mode .community-rankings-dialog{background:#1b2a3d}
    body.night-mode .community-rankings-head h2{color:#79a9cf}
    body.night-mode .community-rankings-head p{color:#8ea2b1}
    body.night-mode .community-live-status{background:#203247;border-color:#3b5268}
    body.night-mode .community-live-label{color:#87ad78}
    body.night-mode .community-updated{color:#879ba9}
    body.night-mode .community-rank-row{background:#1e3044;border-color:#354d63}
    body.night-mode .community-rank-row.community-rank-top{background:#213a31;border-color:#49685d}
    body.night-mode .community-rank-number{background:#24394e;color:#a8c3d5}
    body.night-mode .community-rank-top .community-rank-number{background:#304a37;color:#9bc08d}
    body.night-mode .community-rank-job strong{color:#bdd0dd}
    body.night-mode .community-rank-job span,.night-mode .community-rank-total span{color:#8499a9}
    body.night-mode .community-rank-meter{background:#26394c;border-color:#40576c}
    body.night-mode .community-rank-total b{color:#c0d1dd}
    body.night-mode .community-rank-summary,.night-mode .community-rankings-footnote{color:#8a9da9}
    body.night-mode .community-rank-state{border-color:#41586a;color:#8fa2af}
    body.night-mode .community-rank-state strong{color:#b8cbd7}
    @media(max-width:650px){
      .community-ranking-modal{padding:10px}
      .community-rankings-dialog{margin:4vh auto 2vh}
      .community-rankings-content{padding:18px}
      .community-rankings-head{align-items:flex-start;flex-direction:column}
      .community-live-status{width:100%;justify-items:start;text-align:left}
      .community-rankings-stats{grid-template-columns:1fr}
      .community-rank-row.community-rank-top{grid-column:auto}
      .community-rank-summary{grid-column:auto}
    }
  `;
  document.head.appendChild(style);

  function setUpdated(text) {
    if (updatedLabel) updatedLabel.textContent = text;
  }

  function render(data) {
    if (!statsPanel) return;
    if (!data?.ok) {
      statsPanel.innerHTML = '<div class="community-rank-state"><strong>Community results are unavailable right now.</strong><span>The quiz still works normally. We will keep trying while this window is open.</span></div>';
      return;
    }

    const total = Number(data.total || 0);
    const rows = jobs
      .map(([key,name,family],sourceOrder) => ({key,name,family,sourceOrder,count:Number(data.totals?.[key] || 0)}))
      .sort((a,b) => b.count - a.count || a.sourceOrder - b.sourceOrder);

    const html = [`<div class="community-rank-summary">${total} completed quizzes counted</div>`];
    rows.forEach((row,index) => {
      const pct = total ? row.count / total * 100 : 0;
      html.push(`
        <article class="community-rank-row ${index === 0 ? 'community-rank-top' : ''}">
          <div class="community-rank-number">#${index + 1}</div>
          <div class="community-rank-job">
            <strong>${escapeHtml(row.name)}</strong>
            <span>${escapeHtml(row.family)}</span>
            <div class="community-rank-meter"><i style="width:${Math.min(100,pct)}%"></i></div>
          </div>
          <div class="community-rank-total"><b>${row.count}</b><span>${pct.toFixed(1)}%</span></div>
        </article>`);
    });
    statsPanel.innerHTML = html.join('');
  }

  async function refreshStats() {
    const url = statsUrl();
    if (!url || refreshInFlight) return;
    refreshInFlight = true;
    try {
      const response = await nativeFetch(`${url}/stats`, {cache:'no-store'});
      if (!response.ok) throw new Error('stats request failed');
      const data = await response.json();
      render(data);
      setUpdated(`Updated ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`);
    } catch (_) {
      render({ok:false});
      setUpdated('Retrying…');
    } finally {
      refreshInFlight = false;
    }
  }

  function startPolling() {
    refreshStats();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!modal.hidden && document.visibilityState === 'visible') refreshStats();
    }, 5000);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function openModal() {
    modal.hidden = false;
    toggle.setAttribute('aria-expanded','true');
    document.body.classList.add('community-modal-open');
    startPolling();
    closeBtn?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('community-modal-open');
    stopPolling();
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (modal.hidden) openModal();
    else closeModal();
  });
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
