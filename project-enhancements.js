(() => {
  // Approved question revisions. These mutate the existing objects so the current
  // app.js continues using the same question/vector references without a rewrite.
  const approvedQuestions = {
    9: {
      text: 'You can improve only one part of your character right now. Which sounds best?',
      options: [
        ['A', 'A skill that gives me a strong result when I use it.'],
        ['B', 'A better way to handle several targets.'],
        ['C', 'An improvement that makes mistakes hurt less.'],
        ['D', 'An improvement that makes several parts of the character work together.']
      ]
    },
    10: {
      text: 'You are fighting monsters that are giving you trouble. What would you rather have?',
      options: [
        ['A', 'A stronger attack that can bring them down faster.'],
        ['B', 'A way to attack them without getting too close.'],
        ['C', 'A skill that works especially well against those monsters.'],
        ['D', 'A way to recover and keep fighting without using as many potions.']
      ]
    },
    15: {
      text: 'You are fighting monsters that take a while to defeat. What would help you most?',
      options: [
        ['A', 'A stronger attack against one monster.'],
        ['B', 'A way to hit several monsters at once.'],
        ['C', 'A way to attack safely from farther away.'],
        ['D', 'A way to move into attack range more quickly.']
      ]
    },
    26: {
      text: 'You find a map where the monsters give good EXP. What would make you want to keep training there?',
      options: [
        ['A', 'The monsters are quick to defeat.'],
        ['B', 'I can attack without moving around much.'],
        ['C', 'I can keep my potion use low.'],
        ['D', 'The monsters are easy to hit in groups.']
      ]
    },
    32: {
      text: 'A training map starts getting crowded with monsters. What would you prefer to do?',
      options: [
        ['A', 'Keep attacking the monster I am already focused on.'],
        ['B', 'Hit several monsters around me at once.'],
        ['C', 'Move away and attack them from a safer distance.'],
        ['D', 'Move through the group and attack from a better position.']
      ]
    },
    35: {
      text: 'You enter a map with monsters spread across several platforms. What matters most?',
      options: [
        ['A', 'Being able to attack from a long distance.'],
        ['B', 'Being able to reach the monsters quickly.'],
        ['C', 'Having attacks that can cover several monsters.'],
        ['D', 'Having strong attacks when a monster is right in front of me.']
      ]
    },
    43: {
      text: 'You are fighting a monster that is stronger than the ones you normally train on. What do you do first?',
      options: [
        ['A', 'Use my strongest attack and try to finish it quickly.'],
        ['B', 'Keep my distance and attack safely.'],
        ['C', 'Look for a way to hit it while avoiding its attacks.'],
        ['D', 'Use attacks that can also deal with nearby monsters.']
      ]
    },
    46: {
      text: "You have enough SP for a skill you've been waiting to improve. What would you rather do?",
      options: [
        ['A', 'Put the SP into the skill I use most often.'],
        ['B', 'Save the SP for a skill I will need later.'],
        ['C', 'Improve a skill that makes another part of my build work better.'],
        ['D', 'Spend the SP on whichever upgrade gives me the biggest immediate improvement.']
      ]
    },
    47: {
      options: [
        ['A', 'I like changing my approach around them.'],
        ['B', 'I would rather my main attack stay good regardless.'],
        ['C', 'I like it when grouping monsters together leads to a big payoff.'],
        ['D', 'I would rather have several attacks that cover different groups.']
      ]
    }
  };

  Object.entries(approvedQuestions).forEach(([id, revision]) => {
    const q = window.QUIZ_QUESTIONS?.find(item => String(item.id) === String(id));
    if (!q) return;
    if (revision.text) q.text = revision.text;
    if (revision.options) q.options = revision.options;
  });

  // Re-map the vectors for the rewritten questions so their new wording is what
  // the scorer measures. Q9-A and Q47-C are wording-only changes.
  const revisedVectors = {
    9: [
      { payoff: 0.9, single: 0.82, consistency: 0.78 },
      { aoe: 0.96 },
      { risk: 0.16, utility: 0.76 },
      { versatility: 0.9, setup: 0.74 }
    ],
    10: [
      { single: 0.96, payoff: 0.84 },
      { range: 0.96, risk: 0.24, consistency: 0.72 },
      { matchup: 0.96, special: 0.9, element: 0.88 },
      { resource: 0.94, economy: 0.78, consistency: 0.84 }
    ],
    15: [
      { single: 0.96, payoff: 0.82 },
      { aoe: 0.96 },
      { range: 0.96, position: 0.72 },
      { mobility: 0.96, position: 0.74 }
    ],
    26: [
      { single: 0.9, payoff: 0.82, consistency: 0.8 },
      { position: 0.92, consistency: 0.72, attention: 0.62 },
      { resource: 0.92, economy: 0.78 },
      { aoe: 0.92, setup: 0.76 }
    ],
    32: [
      { single: 0.94, consistency: 0.8 },
      { aoe: 0.96 },
      { range: 0.94, risk: 0.22, position: 0.82 },
      { mobility: 0.92, position: 0.94, attention: 0.72 }
    ],
    35: [
      { range: 0.98, position: 0.84 },
      { mobility: 0.96 },
      { aoe: 0.96 },
      { single: 0.96, close: 0.88 }
    ],
    43: [
      { single: 0.96, payoff: 0.84 },
      { range: 0.94, risk: 0.22, position: 0.7 },
      { risk: 0.15, position: 0.92, attention: 0.9 },
      { aoe: 0.94, position: 0.6 }
    ],
    46: [
      { consistency: 0.82, attention: 0.76 },
      { setup: 0.86, payoff: 0.72 },
      { versatility: 0.92, setup: 0.76 },
      { payoff: 0.94, consistency: 0.74 }
    ]
  };
  Object.entries(revisedVectors).forEach(([id, vectors]) => {
    if (window.QUIZ_OPTION_VECTORS) window.QUIZ_OPTION_VECTORS[id] = vectors;
  });

  // Full 48-question weight review was completed against the final wording.
  // Changes are deliberately modest and limited to questions whose new wording
  // materially changed their signal or whose old weight was overly influential.
  const reviewedWeights = {
    9: 1.00,
    10: 1.00,
    15: 1.02,
    26: 0.90,
    32: 0.96,
    35: 0.94,
    43: 0.88,
    46: 0.74
  };
  Object.entries(reviewedWeights).forEach(([id, weight]) => {
    if (window.QUIZ_QUESTION_WEIGHTS) window.QUIZ_QUESTION_WEIGHTS[id] = weight;
  });

  const JOB_GUIDES = {
    Fighter: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/warrior-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/fighter-class-guide']
    ],
    Page: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/warrior-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/page-class-guide']
    ],
    Spearman: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/warrior-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/spearman-class-guide']
    ],
    'F/P Wizard': [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/magician-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/fp-wizard-class-guide']
    ],
    'I/L Wizard': [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/magician-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/il-wizard-class-guide']
    ],
    Cleric: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/magician-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/cleric-class-guide']
    ],
    Hunter: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/hunter-class-guide']
    ],
    Crossbowman: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/crossbowman-class-guide']
    ],
    Assassin: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/thief-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/assassin-class-guide']
    ],
    Bandit: [
      ['Lv. 1–30', 'https://meowdb.com/msclassic/guides/thief-class-guide'],
      ['Lv. 30–70', 'https://meowdb.com/msclassic/guides/bandit-class-guide']
    ]
  };

  const escapeHtml = value => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  function addGuideLinks() {
    document.querySelectorAll('.job-match-card').forEach(card => {
      if (card.querySelector('.job-match-guides')) return;
      const title = card.querySelector('.job-match-title h4');
      const body = card.querySelector('.job-match-body');
      if (!title || !body) return;
      const links = JOB_GUIDES[title.textContent.trim()];
      if (!links) return;
      const guide = document.createElement('div');
      guide.className = 'job-match-guides';
      guide.innerHTML = `<span>MEOWDB GUIDES</span>${links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join('')}`;
      body.appendChild(guide);
    });
  }

  const STATS_URL = () => String(window.STATS_API_URL || '').replace(/\/$/, '');
  const JOB_ORDER = ['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit'];

  function statsRows(data) {
    const totals = data?.totals || {};
    const total = Number(data?.total || 0);
    return JOB_ORDER.map((key, index) => {
      const cls = window.CLASS_DATA?.[key];
      const count = Number(totals[key] || 0);
      const pct = total ? count / total * 100 : 0;
      return `<div class="opening-stats-row"><div class="opening-stats-rank">${index + 1}</div><div class="opening-stats-job"><strong>${escapeHtml(cls?.name || key)}</strong><span>${escapeHtml(cls?.family || '')}</span><div class="opening-stats-meter"><i style="width:${Math.min(100, pct)}%"></i></div></div><div class="opening-stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
    }).join('');
  }

  function renderOpeningStats(panel, status, data = null) {
    if (status === 'loading') {
      panel.innerHTML = '<div class="opening-stats-state">Loading the latest Maple World results…</div>';
      return;
    }
    if (status === 'error') {
      panel.innerHTML = '<div class="opening-stats-state"><strong>Community results are unavailable right now.</strong><span>You can still take the quiz normally.</span></div>';
      return;
    }
    const total = Number(data?.total || 0);
    panel.innerHTML = `<div class="opening-stats-meta">${total} completed quizzes counted</div>${statsRows(data)}`;
  }

  async function fetchStats() {
    const url = STATS_URL();
    if (!url) throw new Error('stats disconnected');
    const response = await fetch(`${url}/stats`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`stats ${response.status}`);
    const data = await response.json();
    if (!data?.ok) throw new Error('stats unavailable');
    return data;
  }

  async function loadOpeningStats() {
    const panel = document.getElementById('openingCommunityStats');
    if (!panel) return;
    renderOpeningStats(panel, 'loading');
    try {
      const data = await fetchStats();
      renderOpeningStats(panel, 'ready', data);
    } catch (_) {
      renderOpeningStats(panel, 'error');
    }
  }

  function ensureOpeningPanel() {
    const modalContent = document.querySelector('#modeModal .mode-content');
    if (!modalContent || document.getElementById('openingCommunity')) return;
    const note = modalContent.querySelector('.modal-note');
    const section = document.createElement('section');
    section.id = 'openingCommunity';
    section.className = 'opening-community';
    section.innerHTML = `
      <div class="opening-community-head">
        <div><div class="opening-community-kicker">MAPLE WORLD RESULTS</div><h3>Community Job Totals</h3><p>See the current result totals without taking the quiz.</p></div>
        <span class="opening-community-mark">10 CURRENT 2ND JOBS</span>
      </div>
      <div id="openingCommunityStats" class="opening-community-stats"></div>`;
    if (note) note.insertAdjacentElement('afterend', section);
    else modalContent.appendChild(section);
    loadOpeningStats();
  }

  function watchResultsStats() {
    const results = document.getElementById('results');
    if (!results) return;
    const observer = new MutationObserver(() => {
      addGuideLinks();
      if (!results.classList.contains('hidden')) {
        window.clearTimeout(watchResultsStats.timer);
        watchResultsStats.timer = window.setTimeout(loadResultStatsFallback, 350);
      }
    });
    observer.observe(results, { attributes: true, childList: true, subtree: true });
    watchResultsStats.observer = observer;
  }

  async function loadResultStatsFallback(attempt = 0) {
    const results = document.getElementById('results');
    const panel = document.getElementById('sharedStats');
    if (!results || results.classList.contains('hidden') || !panel) return;
    try {
      const data = await fetchStats();
      const meta = document.getElementById('sharedStatsMeta');
      if (meta) meta.textContent = `${Number(data.total || 0)} completed quizzes counted`;
      panel.innerHTML = `<div class="stats-note">These are aggregate quiz completions. No quiz answers or personal details are stored.</div>` + statsRows(data).replaceAll('opening-stats-row', 'stats-row').replaceAll('opening-stats-rank', 'stats-rank').replaceAll('opening-stats-job', 'stats-job').replaceAll('opening-stats-meter', 'stats-meter').replaceAll('opening-stats-number', 'stats-number');
      addGuideLinks();
    } catch (_) {
      if (attempt < 2) window.setTimeout(() => loadResultStatsFallback(attempt + 1), [700, 1800][attempt]);
    }
  }

  function initEnhancements() {
    ensureOpeningPanel();
    addGuideLinks();
    watchResultsStats();
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
      const observer = new MutationObserver(addGuideLinks);
      observer.observe(leaderboard, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEnhancements, { once: true });
  else initEnhancements();
})();
