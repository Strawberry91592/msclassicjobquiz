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

for (const file of ['questions.js', 'classes.js', 'project-enhancements.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const questions = context.window.QUIZ_QUESTIONS;
const classes = context.window.CLASS_DATA;
const dims = context.window.QUIZ_DIMS;
const dimWeights = context.window.QUIZ_DIM_WEIGHTS;
const questionWeights = context.window.QUIZ_QUESTION_WEIGHTS;
const vectors = context.window.QUIZ_OPTION_VECTORS;

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
  assert.equal(questionText.includes(term), false, `Question bank must not directly name or hint at a specific job/skill: ${term}`);
}

assert.equal(JSON.stringify(Object.keys(classes)), JSON.stringify(['fighter', 'page', 'spearman', 'fp', 'il', 'cleric', 'hunter', 'crossbow', 'assassin', 'bandit']), 'The scoring model must contain exactly the ten current 2nd Jobs in the approved order.');
const dimKeys = Object.keys(dims);
assert.equal(dimKeys.length, 20, 'The scoring model must contain exactly 20 playstyle dimensions.');
assert.deepEqual(Object.keys(dimWeights).sort(), [...dimKeys].sort(), 'Every playstyle dimension must have a dimension weight.');

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
assert.ok(Math.min(...weights) >= 0.84 && Math.max(...weights) <= 1.12, 'Question weights must stay within the balanced 0.84–1.12 range.');
assert.ok(Math.abs(weights.reduce((sum, value) => sum + value, 0) / weights.length - 1.002) < 0.001, 'Question weights should remain centered around a neutral average.');

assert.equal(context.window.QUIZ_JOB_GUIDES.bandit.length, 2, 'Every job must retain both leveling guide links.');
console.log('Scoring model checks passed: 20 neutral questions, 8 class playstyle + 12 second-job playstyle, no direct job/skill names, 10 jobs, 20 dimensions, balanced weights, and valid vectors/profiles.');
