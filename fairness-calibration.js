/* Quiz score calibration.
   Prototype-radius equalization removes structural advantage from profile extremity. The
   remaining class score calibration is a fixed affine transform per job, fitted against a
   deterministic uniform 10,000-response regression. Neither step changes question meaning.
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

  window.QUIZ_CLASS_SCORE_CALIBRATION = {
    fighter:   { scale: 1.0940, offset: -0.0002 },
    page:      { scale: 1.0185, offset:  0.0000 },
    spearman:  { scale: 0.9950, offset:  0.0004 },
    fp:        { scale: 0.9915, offset:  0.0004 },
    il:        { scale: 1.0140, offset:  0.0007 },
    cleric:    { scale: 1.0710, offset:  0.0001 },
    hunter:    { scale: 1.0460, offset: -0.0006 },
    crossbow:  { scale: 1.0840, offset: -0.0006 },
    assassin:  { scale: 1.0400, offset:  0.0002 },
    bandit:    { scale: 1.1095, offset:  0.0005 }
  };
})();
