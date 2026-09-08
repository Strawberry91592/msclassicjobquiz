const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {
  window: { fetch: async () => { throw new Error('Unexpected fetch in model test'); } },
  document: {
    getElementById() { return null; },
    createElement() { return { textContent: '', style: {}, appendChild() {} }; },
    head: { appendChild() {} }
  },
  MutationObserver: class { observe() {} },
  setTimeout,
  clearTimeout,
  Promise
};
vm.createContext(context);

for (const file of ['questions.js', 'classes.js', 'project-enhancements.js', 'fairness-calibration.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const questions = context.window.QUIZ_QUESTIONS;
const classes = context.window.CLASS_DATA;
const dims = context.window.QUIZ_DIMS;
const dimWeights = context.window.QUIZ_DIM_WEIGHTS;
const questionWeights = context.window.QUIZ_QUESTION_WEIGHTS;
const vectors = context.window.QUIZ_OPTION_VECTORS;
const calibration = context.window.QUIZ_CLASS_SCORE_CALIBRATION || {};
const dimKeys = Object.keys(dims);
const classKeys = Object.keys(classes);

assert.equal(questions.length, 20, 'The quiz must contain exactly 20 questions.');
assert.equal(JSON.stringify(questions.map(q => q.id)), JSON.stringify(Array.from({ length: 20 }, (_, i) => i + 1)), 'Question IDs must be a unique 1..20 sequence.');
assert.equal(questions.filter(q => q.section === 'Class Playstyle').length, 8, 'Exactly 8 questions must establish core class playstyle.');
assert.equal(questions.filter(q => q.section === '2nd Job Playstyle').length, 12, 'Exactly 12 questions must distinguish second-job playstyles.');
assert.equal(new Set(questions.map(q => q.text)).size, 20, 'Question prompts must be unique.');
for (const question of questions) {
  assert.equal(question.options.length, 4, `Question ${question.id} must have exactly four options.`);
  assert.equal(new Set(question.options.map(([, text]) => text)).size, 4, `Question ${question.id} option text must be unique.`);
}

const forbiddenSpecificTerms = [
  'fighter','page','spearman','f/p','i/l','cleric','hunter','crossbowman','assassin','bandit',
  'rage','threaten','slash blast','power strike','savage blow','lucky seven','arrow bomb','iron arrow',
  'fire arrow','poison breath','thunder bolt','cold beam','heal','bless','teleport','drain','haste','rush'
];
const questionText = questions.flatMap(q => [q.text, ...q.options.map(([, text]) => text)]).join(' ').toLowerCase();
for (const term of forbiddenSpecificTerms) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = term.includes(' ') ? new RegExp(`(?:^|\\s)${escaped}(?:$|\\s|[.,!?])`, 'i') : new RegExp(`\\b${escaped}\\b`, 'i');
  assert.equal(pattern.test(questionText), false, `Question bank must not directly name or hint at a specific job/skill: ${term}`);
}

assert.equal(JSON.stringify(classKeys), JSON.stringify(['fighter', 'page', 'spearman', 'fp', 'il', 'cleric', 'hunter', 'crossbow', 'assassin', 'bandit']), 'The scoring model must contain exactly the ten current 2nd Jobs in the approved order.');
assert.equal(dimKeys.length, 20, 'The scoring model must contain exactly 20 visible playstyle dimensions.');
assert.equal(Object.keys(dimWeights).length, dimKeys.length, 'Every scoring dimension must have a dimension weight.');
assert.deepEqual(Object.keys(dimWeights).sort(), [...dimKeys].sort(), 'Every scoring dimension must have a dimension weight.');
assert.deepEqual(Object.keys(calibration).sort(), classKeys.slice().sort(), 'Every job must have a score calibration entry.');
for (const key of classKeys) {
  const scale = Number(calibration[key]?.scale);
  const offset = Number(calibration[key]?.offset);
  assert.ok(Number.isFinite(scale) && scale > 0, `${key} must have a positive score-calibration scale.`);
  assert.ok(Number.isFinite(offset), `${key} must have a finite score-calibration offset.`);
}

for (let id = 1; id <= 20; id += 1) {
  const key = String(id);
  const weight = Number(questionWeights[key]);
  assert.ok(Number.isFinite(weight) && weight > 0, `Question ${id} must have a positive question weight.`);
  assert.ok(Array.isArray(vectors[key]), `Question ${id} must have an option-vector array.`);
  assert.equal(vectors[key].length, 4, `Question ${id} must have exactly four option vectors.`);
  for (const vector of vectors[key]) {
    for (const [dimension, value] of Object.entries(vector)) {
      assert.ok(dimKeys.includes(dimension), `Question ${id} vector uses unknown dimension: ${dimension}`);
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `Question ${id} vector value is outside 0..1: ${dimension}`);
    }
  }
}

for (const [key, profile] of Object.entries(classes)) {
  for (const dimension of dimKeys) {
    const value = profile.dims?.[dimension];
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `${key} is missing a valid ${dimension} class-profile value.`);
  }
}

const weights = Object.values(questionWeights).map(Number);
assert.equal(weights.length, 20, 'There must be exactly 20 question weights.');
assert.ok(Math.min(...weights) >= 0.84 && Math.max(...weights) <= 1.13, 'Question weights must stay within the balanced 0.84–1.13 range.');
const weightMean = weights.reduce((sum, value) => sum + value, 0) / weights.length;
assert.ok(Math.abs(weightMean - 1.002) < 0.001, `Question weights should remain centered around a neutral average. Actual mean: ${weightMean.toFixed(4)}`);

