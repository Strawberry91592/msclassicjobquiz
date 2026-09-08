const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {
  window: {
    fetch: async () => { throw new Error('Unexpected fetch in model test'); }
  },
  document: {
    getElementById() { return null; },
    createElement() { return { textContent: '', style: {}, appendChild() {} }; },
    head: { appendChild() {} }
  },
  MutationObserver: class {
    observe() {}
  },
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

assert.equal(questions.length, 48, 'The quiz must contain exactly 48 questions.');
assert.equal(
  JSON.stringify(questions.map(q => q.id)),
  JSON.stringify(Array.from({ length: 48 }, (_, i) => i + 1)),
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

const question = id => questions.find(q => q.id === id);
const optionText = (id, index) => question(id).options[index][1];

const approvedWording = {
  9: {
    text: question(9).text,
    options: [[0, 'A skill that gives me a strong result when I use it.']]
  },
  10: {
    text: 'You are fighting monsters that are giving you trouble. What would you rather have?',
    options: [
      [0, 'A stronger attack that can bring them down faster.'],
      [1, 'A way to attack them without getting too close.'],
      [2, 'A skill that works especially well against those monsters.'],
      [3, 'A way to recover and keep fighting without using as many potions.']
    ]
  },
  15: {
    text: 'You are fighting monsters that take a while to defeat. What would help you most?',
    options: [
      [0, 'A stronger attack against one monster.'],
      [1, 'A way to hit several monsters at once.'],
      [2, 'A way to attack safely from farther away.'],
      [3, 'A way to move into attack range more quickly.']
    ]
  },
  26: {
    text: 'You find a map where the monsters give good EXP. What would make you want to keep training there?',
    options: [
      [0, 'The monsters are quick to defeat.'],
      [1, 'I can attack without moving around much.'],
      [2, 'I can keep my potion use low.'],
      [3, 'The monsters are easy to hit in groups.']
    ]
  },
  32: {
    text: 'A training map starts getting crowded with monsters. What would you prefer to do?',
    options: [
      [0, 'Keep attacking the monster I am already focused on.'],
      [1, 'Hit several monsters around me at once.'],
      [2, 'Move away and attack them from a safer distance.'],
      [3, 'Move through the group and attack from a better position.']
    ]
  },
  35: {
    text: 'You enter a map with monsters spread across several platforms. What matters most?',
    options: [
      [0, 'Being able to attack from a long distance.'],
      [1, 'Being able to reach the monsters quickly.'],
      [2, 'Having attacks that can cover several monsters.'],
      [3, 'Having strong attacks when a monster is right in front of me.']
    ]
  },
  43: {
    text: 'You are fighting a monster that is stronger than the ones you normally train on. What do you do first?',
    options: [
      [0, 'Use my strongest attack and try to finish it quickly.'],
      [1, 'Keep my distance and attack safely.'],
      [2, 'Look for a way to hit it while avoiding its attacks.'],
      [3, 'Use attacks that can also deal with nearby monsters.']
    ]
  },
  46: {
    text: "You have enough SP for a skill you've been waiting to improve. What would you rather do?",
    options: [
      [0, 'Put the SP into the skill I use most often.'],
      [1, 'Save the SP for a skill I will need later.'],
      [2, 'Improve a skill that makes another part of my build work better.'],
      [3, 'Spend the SP on whichever upgrade gives me the biggest immediate improvement.']
    ]
  },
  47: {
    text: question(47).text,
    options: [[2, 'I like it when grouping monsters together leads to a big payoff.']]
  }
};

for (const [idString, expected] of Object.entries(approvedWording)) {
  const id = Number(idString);
  assert.equal(question(id).text, expected.text, `Question ${id} wording is incorrect.`);
  expected.options.forEach(([index, text]) => {
    assert.equal(optionText(id, index), text, `Question ${id} option ${index + 1} wording is incorrect.`);
  });
}

console.log('Scoring model checks passed: 48 questions, 10 jobs, 20 dimensions, all weights/vectors valid, enhancements executed, approved revisions present.');
