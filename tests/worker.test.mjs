import assert from 'node:assert/strict';
import worker from '../worker/worker.js';

const submissions = [];
let allowSubmission = true;
const env = {
  ALLOWED_ORIGIN: 'https://strawberry91592.github.io',
  DATASET_NAME: 'classic_quiz_results',
  ACCOUNT_ID: 'test-account',
  ANALYTICS_READ_TOKEN: 'test-token',
  RESULTS: {
    writeDataPoint(point) {
      submissions.push(point);
    }
  },
  SUBMISSION_RATE_LIMITER: {
    async limit({ key }) {
      assert.match(key, /^result:/, 'The rate-limit key must be scoped to result submissions.');
      return { success: allowSubmission };
    }
  }
};

async function post(body, headers = {}) {
  const request = new Request('https://stats.example/result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://strawberry91592.github.io',
      'CF-Connecting-IP': '203.0.113.10',
      ...headers
    },
    body: JSON.stringify(body)
  });
  return worker.fetch(request, env);
}

let response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 200, 'A valid eligible submission should be accepted.');
assert.deepEqual(submissions.at(-1).blobs, ['bandit', '12']);
assert.equal(submissions.at(-1).doubles[0], 48);

allowSubmission = false;
response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 429, 'Rate-limited submissions must return HTTP 429.');
assert.equal(response.headers.get('Retry-After'), '60');
assert.equal(submissions.length, 1, 'A rate-limited request must not write an Analytics event.');

allowSubmission = true;
for (const answered of [29, 49]) {
  response = await post({ winner: 'bandit', mode: '12', answered });
  assert.equal(response.status, 400, `answered=${answered} must be rejected.`);
}
response = await post({ winner: 'not-a-job', mode: '12', answered: 48 });
assert.equal(response.status, 400, 'Unknown winners must be rejected.');
response = await post({ winner: 'bandit', mode: '999', answered: 48 });
assert.equal(response.status, 400, 'Unsupported quiz modes must be rejected.');
response = await post({ winner: 'bandit', mode: '12', answered: 48 }, { Origin: 'https://evil.example' });
assert.equal(response.status, 403, 'Submissions from a disallowed Origin must be rejected.');

console.log('Worker checks passed: valid submission, rate-limit rejection, eligibility bounds, winner/mode validation, and Origin protection.');