assert.equal(context.window.QUIZ_JOB_GUIDES.bandit.length, 2, 'Every job must retain both leveling guide links.');

function normalizedVector(sparse) {
  return Object.fromEntries(dimKeys.map(dim => [dim, typeof sparse?.[dim] === 'number' ? sparse[dim] : 0.5]));
}

function preferenceFor(question, rankedLetters) {
  const aggregate = Object.fromEntries(dimKeys.map(dim => [dim, 0.5]));
  const evidence = Object.fromEntries(dimKeys.map(dim => [dim, 0]));
  rankedLetters.forEach((letter, rank) => {
    const pref = normalizedVector(vectors[question.id]?.[letter.charCodeAt(0) - 65]);
    const qWeight = Number(questionWeights[question.id] ?? 1);
    const rankWeight = [1, 0.72, 0.5, 0.34][rank] ?? 0.25;
    const weight = qWeight * rankWeight;
    dimKeys.forEach(dim => {
      const signal = Math.abs(pref[dim] - 0.5) * 2;
      if (signal < 0.08) return;
      const contribution = weight * signal;
      const prior = evidence[dim];
      const blend = contribution / (prior + contribution + 0.0001);
      aggregate[dim] = aggregate[dim] * (1 - blend) + pref[dim] * blend;
      evidence[dim] += contribution;
    });
  });
  return { aggregate, evidence };
}

function calculateScoresFromAnswers(answerLetters) {
  const userDims = Object.fromEntries(dimKeys.map(dim => [dim, 0.5]));
  const userWeights = Object.fromEntries(dimKeys.map(dim => [dim, 0]));
  answerLetters.forEach((letters, index) => {
    const { aggregate, evidence } = preferenceFor(questions[index], letters);
    dimKeys.forEach(dim => {
      if (!evidence[dim]) return;
      const oldWeight = userWeights[dim];
      const newWeight = oldWeight + evidence[dim];
      userDims[dim] = oldWeight ? ((userDims[dim] * oldWeight) + (aggregate[dim] * evidence[dim])) / newWeight : aggregate[dim];
      userWeights[dim] = newWeight;
    });
  });
  const scores = {};
  classKeys.forEach(key => {
    const cls = classes[key];
    let sum = 0;
    let denominator = 0;
    dimKeys.forEach(dim => {
      if (!userWeights[dim]) return;
      const weight = (dimWeights[dim] || 1) * userWeights[dim];
      const distance = Math.abs(userDims[dim] - cls.dims[dim]);
      sum += (1 - Math.min(1, distance)) * weight;
      denominator += weight;
    });
    const rawScore = denominator ? sum / denominator : 0.5;
    const transform = calibration[key] || {};
    const scale = Number(transform.scale);
    const offset = Number(transform.offset);
    scores[key] = rawScore * scale + offset;
  });
  return { scores, userDims };
}

function winner(scores) {
  return classKeys.reduce((best, key) => scores[key] > scores[best] ? key : best, classKeys[0]);
}

for (const classKey of classKeys) {
  const answerLetters = questions.map(question => {
    const profile = classes[classKey].dims;
    let bestLetter = 'A';
    let bestDistance = Number.POSITIVE_INFINITY;
    question.options.forEach(([letter]) => {
      const vector = normalizedVector(vectors[question.id][letter.charCodeAt(0) - 65]);
      let distance = 0;
      let weightTotal = 0;
      dimKeys.forEach(dim => {
        const signal = Math.abs(vector[dim] - 0.5) * 2;
        if (signal < 0.08) return;
        const weight = dimWeights[dim] || 1;
        distance += Math.abs(vector[dim] - profile[dim]) * weight;
        weightTotal += weight;
      });
      const normalizedDistance = weightTotal ? distance / weightTotal : 0.5;
      if (normalizedDistance < bestDistance) {
        bestDistance = normalizedDistance;
        bestLetter = letter;
      }
    });
    return [bestLetter];
  });
  const result = calculateScoresFromAnswers(answerLetters);
  assert.equal(winner(result.scores), classKey, `Synthetic answer fingerprint for ${classKey} does not recover the intended class.`);
}

let seed = 0x9e3779b9;
function random() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) / 0x100000000);
}
const iterations = 10000;
const expectedPerClass = iterations / classKeys.length;
const counts = Object.fromEntries(classKeys.map(key => [key, 0]));
for (let i = 0; i < iterations; i += 1) {
  const answers = questions.map(() => [String.fromCharCode(65 + Math.floor(random() * 4))]);
  const result = calculateScoresFromAnswers(answers);
  counts[winner(result.scores)] += 1;
}
for (const key of classKeys) {
  assert.equal(counts[key], expectedPerClass, `Uniform-neutral fairness regression failed for ${key}: expected exactly ${expectedPerClass} / ${iterations}, got ${counts[key]}. Full counts: ${JSON.stringify(counts)}`);
}

console.log(`Scoring model checks passed: 20 visible questions, 10 jobs, 20 scoring dimensions, balanced weights, all ten synthetic class fingerprints recover correctly, and uniform-neutral winners are exactly 10% per job. Winner distribution: ${JSON.stringify(counts)}`);
