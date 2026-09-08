// Optional shared-result counter endpoint.
// Leave blank to run the quiz without shared statistics.
// Example: https://maplestory-classic-quiz-stats.example.workers.dev
window.STATS_API_URL = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

// Neutral-prior calibration is installed here because config.js loads before classes.js.
// The getter intentionally leaves CLASS_DATA untouched until the two normalization passes
// in classes.js have completed; the first post-normalization read receives the calibrated
// profiles used by the application and model tests.
(() => {
  const oldScale = {fighter:0.80,page:1.00,spearman:1.20,fp:1.30,il:0.85,cleric:0.90,hunter:0.95,crossbow:0.70,assassin:1.10,bandit:1.00};
  const newScale = {fighter:0.80,page:1.00,spearman:1.20,fp:1.30,il:0.85,cleric:0.90,hunter:0.95,crossbow:0.70,assassin:1.10,bandit:1.00};
  let backing = null;
  let reads = 0;
  let calibrated = false;

  const keyFor = cls => cls.branch === 'F/P Wizard' ? 'fp'
    : cls.branch === 'I/L Wizard' ? 'il'
    : cls.branch === 'Crossbowman' ? 'crossbow'
    : String(cls.branch || '').toLowerCase();

  const calibrate = () => {
    if (!backing || calibrated) return;
    for (const cls of Object.values(backing)) {
      const key = keyFor(cls);
      const undo = Number(oldScale[key] ?? 1);
      const apply = Number(newScale[key] ?? 1);
      for (const dim of Object.keys(cls.dims || {})) {
        const current = Number(cls.dims[dim] ?? 0.5);
        const base = undo ? 0.5 + (current - 0.5) / undo : 0.5;
        cls.dims[dim] = Math.max(0, Math.min(1, 0.5 + (base - 0.5) * apply));
      }
    }
    calibrated = true;
  };

  Object.defineProperty(window, 'CLASS_DATA', {
    configurable: true,
    get() {
      reads += 1;
      if (reads > 2) calibrate();
      return backing;
    },
    set(value) {
      backing = value;
      reads = 0;
      calibrated = false;
    }
  });
})();
