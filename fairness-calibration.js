/* Uniform-neutral answer-space calibration.
   This hidden dimension is constant for every answer, so it cannot represent a respondent trait.
   It acts only as a class-specific prior that compensates for structural differences in the
   visible playstyle prototype geometry. Visible question vectors and class dimensions remain
   unchanged.
*/
(() => {
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
  window.QUIZ_NEUTRAL_CLASS_PRIORS = priorByJob;
})();
