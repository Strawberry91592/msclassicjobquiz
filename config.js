// Optional shared-result counter endpoint.
// Leave blank to run the quiz without shared statistics.
// Example: https://maplestory-classic-quiz-stats.example.workers.dev
window.STATS_API_URL = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

// The quiz has one active path. The old mode selector is no longer rendered,
// so create a temporary hidden trigger for app.js and remove it immediately.
(() => {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'mode-card';
  trigger.dataset.mode = '12';
  trigger.hidden = true;
  document.body.appendChild(trigger);
  window.setTimeout(() => {
    trigger.click();
    trigger.remove();
  }, 0);
})();
