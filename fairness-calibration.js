/* Quiz score calibration.
   Equalize weighted prototype radius to remove structural bias, then add a fixed hidden prior
   dimension. The hidden dimension is constant for every answer, so it cannot encode a response;
   it only balances the neutral answer-space geometry between the ten jobs.
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
  if (radii.length) {
    const target = radii[Math.floor(radii.length / 2)];
    classes.forEach(cls => {
      const current = radius(cls);
      if (!(current > 0)) return;
      const scale = target / current;
      dimensions.forEach(dim => {
        cls.dims[dim] = 0.5 + (Number(cls.dims[dim] ?? 0.5) - 0.5) * scale;
      });
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
})();
