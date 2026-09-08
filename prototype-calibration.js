/* Core class-space calibration.
   The scorer uses weighted Manhattan distance, so equalizing each class prototype's weighted
   L1 distance from neutral removes a structural advantage caused only by prototype extremity.
   This preserves each job's direction in the playstyle space without encoding answer content.
*/
(() => {
  const classes = Object.values(window.CLASS_DATA || {});
  const dimensions = Object.keys(window.QUIZ_DIMS || {});
  const weights = window.QUIZ_DIM_WEIGHTS || {};
  const radius = cls => dimensions.reduce((sum, dim) => {
    return sum + Number(weights[dim] ?? 1) * Math.abs(Number(cls.dims?.[dim] ?? 0.5) - 0.5);
  }, 0);
  const radii = classes
    .map(radius)
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (!radii.length) return;
  const target = radii[Math.floor(radii.length / 2)];
  classes.forEach(cls => {
    const current = radius(cls);
    if (!(current > 0)) return;
    const scale = target / current;
    dimensions.forEach(dim => {
      cls.dims[dim] = 0.5 + (Number(cls.dims[dim] ?? 0.5) - 0.5) * scale;
    });
  });
})();
