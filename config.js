// Optional shared-result counter endpoint.
// Leave blank to run the quiz without shared statistics.
// Example: https://maplestory-classic-quiz-stats.example.workers.dev
window.STATS_API_URL = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

// app.js still has a private start routine that expects the old mode element.
// Provide both pieces only long enough to invoke that routine, then remove them.
(() => {
  const modalStub = document.createElement('section');
  modalStub.id = 'modeModal';
  modalStub.className = 'hidden';
  modalStub.setAttribute('aria-hidden', 'true');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'mode-card';
  trigger.dataset.mode = '12';
  trigger.hidden = true;

  document.body.appendChild(modalStub);
  document.body.appendChild(trigger);

  window.setTimeout(() => {
    trigger.click();
    trigger.remove();
    modalStub.remove();
  }, 0);
})();
