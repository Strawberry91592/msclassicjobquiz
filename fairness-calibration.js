/* v2.0 score calibration and community reset notice.
   Calibration is applied at the class-score layer so the question vectors and
   class playstyle profiles remain unchanged.
*/
(() => {
  window.QUIZ_CLASS_SCORE_CALIBRATION = {
    fighter:   {scale: 33.54590943884276, offset: -24.79222178526074},
    page:      {scale: 33.835680881422654, offset: -26.969068341314983},
    spearman:  {scale: 43.330102895223476, offset: -35.66790247262236},
    fp:        {scale: 33.545559486556314, offset: -27.447918746089584},
    il:        {scale: 39.87013521600783, offset: -32.09013411508537},
    cleric:    {scale: 33.20727632351107, offset: -25.106530772804906},
    hunter:    {scale: 40.757927109586674, offset: -31.83041430954229},
    crossbow:  {scale: 35.569847187348735, offset: -26.61432145220893},
    assassin:  {scale: 37.08667616273307, offset: -29.01263716851679},
    bandit:    {scale: 32.246538600035706, offset: -23.436270799172803}
  };

  if (typeof document?.addEventListener === 'function') {
    // Preserve A-D keyboard ranking behavior. Capture this before the legacy
    // document handler, which contains an inverted visibility guard.
    document.addEventListener('keydown', event => {
      if (event.target?.matches?.('input, textarea, select')) return;
      const key = event.key.toLowerCase();
      if (!['a','b','c','d'].includes(key)) return;
      const results = document.getElementById?.('results');
      if (!results || !results.classList.contains('hidden')) return;
      const button = document.querySelector?.(`.answer[data-letter="${key.toUpperCase()}"] .answer-main`);
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      button.click();
    }, true);

    // Preserve the established result-card selector contract when the
    // renderer uses legacy leader-row markup.
    const addResultCardClass = () => {
      document.querySelectorAll?.('.leader-row')?.forEach(row => row.classList.add('job-match-card'));
    };
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(addResultCardClass);
      const leaderboard = document.getElementById?.('leaderboard');
      if (leaderboard) observer.observe(leaderboard, {childList: true, subtree: true});
    }
    addResultCardClass();

    const addCommunityResetNotice = () => {
      if (typeof document?.querySelector !== 'function') return;
      const panel = document.querySelector('.shared-stats-panel');
      const stats = document.getElementById?.('sharedStats');
      if (!panel || !stats || typeof panel.querySelector !== 'function' || panel.querySelector('.community-reset-notice')) return;

      const notice = document.createElement('aside');
      notice.className = 'community-reset-notice';
      notice.setAttribute('aria-label', 'Community results reset notice');
      notice.innerHTML = '<strong>Community totals reset for v2.0</strong><p>The previous totals were collected while the quiz weights were not properly calibrated. Those results are excluded from the public counter. The v2.0 weights are now calibrated, so only results from the new reset point onward are counted.</p>';
      panel.insertBefore(notice, stats);

      const style = document.createElement('style');
      style.textContent = `
        .shared-stats-panel .community-reset-notice{float:left;width:min(245px,28%);margin:0 18px 14px 0;padding:12px 13px;border:1px solid #d5e0e7;border-radius:10px;background:#f6fafc;box-sizing:border-box}
        .shared-stats-panel .community-reset-notice strong{display:block;margin-bottom:5px;color:#315f85;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;line-height:1.3}
        .shared-stats-panel .community-reset-notice p{margin:0;color:#687983;font-size:11px;line-height:1.5}
        .shared-stats-panel .shared-stats{overflow:hidden}
        body.night-mode .shared-stats-panel .community-reset-notice{border-color:#3b5268;background:#203247}
        body.night-mode .shared-stats-panel .community-reset-notice strong{color:#79a9cf}
        body.night-mode .shared-stats-panel .community-reset-notice p{color:#9db0bf}
        @media(max-width:760px){.shared-stats-panel .community-reset-notice{float:none;width:auto;margin:0 0 12px}}
      `;
      document.head?.appendChild(style);
    };

    addCommunityResetNotice();
  }
})();
