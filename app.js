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
    const classCalibration = window.QUIZ_CLASS_SCORE_CALIBRATION || {};
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
      const rawScore = denominator ? (sum / denominator) : 0.5;
      const calibration = classCalibration[key] || {};
      const scale = Number.isFinite(Number(calibration.scale)) ? Number(calibration.scale) : 1;
      const offset = Number.isFinite(Number(calibration.offset)) ? Number(calibration.offset) : 0;
      scores[key] = (rawScore * scale + offset) * 100;
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

    const sorted = Object.keys(CLASS_DATA).sort((a, b) => result.scores[b] - result.scores[a]);
    const winner = sorted[0];
    const winnerClass = CLASS_DATA[winner];
    const bestScore = result.scores[winner];
    const secondScore = result.scores[sorted[1]];
    const gap = Math.max(0, bestScore - secondScore);
    const confidence = gap >= 8 ? 'Strong match' : gap >= 4 ? 'Good match' : 'Close match';

    $('winnerFamily').textContent = winnerClass.family;
    $('winnerName').textContent = winnerClass.name;
    $('winnerScore').textContent = `${bestScore.toFixed(0)}% fit`;
    $('winnerSummary').textContent = winnerClass.summary;
    $('ringScore').textContent = `${bestScore.toFixed(0)}%`;
    $('confidenceText').textContent = `${confidence} • ${result.answered}/${result.total} questions answered`;
    $('rankingModeLabel').textContent = MODE_NAME.toUpperCase();

    $('leaderboard').innerHTML = sorted.map((key, index) => {
      const cls = CLASS_DATA[key];
      const score = result.scores[key];
      const rankLabel = index === 0 ? 'BEST MATCH' : `#${index + 1}`;
      return `<div class="leader-row ${index === 0 ? 'leader-row-best' : ''}"><div class="leader-rank">${rankLabel}</div><div class="leader-copy"><strong>${cls.name}</strong><span>${cls.family}</span><div class="leader-meter"><i style="width:${Math.max(0, Math.min(100, score))}%"></i></div>${guideMarkup(key)}</div><div class="leader-score">${score.toFixed(0)}%</div></div>`;
    }).join('');

    $('winnerDetails').innerHTML = `<div class="detail-item"><strong>Why it fits</strong><p>${matchReasons(result, winnerClass) || 'Your answers produced a broad match across several playstyle dimensions.'}</p></div><div class="detail-item tradeoff-card"><strong>Trade-off</strong><p>${winnerClass.notes[2] || winnerClass.notes[0]}</p></div>`;
    const eligibility = $('communityEligibility');
    eligibility.className = 'community-eligibility eligible';
    eligibility.innerHTML = `<strong>Community Results: Counted</strong><span>Your ${result.answered}-answer result is eligible for aggregate community totals.</span>`;
    submitResult(winner, result.answered);
    refreshSharedStats();
    hide($('quiz')); show($('results'));
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function nextQuestion() {
    if (state.index < state.questions.length - 1) {
      state.index++;
      renderQuestion();
      keepQuizNavVisible();
      return;
    }
    renderResults();
  }

  function previousQuestion() {
    if (state.index > 0) {
      state.index--;
      renderQuestion();
      keepQuizNavVisible();
    }
  }

  function clearChoices() {
    state.answers[state.index].ranked = [];
    state.answers[state.index].abstained = false;
    renderQuestion();
  }

  function abstain() {
    const answer = state.answers[state.index];
    answer.ranked = [];
    answer.abstained = !answer.abstained;
    renderQuestion();
  }

  function restart() {
    resetState();
    hide($('results')); show($('quiz'));
    renderQuestion();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function bindNavigation() {
    $('nextBtn')?.addEventListener('click', nextQuestion);
    $('backBtn')?.addEventListener('click', previousQuestion);
    $('clearRanking')?.addEventListener('click', clearChoices);
    $('abstainBtn')?.addEventListener('click', abstain);
    $('quitBtn')?.addEventListener('click', restart);
    $('retakeBtn')?.addEventListener('click', restart);
    document.addEventListener('keydown', event => {
      if (event.target?.matches?.('input, textarea, select')) return;
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault();
        if (!$('results').classList.contains('hidden')) restart();
        else nextQuestion();
      }
      if (['a','b','c','d'].includes(key) && !$('results').classList.contains('hidden') === false) return;
      if (['a','b','c','d'].includes(key) && !$('results').classList.contains('hidden')) return;
      if (['a','b','c','d'].includes(key)) toggleRank(key.toUpperCase());
      if (key === 'z' && $('results').classList.contains('hidden')) abstain();
      if (key === 'x' && $('results').classList.contains('hidden')) clearChoices();
      if (key === 'arrowleft' && $('results').classList.contains('hidden')) previousQuestion();
      if (key === 'arrowright' && $('results').classList.contains('hidden')) nextQuestion();
    });
  }

  function init() {
    resetState();
    bindNavigation();
    initTheme();
    renderQuestion();
    renderSharedStats();
  }

  init();
})();
