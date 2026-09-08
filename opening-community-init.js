(() => {
  const url = String(window.STATS_API_URL || '').replace(/\/$/, '');
  const panel = document.getElementById('openingCommunityStats');
  if (!url || !panel) return;

  const jobs = [
    ['fighter','Fighter','Warrior'],['page','Page','Warrior'],['spearman','Spearman','Warrior'],
    ['fp','F/P Wizard','Magician'],['il','I/L Wizard','Magician'],['cleric','Cleric','Magician'],
    ['hunter','Hunter','Bowman'],['crossbow','Crossbowman','Bowman'],['assassin','Assassin','Thief'],['bandit','Bandit','Thief']
  ];

  const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  panel.innerHTML = '<div class="opening-stats-state">Loading the latest Maple World results…</div>';

  fetch(`${url}/stats`, {cache:'no-store'})
    .then(async response => {
      if (!response.ok) throw new Error('stats request failed');
      const data = await response.json();
      if (!data?.ok) throw new Error('stats unavailable');
      return data;
    })
    .then(data => {
      const total = Number(data.total || 0);
      const rows = jobs.map(([key,name,family], i) => {
        const count = Number(data.totals?.[key] || 0);
        const pct = total ? count / total * 100 : 0;
        return `<div class="opening-stats-row"><div class="opening-stats-rank">#${i+1}</div><div class="opening-stats-job"><strong>${esc(name)}</strong><span>${family}</span><div class="opening-stats-meter"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="opening-stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
      }).join('');
      panel.innerHTML = `<div class="opening-stats-meta">${total} completed quizzes counted</div>${rows}`;
    })
    .catch(() => {
      panel.innerHTML = '<div class="opening-stats-state"><strong>Community results are unavailable right now.</strong><span>You can still take the quiz normally.</span></div>';
    });
})();
