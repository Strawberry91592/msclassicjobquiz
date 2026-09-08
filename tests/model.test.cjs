const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'questions.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'classes.js'), 'utf8'), context);

const questions = context.window.QUIZ_QUESTIONS;
const classes = context.window.CLASS_DATA;
const dims = context.window.QUIZ_DIMS;
const dimWeights = context.window.QUIZ_DIM_WEIGHTS;
const questionWeights = context.window.QUIZ_QUESTION_WEIGHTS;
const vectors = context.window.QUIZ_OPTION_VECTORS;
const enhancements = fs.readFileSync(path.join(root, 'project-enhancements.js'), 'utf8');

assert.equal(questions.length, 48, 'The quiz must contain exactly 48 questions.');
assert.deepEqual(
  questions.map(q => q.id),
  Array.from({ length: 48 }, (_, i) => i + 1),
  'Question IDs must be a unique 1..48 sequence.'
);

const classKeys = Object.keys(classes);
assert.deepEqual(
  classKeys,
  ['fighter', 'page', 'spearman', 'fp', 'il', 'cleric', 'hunter', 'crossbow', 'assassin', 'bandit'],
  'The scoring model must contain exactly the ten current 2nd Jobs in the approved order.'
);

const dimKeys = Object.keys(dims);
assert.equal(dimKeys.length, 20, 'The scoring model must contain exactly 20 playstyle dimensions.');

for (const [key, weight] of Object.entries(dimWeights)) {
  assert.ok(dimKeys.includes(key), `Dimension weight references unknown dimension: ${key}`);
  assert.ok(Number.isFinite(weight) && weight > 0, `Dimension weight must be positive: ${key}`);
}
assert.deepEqual(
  Object.keys(dimWeights).sort(),
  [...dimKeys].sort(),
  'Every playstyle dimension must have a dimension weight.'
);

for (let id = 1; id <= 48; id += 1) {
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

assert.ok(enhancements.includes("A skill that gives me a strong result when I use it."), 'Approved Q9 wording revision is missing.');
assert.ok(enhancements.includes('You are fighting monsters that are giving you trouble. What would you rather have?'), 'Approved Q10 wording revision is missing.');
assert.ok(enhancements.includes('You are fighting monsters that take a while to defeat. What would help you most?'), 'Approved Q15 wording revision is missing.');
assert.ok(enhancements.includes('You find a map where the monsters give good EXP. What would make you want to keep training there?'), 'Approved Q26 wording revision is missing.');
assert.ok(enhancements.includes('A training map starts getting crowded with monsters. What would you prefer to do?'), 'Approved Q32 wording revision is missing.');
assert.ok(enhancements.includes('You enter a map with monsters spread across several platforms. What matters most?'), 'Approved Q35 wording revision is missing.');
assert.ok(enhancements.includes('You are fighting a monster that is stronger than the ones you normally train on. What do you do first?'), 'Approved Q43 wording revision is missing.');
assert.ok(enhancements.includes("You have enough SP for a skill you've been waiting to improve. What would you rather do?"), 'Approved Q46 wording revision is missing.');
assert.ok(enhancements.includes('I like it when grouping monsters together leads to a big payoff.'), 'Approved Q47 wording revision is missing.');

console.log('Scoring model checks passed: 48 questions, 10 jobs, 20 dimensions, all weights/vectors valid, approved revisions present.');
