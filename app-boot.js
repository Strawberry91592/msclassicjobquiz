// The site has one active quiz path. Create the legacy selector only as a
// temporary bridge for app.js's existing start handler, then remove it.
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
