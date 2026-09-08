(() => {
  const QUESTIONS = window.QUIZ_QUESTIONS || [];
  const CLASS_DATA = window.CLASS_DATA || {};
  const DIM_LABELS = window.QUIZ_DIMS || {};
  const VECTORS = window.QUIZ_OPTION_VECTORS || {};
  const DIMS = Object.keys(DIM_LABELS);
  const MODE = '12';
  const MODE_NAME = 'Maple Island → 2nd Job';
  const RECOMMENDATION_MIN_ANSWERED = 12;
  const COMMUNITY_MIN_ANSWERED = 15;

  const state = { mode: MODE, questions: QUESTIONS, index: 0, answers: [], resultSubmitted: false };
  const $ = id => document.getElementById(id);
  const show = el => el?.classList.remove('hidden');
  const hide = el => el?.classList.add('hidden');

  function applyTheme(mode) {
    const night = mode === 'night';
    document.body.classList.toggle('night-mode', night);
    const button = $('themeToggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(night));
    button.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
    button.title = night ? 'Switch to day mode' : 'Switch to night mode';
    const icon = button.querySelector('.theme-icon');
    const label = button.querySelector('.theme-toggle-label');
    if (icon) {
      icon.textContent = night ? '☾' : '☀';
      icon.className = `theme-icon ${night ? 'theme-moon' : 'theme-sun'}`;
    }
    if (label) label.textContent = night ? 'Night' : 'Day';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#151f33' : '#5b91c8');
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('msclassic-quiz-theme'); } catch (_) {}
    applyTheme(saved === 'day' ? 'day' : 'night');
    $('themeToggle')?.addEventListener('click', () => {
      const next = document.body.classList.contains('night-mode') ? 'day' : 'night';
      applyTheme(next);
      try { localStorage.setItem('msclassic-quiz-theme', next); } catch (_) {}
    });
  }

  function resetState() {
    state.index = 0;
    state.answers = QUESTIONS.map(() => ({ranked: [], abstained: false}));
    state.resultSubmitted = false;
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    const answer = state.answers[state.index];
    $('modeLabel').textContent = MODE_NAME.toUpperCase();
    $('progressText').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    $('progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
    $('qNumber').textContent = String(state.index + 1).padStart(2, '0');
    $('sectionLabel').textContent = (q.section || '').toUpperCase();
    $('questionText').textContent = q.text;
    $('answers').innerHTML = '';

    q.options.forEach(([letter, text]) => {
      const row = document.createElement('div');
      row.className = 'answer';
      row.dataset.letter = letter;
      const rank = answer.ranked.indexOf(letter);
      if (rank >= 0) row.classList.add('selected');
      if (answer.abstained) row.classList.add('disabled-answer');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-main';
      button.disabled = answer.abstained;
      button.innerHTML = `<span class="answer-badge">${letter}</span><span class="answer-text">${text}</span><span class="rank-chip">${rank >= 0 ? `#${rank + 1}` : ''}</span>`;
      button.addEventListener('click', () => toggleRank(letter));
      row.appendChild(button);
      $('answers').appendChild(row);
    });

    $('abstainBtn').innerHTML = answer.abstained ? 'Skip removed <span class="key-mini">Z</span>' : 'Abstain <span class="key-mini">Z</span>';
    $('clearRanking').disabled = answer.abstained && !answer.ranked.length;
    $('backBtn').disabled = state.index === 0;
    $('nextBtn').innerHTML = state.index === state.questions.length - 1 ? 'See Results <span class="key-mini key-space">Space</span>' : 'Next <span class="key-mini key-space">Space</span>';
    $('rankingPreview').textContent = answer.abstained
      ? 'Abstained — this question contributes no preference signal.'
      : answer.ranked.length
        ? `Your ranking: ${answer.ranked.join(' > ')}`
        : 'No choices ranked yet.';
  }

  function toggleRank(letter) {
    const answer = state.answers[state.index];
    if (answer.abstained) answer.abstained = false;
    const current = answer.ranked.indexOf(letter);
    if (current >= 0) answer.ranked.splice(current, 1);
    else answer.ranked.push(letter);
    renderQuestion();
  }

  function keepQuizNavVisible() {
    if (window.matchMedia('(max-width: 650px)').matches) $('nextBtn')?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    else window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function normalizedVector(sparse) {
    return Object.fromEntries(DIMS.map(dim => [dim, typeof sparse?.[dim] === 'number' ? sparse[dim] : 0.5]));
  }

  function preferenceFor(question, answer) {
    const aggregate = Object.fromEntries(DIMS.map(dim => [dim, 0.5]));
    const evidence = Object.fromEntries(DIMS.map(dim => [dim, 0]));
    answer.ranked.forEach((letter, rank) => {
      const pref = normalizedVector(VECTORS[question.id]?.[letter.charCodeAt(0) - 65]);
      const qWeight = Number(window.QUIZ_QUESTION_WEIGHTS?.[question.id] ?? 1);
      const rankWeight = [1, 0.72, 0.5, 0.34][rank] ?? 0.25;
      const weight = qWeight * rankWeight;
      DIMS.forEach(dim => {
        const signal = Math.abs(pref[dim] - 0.5) * 2;
        if (signal < 0.08) return;
        const contribution = weight * signal;
        const prior = evidence[dim];
        const blend = contribution / (prior + contribution + 0.0001);
        aggregate[dim] = aggregate[dim] * (1 - blend) + pref[dim] * blend;
        evidence[dim] += contribution;
      });
    });
    return {aggregate, evidence};
  }

  function calculateResult() {
    const dimWeights = window.QUIZ_DIM_WEIGHTS || {};
    const userDims = Object.fromEntries(DIMS.map(dim => [dim, 0.5]));
    const userWeights = Object.fromEntries(DIMS.map(dim => [dim, 0]));
    let answered = 0;
    let rankedChoices = 0;

    state.answers.forEach((answer, index) => {
      if (!answer || answer.abstained || !answer.ranked.length) return;
      answered++;
      rankedChoices += answer.ranked.length;
      const {aggregate, evidence} = preferenceFor(state.questions[index], answer);
      DIMS.forEach(dim => {
        if (!evidence[dim]) return;
        const oldWeight = userWeights[dim];
        const newWeight = oldWeight + evidence[dim];
        userDims[dim] = oldWeight ? ((userDims[dim] * oldWeight) + (aggregate[dim] * evidence[dim])) / newWeight : aggregate[dim];
        userWeights[dim] = newWeight;
      });
    });

    const activeDims = DIMS.filter(dim => userWeights[dim] > 0);
    const scores = {};
    Object.entries(CLASS_DATA).forEach(([key, cls]) => {
      let sum = 0;
      let denominator = 0;
      activeDims.forEach(dim => {
        const weight = (dimWeights[dim] || 1) * userWeights[dim];
        const distance = Math.abs(userDims[dim] - cls.dims[dim]);
        sum += (1 - Math.min(1, distance)) * weight;
        denominator += weight;
      });
      scores[key] = denominator ? (sum / denominator) * 100 : 50;
    });

    return {scores, userDims, answered, rankedChoices, total: state.questions.length, activeDimensionCount: activeDims.length};
  }

  function resetResultsPanels() {
    $('leaderboard').innerHTML = '';
    $('winnerDetails').innerHTML = '';
    $('sharedStats').innerHTML = '';
  }

  function renderBeginner(result) {
    $('winnerFamily').textContent = 'MAPLE ISLAND';
    $('winnerName').textContent = 'Beginner';
    $('winnerScore').textContent = 'Beginner';
    $('winnerSummary').textContent = 'You skipped every question. Fair enough. The job recommendation can wait — you have chosen the path of least commitment.';
    $('ringScore').textContent = '—';
    $('confidenceText').textContent = `${result.total}/${result.total} questions skipped • Beginner unlocked`;
    $('rankingModeLabel').textContent = MODE_NAME.toUpperCase();
    $('leaderboard').innerHTML = `<div class="beginner-result-card"><div class="beginner-emblem">B</div><div><strong>You stayed a Beginner.</strong><p>No answers were ranked, so none of the 10 jobs had enough information to make a recommendation.</p></div></div>`;
    $('winnerDetails').innerHTML = `<div class="detail-item"><strong>Your grand achievement</strong><p>You answered absolutely nothing. Somehow, that is itself an answer.</p></div><div class="detail-item tradeoff-card"><strong>The catch</strong><p>Beginners do not get a class recommendation from this result.</p></div>`;
    renderSharedStats();
    hide($('quiz')); show($('results'));
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function renderInsufficient(result) {
    $('winnerFamily').textContent = 'MAPLE ISLAND';
    $('winnerName').textContent = 'Not enough answers';
    $('winnerScore').textContent = 'No Job match yet';
    $('winnerSummary').textContent = `Answer at least ${RECOMMENDATION_MIN_ANSWERED} questions to receive a Job recommendation. You answered ${result.answered} of ${result.total}.`;
    $('ringScore').textContent = '—';
    $('confidenceText').textContent = `${result.answered}/${result.total} questions answered • ${RECOMMENDATION_MIN_ANSWERED} needed for a Job recommendation`;
    $('rankingModeLabel').textContent = MODE_NAME.toUpperCase();
    $('leaderboard').innerHTML = `<div class="beginner-result-card insufficient-result-card"><div class="beginner-emblem">?</div><div><strong>Your result is not ready yet.</strong><p>The quiz needs at least ${RECOMMENDATION_MIN_ANSWERED} ranked questions before it will tell you which Job best matches your playstyle.</p></div></div>`;
    $('winnerDetails').innerHTML = `<div class="detail-item"><strong>Why there is no Job match</strong><p>With fewer than ${RECOMMENDATION_MIN_ANSWERED} answered questions, the result can be too heavily influenced by the small number of choices you made.</p></div><div class="detail-item tradeoff-card"><strong>Keep going</strong><p>Answer at least ${RECOMMENDATION_MIN_ANSWERED} questions to unlock your Job match.</p></div>`;
    const eligibility = $('communityEligibility');
    eligibility.className = 'community-eligibility ineligible';
    eligibility.innerHTML = `<strong>Community Results: Not counted</strong><span>At least ${COMMUNITY_MIN_ANSWERED} questions must have a ranked answer before a result is added to the community totals.</span>`;
    renderSharedStats();
    hide($('quiz')); show($('results'));
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function guideMarkup(jobKey) {
    const guides = window.QUIZ_JOB_GUIDES?.[jobKey] || [];
    return guides.length ? `<div class="job-match-guides" aria-label="MeowDB leveling guides">${guides.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')}</div>` : '';
  }

  function matchReasons(result, cls) {
    return DIMS.map(dim => {
      const userLean = result.userDims[dim] - 0.5;
      const classLean = (cls.dims[dim] ?? 0.5) - 0.5;
      const signal = Math.abs(userLean);
      const sameDirection = Math.sign(userLean) !== 0 && Math.sign(userLean) === Math.sign(classLean);
      const closeness = 1 - Math.min(1, Math.abs(result.userDims[dim] - (cls.dims[dim] ?? 0.5)));
      return {dim, score: sameDirection ? signal * closeness : 0};
    }).filter(item => item.score > 0.12).sort((a, b) => b.score - a.score).slice(0, 3)
      .map(item => `You leaned toward ${DIM_LABELS[item.dim].toLowerCase()}, which matches ${cls.name}'s playstyle.`).join(' ');
  }

  async function refreshSharedStats() {
    const panel = $('sharedStats');
    if (!window.STATS_API_URL || !panel) return;
    try {
      const response = await fetch(`${window.STATS_API_URL.replace(/\/$/, '')}/stats`, {cache: 'no-store'});
      if (!response.ok) throw new Error('stats failed');
      const data = await response.json();
      if (!data?.ok) throw new Error('stats unavailable');
      renderSharedStats(data);
    } catch (_) {
      panel.innerHTML = `<div class="stats-empty">Shared results are not available right now.</div>`;
    }
  }

  function renderSharedStats(data = null) {
    const panel = $('sharedStats');
    if (!panel) return;
    const label = $('sharedStatsMeta');
    if (!window.STATS_API_URL) {
      if (label) label.textContent = 'Shared counts are not connected right now.';
      panel.innerHTML = `<div class="stats-empty">The quiz itself works normally. Community counts will appear here when the shared counter is connected.</div>`;
      return;
    }
    if (!data?.ok) {
      if (label) label.textContent = 'Loading shared results…';
      panel.innerHTML = `<div class="stats-empty">Loading the latest Maple World results…</div>`;
      return;
    }
    const total = Number(data.total || 0);
    if (label) label.textContent = `${total} completed quizzes counted`;
    const sorted = Object.keys(CLASS_DATA).sort((a, b) => Number(data.totals?.[b] || 0) - Number(data.totals?.[a] || 0));
    panel.innerHTML = `<div class="stats-note">These are aggregate quiz completions. No quiz answers or personal details are stored.</div>` + sorted.map((key, index) => {
      const count = Number(data.totals?.[key] || 0);
      const percent = total ? (count / total) * 100 : 0;
      const cls = CLASS_DATA[key];
      return `<div class="stats-row"><div class="stats-rank">${index + 1}</div><div class="stats-job"><strong>${cls.name}</strong><span>${cls.family}</span><div class="stats-meter"><i style="width:${Math.min(100, percent)}%"></i></div></div><div class="stats-number"><b>${count}</b><span>${percent.toFixed(1)}%</span></div></div>`;
    }).join('');
  }

  async function submitResult(winner, answered) {
    if (state.resultSubmitted || !window.STATS_API_URL || answered < COMMUNITY_MIN_ANSWERED) return;
    state.resultSubmitted = true;
    try {
      await fetch(`${window.STATS_API_URL.replace(/\/$/, '')}/result`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({winner, mode: MODE, answered})
      });
      refreshSharedStats();
    } catch (_) {}
  }

  function renderResults() {
    resetResultsPanels();
    const result = calculateResult();
    if (!result.rankedChoices) return renderBeginner(result);
    if (result.answered < RECOMMENDATION_MIN_ANSWERED) return renderInsufficient(result);

    const sorted = Object.entries(result.scores).sort((a, b) => b[1] - a[1]);
    const [winnerKey, winnerScore] = sorted[0];
    const winner = CLASS_DATA[winnerKey];
    const eligible = result.answered >= COMMUNITY_MIN_ANSWERED;

    $('winnerFamily').textContent = winner.family.toUpperCase();
    $('winnerName').textContent = winner.name;
    $('winnerScore').textContent = `${winnerScore.toFixed(1)}% fit`;
    $('winnerSummary').textContent = winner.summary;
    $('ringScore').textContent = `${Math.round(winnerScore)}%`;
    $('confidenceText').textContent = `${result.answered}/${result.total} questions answered • ${winnerScore - sorted[1][1] < 3 ? 'A close call' : 'Clear lead'} over the next match`;
    $('rankingModeLabel').textContent = MODE_NAME.toUpperCase();

    $('leaderboard').innerHTML = `<div class="job-match-grid">${sorted.map(([key, score], index) => {
      const cls = CLASS_DATA[key];
      const delta = winnerScore - score;
      const note = index === 0 ? 'Your strongest match' : delta < 3 ? 'Very close to your result' : delta < 7 ? 'Close match' : 'Another possible fit';
      const why = matchReasons(result, cls) || `Your overall preference profile was relatively close to ${cls.name}.`;
      return `<article class="job-match-card ${index === 0 ? 'job-match-winner' : ''}">
        <div class="job-match-rank">#${index + 1}</div>
        <div class="job-match-body">
          <div class="job-match-title"><h4>${cls.name}</h4><span>${cls.family}</span></div>
          <div class="job-match-score"><strong>${score.toFixed(1)}%</strong><span>Match</span></div>
          <div class="job-match-bar"><i style="width:${Math.min(100, Math.max(0, score))}%"></i></div>
          <div class="job-match-note">${note}</div>
          ${index > 0 && index < 4 ? `<details class="job-match-why"><summary>Why it was close</summary><p>${why}</p></details>` : ''}
          ${index === 0 ? `<p class="job-match-description">${cls.summary}</p>` : ''}
          ${guideMarkup(key)}
        </div>
      </article>`;
    }).join('')}</div>`;

    const strongest = DIMS.map(dim => ({dim, signal: Math.abs(result.userDims[dim] - 0.5)}))
      .filter(item => item.signal > 0.08).sort((a, b) => b.signal - a.signal).slice(0, 5)
      .map(item => `<span>${DIM_LABELS[item.dim]}</span>`).join('');

    $('winnerDetails').innerHTML = `<div class="detail-item"><strong>The things you leaned toward</strong><div class="tag-row">${strongest || '<span>Not enough preference signals yet.</span>'}</div></div><div class="detail-item"><strong>What that looks like on this job</strong><ul class="detail-bullets">${winner.notes.map(note => `<li>${note}</li>`).join('')}</ul></div><div class="detail-item tradeoff-card"><strong>The catch</strong><p>${winner.dims.close > 0.75 ? 'You will spend plenty of time in close quarters.' : 'You are not tied to close-quarters fighting.'} ${winner.dims.economy > 0.75 ? 'Mesos and upkeep matter more than they do for most paths.' : 'The job does not lean heavily on money management.'} ${winner.dims.party > 0.75 ? 'Party play is a big part of what makes this path shine.' : 'You can get a lot out of this job on your own.'}</p></div>`;

    const eligibility = $('communityEligibility');
    eligibility.className = `community-eligibility ${eligible ? 'eligible' : 'ineligible'}`;
    eligibility.innerHTML = eligible
      ? '<strong>Community Results: Counted</strong><span>Your result has been included in the community totals.</span>'
      : `<strong>Community Results: Not counted</strong><span>At least ${COMMUNITY_MIN_ANSWERED} questions must have a ranked answer before a result is added to the community totals.</span>`;

    hide($('quiz')); show($('results'));
    renderSharedStats();
    submitResult(winnerKey, result.answered);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function next() {
    if (state.index < state.questions.length - 1) {
      state.index++;
      renderQuestion();
      keepQuizNavVisible();
    } else renderResults();
  }

  function start() {
    resetState();
    hide($('results'));
    show($('quiz'));
    renderQuestion();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  document.addEventListener('keydown', event => {
    if ($('quiz').classList.contains('hidden')) return;
    const target = document.activeElement;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    const key = event.key.toUpperCase();
    if (/^[A-D]$/.test(key)) {
      const q = state.questions[state.index];
      if (q?.options.some(([letter]) => letter === key)) { event.preventDefault(); toggleRank(key); }
      return;
    }
    if (key === 'Z') {
      event.preventDefault();
      const answer = state.answers[state.index];
      answer.ranked = [];
      answer.abstained = !answer.abstained;
      renderQuestion();
      return;
    }
    if (key === 'X') {
      event.preventDefault();
      state.answers[state.index] = {ranked: [], abstained: false};
      renderQuestion();
      return;
    }
    if (event.code === 'Space') { event.preventDefault(); next(); }
  });

  initTheme();
  $('clearRanking').addEventListener('click', () => { state.answers[state.index] = {ranked: [], abstained: false}; renderQuestion(); });
  $('abstainBtn').addEventListener('click', () => { const answer = state.answers[state.index]; answer.ranked = []; answer.abstained = !answer.abstained; renderQuestion(); });
  $('backBtn').addEventListener('click', () => { if (state.index > 0) { state.index--; renderQuestion(); window.scrollTo({top: 0, behavior: 'smooth'}); } });
  $('nextBtn').addEventListener('click', next);
  $('quitBtn').addEventListener('click', () => { if (confirm('Restart and clear your current answers?')) start(); });
  $('retakeBtn').addEventListener('click', start);
  start();
})();