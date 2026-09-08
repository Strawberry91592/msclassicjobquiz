// Optional shared-result counter endpoint.
// Leave blank to run the quiz without shared statistics.
// Example: https://maplestory-classic-quiz-stats.example.workers.dev
window.STATS_API_URL = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

// The quiz now opens directly on Question 1. Keep the former mode dialog out of
// view from the first paint, then let the existing app start routine initialize
// question 1 once all scripts have loaded. Also make the site's purpose explicit.
(() => {
  const style = document.createElement('style');
  style.textContent = '#modeModal{display:none!important}';
  document.head.appendChild(style);

  window.addEventListener('DOMContentLoaded', () => {
    const title = 'Find the Job That Fits Your Playstyle';
    const heading = document.querySelector('.brand-copy h1');
    if (heading) heading.textContent = title;
    document.title = `MapleStory Classic World • ${title}`;
  }, {once:true});

  window.setTimeout(() => {
    const startButton = document.querySelector('.mode-card[data-mode="12"]');
    if (startButton) startButton.click();
  }, 0);
})();
