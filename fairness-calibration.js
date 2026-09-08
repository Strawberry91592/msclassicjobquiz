/* Quiz score calibration.
   First apply the proven per-dimension prototype normalization used by the working model. Then
   add a fixed hidden prior dimension. The hidden dimension is constant for every answer, so it
   cannot encode a respondent choice; it only balances the neutral answer-space geometry.
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
})();
