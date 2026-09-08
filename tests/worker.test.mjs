import assert from 'node:assert/strict';
import worker from '../worker/worker.js';

const submissions = [];
let allowClientSubmission = true;
let allowIpSubmission = true;
const VALID_CLIENT_KEY = 'quiz_test_client_key_7f9a21c8';
const calls = { client: [], ip: [] };

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
  CLIENT_RATE_LIMITER: {
    async limit({ key }) {
      assert.match(key, /^result:[A-Za-z0-9_-]{20,100}$/);
      calls.client.push(key);
      return { success: allowClientSubmission };
    }
  },
  IP_RATE_LIMITER: {
    async limit({ key }) {
      assert.match(key, /^result:.+/);
      calls.ip.push(key);
      return { success: allowIpSubmission };
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
      'X-Quiz-Client-Key': VALID_CLIENT_KEY,
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
assert.equal(calls.client.at(-1), `result:${VALID_CLIENT_KEY}`);
assert.equal(calls.ip.at(-1), 'result:203.0.113.10');

allowClientSubmission = false;
response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 429, 'Client-key rate-limited submissions must return HTTP 429.');
assert.equal(response.headers.get('Retry-After'), '60');
assert.equal(submissions.length, 1, 'A rate-limited request must not write an Analytics event.');
assert.equal(calls.ip.length, 1, 'The IP limiter should not run after the client limiter blocks a request.');

allowClientSubmission = true;
allowIpSubmission = false;
response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 429, 'IP rate-limited submissions must return HTTP 429.');
assert.equal(response.headers.get('Retry-After'), '60');
assert.equal(submissions.length, 1, 'An IP-rate-limited request must not write an Analytics event.');
assert.equal(calls.ip.length, 2, 'The IP limiter should run after the client limiter passes.');

allowIpSubmission = true;
response = await post({ winner: 'bandit', mode: '12', answered: 48 }, { 'X-Quiz-Client-Key': '' });
assert.equal(response.status, 400, 'A missing client key must be rejected.');

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

console.log('Worker checks passed: valid submission, layered client/IP rate limits, client-key validation, eligibility bounds, winner/mode validation, and Origin protection.');
