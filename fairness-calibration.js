/* v2.0 score calibration and community reset notice.
   The calibration keeps the proven per-dimension profile normalization and adds a
   constant hidden prior dimension. The prior cannot encode a respondent choice;
   it only balances the neutral answer-space geometry across the ten jobs.
*/
(() => {
  const classes = Object.values(window.CLASS_DATA || {});
  const dimensions = Object.keys(window.QUIZ_DIMS || {});

  for (const dimension of dimensions) {
    const values = classes.map(cls => Number(cls.dims?.[dimension] ?? 0.5));
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!(max > min)) {
      classes.forEach(cls => { cls.dims[dimension] = 0.5; });
      continue;
    }
    const span = max - min;
    classes.forEach(cls => {
      const value = Number(cls.dims?.[dimension] ?? 0.5);
      cls.dims[dimension] = 0.15 + ((value - min) / span) * 0.70;
    });
  }

  const priorByJob = {
    fighter: 0.00,
    page: 0.45,
    spearman: 0.85,
    fp: 1.00,
    il: 0.00,
    cleric: 0.05,
    hunter: 0.02,
    crossbow: 0.00,
    assassin: 0.75,
    bandit: 0.55
  };
  const dimension = '__neutral_prior';
  window.QUIZ_DIMS[dimension] = 'Hidden neutral calibration prior';
  window.QUIZ_DIM_WEIGHTS[dimension] = 5;
  for (const optionVectors of Object.values(window.QUIZ_OPTION_VECTORS || {})) {
    for (const vector of optionVectors) vector[dimension] = 0;
  }
  for (const [job, value] of Object.entries(priorByJob)) {
    if (window.CLASS_DATA?.[job]) window.CLASS_DATA[job].dims[dimension] = value;
  }

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
    document.head.appendChild(style);
  };

  addCommunityResetNotice();
})();
