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

const W = context.window;
const questions = W.QUIZ_QUESTIONS;
const classes = W.CLASS_DATA;
const dims = W.QUIZ_DIMS;
const dimWeights = W.QUIZ_DIM_WEIGHTS;
const questionWeights = W.QUIZ_QUESTION_WEIGHTS;
const vectors = W.QUIZ_OPTION_VECTORS;
const calibration = W.QUIZ_CLASS_SCORE_CALIBRATION;
const dimKeys = Object.keys(dims);
const classKeys = Object.keys(classes);

assert.equal(questions.length, 20, 'The quiz must contain exactly 20 questions.');
assert.equal(JSON.stringify(questions.map(q => q.id)), JSON.stringify(Array.from({length: 20}, (_, i) => i + 1)), 'Question IDs must be a unique 1..20 sequence.');
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

assert.deepEqual(classKeys, ['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit'], 'The scoring model must contain exactly the ten current 2nd Jobs in approved order.');
assert.equal(dimKeys.length, 20, 'The scoring model must contain the 20 visible playstyle dimensions.');
assert.deepEqual(Object.keys(dimWeights).sort(), dimKeys.slice().sort(), 'Every scoring dimension must have a dimension weight.');
assert.deepEqual(Object.keys(calibration).sort(), classKeys.slice().sort(), 'Every job must have calibrated class-score parameters.');
for (const key of classKeys) {
  assert.ok(Number.isFinite(Number(calibration[key].scale)) && Number(calibration[key].scale) > 0, `${key} must have a positive calibration scale.`);
  assert.ok(Number.isFinite(Number(calibration[key].offset)), `${key} must have a finite calibration offset.`);
}

for (let id = 1; id <= 20; id += 1) {
  const weight = Number(questionWeights[String(id)]);
  assert.ok(Number.isFinite(weight) && weight > 0, `Question ${id} must have a positive question weight.`);
  assert.equal(vectors[String(id)].length, 4, `Question ${id} must have exactly four option vectors.`);
  for (const vector of vectors[String(id)]) {
    for (const [dimension, value] of Object.entries(vector)) {
      assert.ok(dimKeys.includes(dimension), `Question ${id} uses unknown dimension ${dimension}.`);
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `Question ${id} vector ${dimension} is outside 0..1.`);
    }
  }
}

for (const [key, profile] of Object.entries(classes)) {
  for (const dimension of dimKeys) {
    const value = profile.dims?.[dimension];
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `${key} is missing a valid ${dimension} profile value.`);
  }
}

const questionWeightValues = Object.values(questionWeights).map(Number);
assert.ok(Math.min(...questionWeightValues) >= 0.84 && Math.max(...questionWeightValues) <= 1.13, 'Question weights must remain within the balanced range.');
const weightMean = questionWeightValues.reduce((a,b) => a+b, 0) / questionWeightValues.length;
assert.ok(Math.abs(weightMean - 1.002) < 0.001, `Question weights must remain centered around 1.002; got ${weightMean.toFixed(4)}.`);
assert.equal(W.QUIZ_JOB_GUIDES.bandit.length, 2, 'Each job must retain two guide links.');

function nv(s) { return Object.fromEntries(dimKeys.map(d => [d, typeof s?.[d] === 'number' ? s[d] : 0.5])); }
function pref(question, rankedLetters, keys = dimKeys) {
  const aggregate = Object.fromEntries(keys.map(d => [d, 0.5]));
  const evidence = Object.fromEntries(keys.map(d => [d, 0]));
  rankedLetters.forEach((letter, rank) => {
    const p = nv(vectors[question.id]?.[letter.charCodeAt(0) - 65]);
    const weight = Number(questionWeights[question.id] ?? 1) * ([1,0.72,0.5,0.34][rank] ?? 0.25);
    keys.forEach(d => {
      const signal = Math.abs(p[d] - 0.5) * 2;
      if (signal < 0.08) return;
      const contribution = weight * signal;
      const blend = contribution / (evidence[d] + contribution + 0.0001);
      aggregate[d] = aggregate[d] * (1 - blend) + p[d] * blend;
      evidence[d] += contribution;
    });
  });
  return {aggregate, evidence};
}
function score(answers, useCalibration = true, keys = dimKeys) {
  const user = Object.fromEntries(keys.map(d => [d, 0.5]));
  const uw = Object.fromEntries(keys.map(d => [d, 0]));
  answers.forEach((letters, i) => {
    const {aggregate, evidence} = pref(questions[i], letters, keys);
    keys.forEach(d => {
      if (!evidence[d]) return;
      const old = uw[d], next = old + evidence[d];
      user[d] = old ? (user[d] * old + aggregate[d] * evidence[d]) / next : aggregate[d];
      uw[d] = next;
    });
  });
  const out = {};
  for (const key of classKeys) {
    let sum = 0, den = 0;
    keys.forEach(d => {
      if (!uw[d]) return;
      const w = (dimWeights[d] || 1) * uw[d];
      sum += (1 - Math.min(1, Math.abs(user[d] - classes[key].dims[d]))) * w;
      den += w;
    });
    const raw = den ? sum / den : 0.5;
    if (useCalibration) out[key] = (raw * Number(calibration[key].scale) + Number(calibration[key].offset)) * 100;
    else out[key] = raw;
  }
  return {scores: out, user};
}
function winner(scores) { return classKeys.reduce((best, key) => scores[key] > scores[best] ? key : best, classKeys[0]); }

// The hidden fairness correction must not redefine a job's visible playstyle fingerprint.
for (const target of classKeys) {
  const answers = questions.map(question => {
    let best = 'A', bestDistance = Infinity;
    for (const [letter] of question.options) {
      const p = nv(vectors[question.id][letter.charCodeAt(0) - 65]);
      let distance = 0, total = 0;
      for (const d of dimKeys) {
        const signal = Math.abs(p[d] - 0.5) * 2;
        if (signal < 0.08) continue;
        const w = dimWeights[d] || 1;
        distance += Math.abs(p[d] - classes[target].dims[d]) * w;
        total += w;
      }
      const nd = total ? distance / total : 0.5;
      if (nd < bestDistance) { bestDistance = nd; best = letter; }
    }
    return [best];
  });
  assert.equal(winner(score(answers, false, dimKeys).scores), target, `Synthetic answer fingerprint for ${target} does not recover the intended class.`);
}

let seed = 0x9e3779b9;
function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0x100000000; }
const iterations = 10000;
const counts = Object.fromEntries(classKeys.map(k => [k, 0]));
for (let i = 0; i < iterations; i += 1) {
  const answers = questions.map(() => [String.fromCharCode(65 + Math.floor(random() * 4))]);
  counts[winner(score(answers, true, dimKeys).scores)] += 1;
}
const expected = iterations / classKeys.length;
const buffer = iterations * 0.003;
for (const key of classKeys) {
  assert.ok(counts[key] >= expected - buffer && counts[key] <= expected + buffer,
    `Uniform-neutral fairness failed for ${key}: got ${counts[key]}, expected ${expected-buffer}–${expected+buffer}. Full counts: ${JSON.stringify(counts)}`);
}

console.log(`v2.0 model checks passed: 20 questions, 10 jobs, 20 visible dimensions, calibrated class scoring, all synthetic fingerprints, and 10,000 uniform-neutral profiles within ±0.3 percentage points of 10%. Counts: ${JSON.stringify(counts)}`);
