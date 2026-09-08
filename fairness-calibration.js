/* v2.0 score calibration and community reset notice.
   Calibration is applied at the class-score layer so the question vectors and
   class playstyle profiles remain unchanged.
*/
(() => {
  window.QUIZ_CLASS_SCORE_CALIBRATION = {};

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
