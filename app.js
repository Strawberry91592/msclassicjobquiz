(() => {
  const allQuestions = window.QUIZ_QUESTIONS || [];
  const CLASS_DATA = window.CLASS_DATA || {};
  const DIM_LABELS = window.QUIZ_DIMS || {};
  const OPTION_VECTORS = window.QUIZ_OPTION_VECTORS || {};
  const dims = Object.keys(DIM_LABELS);
  const modeNames = {12:'Maple Island → 2nd Job'};
  const COMMUNITY_MIN_ANSWERED = 30;

  const state = {
    mode:null,
    questions:[],
    index:0,
    answers:[],
    results:null,
    resultSubmitted:false
  };

  const $ = id => document.getElementById(id);
  const show = el => { if (el) el.classList.remove('hidden'); };
  const hide = el => { if (el) el.classList.add('hidden'); };

  function applyTheme(mode) {
    const night = mode === 'night';
    document.body.classList.toggle('night-mode', night);
    const btn = $('themeToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(night));
      btn.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode');
      btn.title = night ? 'Switch to day mode' : 'Switch to night mode';
      const icon = btn.querySelector('.theme-icon');
      const label = btn.querySelector('.theme-toggle-label');
      if (icon) { icon.textContent = night ? '☾' : '☀'; icon.className = `theme-icon ${night ? 'theme-moon' : 'theme-sun'}`; }
      if (label) label.textContent = night ? 'Night' : 'Day';
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', night ? '#151f33' : '#5b91c8');
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

  function questionsForMode() {
    return allQuestions;
  }

  function resetState(mode) {
    state.mode = '12';
    state.questions = questionsForMode();
    state.index = 0;
    state.answers = Array.from({length: state.questions.length}, () => ({ranked:[], abstained:false}));
    state.results = null;
    state.resultSubmitted = false;
  }

  function start(mode='12') {
    resetState(mode);
    hide($('results'));
    show($('quiz'));
    $('modeLabel').textContent = `${modeNames[state.mode].toUpperCase()}`;
    renderQuestion();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    const saved = state.answers[state.index];
    const sectionTitles = {
      'Getting Stronger':'Getting Stronger',
      'On the Hunt':'On the Hunt',
      'Moving Through Maple World':'Around Maple World',
      'Supplies & Mesos':'Supplies & Mesos',
      'Party Play':'Party Play',
      'When Things Go Wrong':'When Things Go Wrong',
      'Trade-offs':'Trade-offs',
      'The Long Road':'The Long Road',
      'More Specific':'A Closer Look',
      'Looking Ahead':'Looking Ahead'
    };
    $('sectionLabel').textContent = (sectionTitles[q.section] || q.section).toUpperCase();
    $('progressText').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    $('progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
    $('qNumber').textContent = String(state.index + 1).padStart(2,'0');
    $('questionText').textContent = q.text;
    $('answers').innerHTML = '';

    q.options.forEach(([letter,text]) => {
      const el = document.createElement('div');
      el.className = 'answer';
      el.dataset.letter = letter;
      const pos = saved.ranked.indexOf(letter);
      if (pos >= 0) el.classList.add('selected');
      if (saved.abstained) el.classList.add('disabled-answer');

      const main = document.createElement('button');
      main.className = 'answer-main';
      main.type = 'button';
      main.disabled = saved.abstained;
      main.innerHTML = `<span class="answer-badge">${letter}</span><span class="answer-text">${text}</span><span class="rank-chip">${pos >= 0 ? `#${pos+1}` : ''}</span>`;
      main.addEventListener('click', () => toggleRank(letter));

      el.append(main);
      $('answers').appendChild(el);
    });

    $('abstainBtn').innerHTML = saved.abstained ? 'Skip removed <span class="key-mini">Z</span>' : 'Abstain <span class="key-mini">Z</span>';
    $('backBtn').disabled = state.index === 0;
    $('nextBtn').innerHTML = state.index === state.questions.length - 1 ? 'See Results <span class="key-mini key-space">Space</span>' : 'Next <span class="key-mini key-space">Space</span>';
    updatePreview();
  }

  function toggleRank(letter) {
    const saved = state.answers[state.index];
    if (saved.abstained) saved.abstained = false;
    const idx = saved.ranked.indexOf(letter);
    if (idx >= 0) saved.ranked.splice(idx,1);
    else saved.ranked.push(letter);
    renderQuestion();
  }

  function updatePreview() {
    const saved = state.answers[state.index];
    $('rankingPreview').textContent = saved.abstained
      ? 'Abstained — this question contributes no preference signal.'
      : saved.ranked.length
        ? `Your ranking: ${saved.ranked.join(' > ')}`
        : 'No choices ranked yet.';
  }

  function vectorFor(qId, letter) {
    const idx = letter.charCodeAt(0) - 65;
    return OPTION_VECTORS[qId]?.[idx] || {};
  }

  function normalizedVector(sparse) {
    const out = {};
    dims.forEach(d => out[d] = typeof sparse[d] === 'number' ? sparse[d] : 0.5);
    return out;
  }

  function selectedPreferenceVector(q, answer) {
    const aggregate = Object.fromEntries(dims.map(d => [d, 0.5]));
    const evidence = Object.fromEntries(dims.map(d => [d, 0]));
    let totalWeight = 0;
    answer.ranked.forEach((letter, rank) => {
      const pref = normalizedVector(vectorFor(q.id, letter));
      const rankWeight = [1.00, 0.72, 0.50, 0.34][rank] ?? 0.25;
      const qWeight = Number(window.QUIZ_QUESTION_WEIGHTS?.[q.id] ?? 1);
      const w = rankWeight * qWeight;
      totalWeight += w;
      dims.forEach(d => {
        const signal = Math.abs(pref[d] - 0.5) * 2;
        if (signal < 0.08) return;
        aggregate[d] = aggregate[d] * (1 - Math.min(1, w * signal / (evidence[d] + w * signal + 0.0001)))
          + pref[d] * Math.min(1, w * signal / (evidence[d] + w * signal + 0.0001));
        evidence[d] += w * signal;
      });
    });
    return {aggregate, evidence, totalWeight};
  }

  function score() {
    const dimWeights = window.QUIZ_DIM_WEIGHTS || {};
    const userDims = Object.fromEntries(dims.map(d => [d, 0.5]));
    const userDimWeight = Object.fromEntries(dims.map(d => [d, 0]));
    let answered = 0;
    let rankedChoices = 0;

    state.answers.forEach((answer, qIndex) => {
      if (!answer || answer.abstained || !answer.ranked.length) return;
      answered++;
      const q = state.questions[qIndex];
      const {aggregate, evidence} = selectedPreferenceVector(q, answer);
      rankedChoices += answer.ranked.length;
      dims.forEach(d => {
        if (!evidence[d]) return;
        const oldW = userDimWeight[d];
        const newW = oldW + evidence[d];
        userDims[d] = oldW ? ((userDims[d] * oldW) + (aggregate[d] * evidence[d])) / newW : aggregate[d];
        userDimWeight[d] = newW;
      });
    });

    const activeDims = dims.filter(d => userDimWeight[d] > 0);
    const raw = {};

    Object.entries(CLASS_DATA).forEach(([key, cls]) => {
      let fitSum = 0;
      let fitDenom = 0;
      activeDims.forEach(d => {
        const w = (dimWeights[d] || 1) * userDimWeight[d];
        const distance = Math.abs(userDims[d] - cls.dims[d]);
        fitSum += (1 - Math.min(1, distance)) * w;
        fitDenom += w;
      });
      raw[key] = fitDenom ? fitSum / fitDenom : 0.5;
    });

    const scores = Object.fromEntries(Object.entries(raw).map(([k,v]) => [k, v * 100]));

    return {
      scores,
      rawScores:raw,
      userDims,
      answered,
      total:state.questions.length,
      coverage: state.questions.length ? answered/state.questions.length : 0,
      rankedChoices,
      activeDimensionCount:activeDims.length
    };
  }

  function renderBeginnerResult(result) {
    $('winnerFamily').textContent = 'MAPLE ISLAND';
    $('winnerName').textContent = 'Beginner';
    $('winnerScore').textContent = 'Beginner';
    $('winnerSummary').textContent = 'You skipped every question. Fair enough. The job recommendation can wait — you have chosen the path of least commitment.';
    $('ringScore').textContent = '—';
    $('confidenceText').textContent = `${result.total}/${result.total} questions skipped • Beginner unlocked`;
    $('rankingModeLabel').textContent = 'MAPLE ISLAND → 2ND JOB';

    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
      leaderboard.innerHTML = `
        <div class="beginner-result-card">
          <div class="beginner-emblem">B</div>
          <div>
            <strong>You stayed a Beginner.</strong>
            <p>No answers were ranked, so none of the 10 jobs had enough information to make a recommendation.</p>
          </div>
        </div>`;
    }
    $('winnerDetails').innerHTML = `
      <div class="detail-item"><strong>Your grand achievement</strong><p>You answered absolutely nothing. Somehow, that is itself an answer.</p></div>
      <div class="detail-item tradeoff-card"><strong>The catch</strong><p>Beginners do not get a class recommendation from this result. Take the quiz again when Maple Island calls.</p></div>`;
    refreshSharedStats();
    hide($('quiz')); show($('results'));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function guideMarkup(jobKey) {
    const guides = window.QUIZ_JOB_GUIDES?.[jobKey] || [];
    if (!guides.length) return '';
    return `<div class="job-match-guides" aria-label="MeowDB leveling guides">${guides.map(([label,url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')}</div>`;
  }

  function renderResults() {
    const result = score();
    state.results = result;

    if (result.rankedChoices === 0) {
      renderBeginnerResult(result);
      return;
    }

    const sorted = Object.entries(CLASS_DATA).map(([key, cls]) => [key, result.scores[key]])
      .sort((a,b) => b[1] - a[1]);
    const [winnerKey,winnerScore] = sorted[0];
    const winner = CLASS_DATA[winnerKey];
    const eligible = result.answered >= COMMUNITY_MIN_ANSWERED;

    $('winnerFamily').textContent = winner.family.toUpperCase();
    $('winnerName').textContent = winner.name;
    $('winnerScore').textContent = `${winnerScore.toFixed(1)}% fit`;
    $('winnerSummary').textContent = winner.summary;
    $('ringScore').textContent = `${Math.round(winnerScore)}%`;
    $('confidenceText').textContent = `${result.answered}/${result.total} questions answered • ${winnerScore - sorted[1][1] < 3 ? 'A close call' : 'Clear lead'} over the next match`;
    $('rankingModeLabel').textContent = 'MAPLE ISLAND → 2ND JOB';

    const leaderHtml = sorted.map(([key,score],i) => {
      const cls = CLASS_DATA[key];
      const delta = winnerScore - score;
      const note = i === 0
        ? 'Your strongest match'
        : (delta < 3 ? 'Very close to your result' : delta < 7 ? 'Close match' : 'Another possible fit');
      return `<article class="job-match-card ${i===0?'job-match-winner':''}">
        <div class="job-match-rank">#${i+1}</div>
        <div class="job-match-body">
          <div class="job-match-title"><h4>${cls.name}</h4><span>${cls.family}</span></div>
          <div class="job-match-score"><strong>${score.toFixed(1)}%</strong><span>Match</span></div>
          <div class="job-match-bar"><i style="width:${Math.min(100,Math.max(0,score))}%"></i></div>
          <div class="job-match-note">${note}</div>
          ${i>0 && i<4 ? `<details class="job-match-why"><summary>Why it was close</summary><p>${cls.notes.slice(0,2).join(' ')}</p></details>` : ''}
          ${i===0 ? `<p class="job-match-description">${cls.summary}</p>` : ''}
          ${guideMarkup(key)}
        </div>
      </article>`;
    }).join('');
    $('leaderboard').innerHTML = `<div class="job-match-grid">${leaderHtml}</div>`;

    const expressedDims = dims.map(d => ({d,v:result.userDims[d],signal:Math.abs(result.userDims[d]-0.5)}))
      .filter(x=>x.signal>0.08).sort((a,b)=>b.signal-a.signal).slice(0,10);
    const strongest = expressedDims.slice(0,5).map(x => DIM_LABELS[x.d]);
    const fitLines = strongest.length ? strongest.map(label => `<span>${label}</span>`).join('') : '<span>Not enough preference signals yet.</span>';
    $('winnerDetails').innerHTML = `
      <div class="detail-item"><strong>The things you leaned toward</strong><div class="tag-row">${fitLines}</div></div>
      <div class="detail-item"><strong>What that looks like on this job</strong><ul class="detail-bullets">${winner.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>
      <div class="detail-item tradeoff-card"><strong>The catch</strong><p>${winner.dims.close > 0.75 ? 'You will spend plenty of time in close quarters.' : 'You are not tied to close-quarters fighting.'} ${winner.dims.economy > 0.75 ? 'Mesos and upkeep matter more than they do for most paths.' : 'The job does not lean heavily on money management.'} ${winner.dims.party > 0.75 ? 'Party play is a big part of what makes this path shine.' : 'You can get a lot out of this job on your own.'}</p></div>`;

    renderSharedStats();
    const eligibilityPanel = document.getElementById('communityEligibility');
    if (eligibilityPanel) {
      eligibilityPanel.className = `community-eligibility ${eligible ? 'eligible' : 'ineligible'}`;
      eligibilityPanel.innerHTML = eligible
        ? `<strong>Community Results: Counted</strong><span>Your result has been included in the community totals.</span>`
        : `<strong>Community Results: Not counted</strong><span>At least ${COMMUNITY_MIN_ANSWERED} questions must have a ranked answer before a result is added to the community totals.</span>`;
    }
    hide($('quiz')); show($('results'));

    submitResult(winnerKey, '12', result.answered, eligible);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const STATS_API_URL = window.STATS_API_URL || '';

  async function submitResult(winner, mode, answered, eligible) {
    if (state.resultSubmitted || !STATS_API_URL || !eligible) return;
    state.resultSubmitted = true;
    try {
      await fetch(`${STATS_API_URL.replace(/\/$/, '')}/result`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({winner, mode, answered})
      });
      refreshSharedStats();
    } catch (_) {
      // Results still work if the optional shared counter is unavailable.
    }
  }

  async function refreshSharedStats() {
    if (!STATS_API_URL) return;
    const panel = $('sharedStats');
    if (!panel) return;
    try {
      const res = await fetch(`${STATS_API_URL.replace(/\/$/, '')}/stats`, {cache:'no-store'});
      if (!res.ok) throw new Error('stats failed');
      const data = await res.json();
      if (!data.ok) throw new Error('stats unavailable');
      renderSharedStats(data);
    } catch (_) {
      panel.innerHTML = `<div class="stats-empty">Shared results are not available right now.</div>`;
    }
  }

  function renderSharedStats(data=null) {
    const panel = $('sharedStats');
    if (!panel) return;
    const label = $('sharedStatsMeta');
    if (!STATS_API_URL) {
      if (label) label.textContent = 'Shared counts will appear here after the site owner connects the results counter.';
      panel.innerHTML = `<div class="stats-empty"><strong>The counter is not connected yet.</strong><span>The quiz itself works normally. When the shared counter is connected, this section will show how often each job path was the final match.</span></div>`;
      return;
    }
    if (!data?.ok) {
      if (label) label.textContent = 'Loading shared results…';
      panel.innerHTML = `<div class="stats-empty">Loading the latest Maple World results…</div>`;
      return;
    }
    if (label) label.textContent = `${data.total || 0} completed quizzes counted`;
    const total = Number(data.total || 0);
    const sorted = Object.keys(CLASS_DATA).sort((a,b)=>(data.totals[b]||0)-(data.totals[a]||0));
    panel.innerHTML = `<div class="stats-note">These are aggregate quiz completions. No quiz answers or personal details are stored.</div>` + sorted.map((key,i) => {
      const count = Number(data.totals?.[key] || 0);
      const pct = total ? (count / total * 100) : 0;
      const cls = CLASS_DATA[key];
      return `<div class="stats-row"><div class="stats-rank">${i+1}</div><div class="stats-job"><strong>${cls.name}</strong><span>${cls.family}</span><div class="stats-meter"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
    }).join('');
  }

  function retake() { start(); }

  document.addEventListener('keydown', (event) => {
    if ($('quiz').classList.contains('hidden')) return;
    const key = event.key.toUpperCase();
    const active = document.activeElement;
    const typing = active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName);
    if (typing) return;

    if (/^[A-D]$/.test(key)) {
      const q = state.questions[state.index];
      if (q?.options.some(([letter]) => letter === key)) {
        event.preventDefault();
        toggleRank(key);
      }
      return;
    }
    if (key === 'Z') {
      event.preventDefault();
      const a = state.answers[state.index];
      a.ranked = [];
      a.abstained = !a.abstained;
      renderQuestion();
      return;
    }
    if (key === 'X') {
      event.preventDefault();
      state.answers[state.index] = {ranked:[],abstained:false};
      renderQuestion();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (state.index < state.questions.length - 1) {
        state.index++;
        renderQuestion();
        window.scrollTo({top:0,behavior:'smooth'});
      } else {
        renderResults();
      }
    }
  });

  initTheme();

  $('clearRanking').addEventListener('click', () => { state.answers[state.index] = {ranked:[],abstained:false}; renderQuestion(); });
  $('abstainBtn').addEventListener('click', () => { const a = state.answers[state.index]; a.ranked=[]; a.abstained=!a.abstained; renderQuestion(); });
  $('backBtn').addEventListener('click', () => { if (state.index>0) { state.index--; renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); } });
  $('nextBtn').addEventListener('click', () => { if (state.index < state.questions.length-1) { state.index++; renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); } else renderResults(); });
  $('quitBtn').addEventListener('click', () => { if (confirm('Restart and clear your current answers?')) start(); });
  $('retakeBtn').addEventListener('click', retake);

  start('12');
})();