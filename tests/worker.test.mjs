import assert from 'node:assert/strict';
import worker from '../worker/worker.js';

const submissions = [];
let allowClientSubmission = true;
let allowIpSubmission = true;
let throwClientLimiter = false;
let throwAnalyticsWrite = false;
const VALID_CLIENT_KEY = 'quiz_test_client_key_7f9a21c8';
const calls = { client: [], ip: [] };
const env = {
  ALLOWED_ORIGIN: 'https://strawberry91592.github.io',
  DATASET_NAME: 'classic_quiz_results',
  COMMUNITY_RESET_AT: '2026-09-08 13:48:00',
  ACCOUNT_ID: 'test-account',
  ANALYTICS_READ_TOKEN: 'test-token',
  RESULTS: { writeDataPoint(point) { if (throwAnalyticsWrite) throw new Error('simulated Analytics failure'); submissions.push(point); } },
  CLIENT_RATE_LIMITER: {
    async limit({ key }) {
      assert.match(key, /^result:[A-Za-z0-9_-]{20,100}$/);
      calls.client.push(key);
      if (throwClientLimiter) throw new Error('simulated rate-limit failure');
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
  return worker.fetch(new Request('https://stats.example/result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://strawberry91592.github.io',
      'CF-Connecting-IP': '203.0.113.10',
      'X-Quiz-Client-Key': VALID_CLIENT_KEY,
      ...headers
    },
    body: JSON.stringify(body)
  }), env);
}

async function options(headers = {}) {
  return worker.fetch(new Request('https://stats.example/result', {
    method: 'OPTIONS',
    headers: { Origin: 'https://strawberry91592.github.io', ...headers }
  }), env);
}

let response = await options();
assert.equal(response.status, 200);
assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://strawberry91592.github.io');
assert.match(response.headers.get('Access-Control-Allow-Headers') || '', /X-Quiz-Client-Key/i);

response = await options({ Origin: 'https://evil.example' });
assert.equal(response.status, 403);

response = await post({ winner: 'bandit', mode: '12', answered: 20 });
assert.equal(response.status, 200);
assert.deepEqual(submissions.at(-1).blobs, ['bandit', '12']);
assert.equal(submissions.at(-1).doubles[0], 20);
assert.equal(calls.client.at(-1), `result:${VALID_CLIENT_KEY}`);
assert.equal(calls.ip.at(-1), 'result:203.0.113.10');

allowClientSubmission = false;
response = await post({ winner: 'bandit', mode: '12', answered: 20 });
assert.equal(response.status, 429);
assert.equal(response.headers.get('Retry-After'), '60');
assert.equal(submissions.length, 1);
assert.equal(calls.ip.length, 1);

allowClientSubmission = true;
allowIpSubmission = false;
response = await post({ winner: 'bandit', mode: '12', answered: 20 });
assert.equal(response.status, 429);
assert.equal(response.headers.get('Retry-After'), '60');
assert.equal(submissions.length, 1);
assert.equal(calls.ip.length, 2);

allowIpSubmission = true;
throwClientLimiter = true;
response = await post({ winner: 'bandit', mode: '12', answered: 20 });
assert.equal(response.status, 503);
assert.equal(submissions.length, 1);
throwClientLimiter = false;

throwAnalyticsWrite = true;
response = await post({ winner: 'bandit', mode: '12', answered: 20 });
assert.equal(response.status, 503);
throwAnalyticsWrite = false;

response = await post({ winner: 'bandit', mode: '12', answered: 20 }, { 'X-Quiz-Client-Key': '' });
assert.equal(response.status, 400);

for (const answered of [14, 21]) {
  response = await post({ winner: 'bandit', mode: '12', answered });
  assert.equal(response.status, 400);
}
response = await post({ winner: 'not-a-job', mode: '12', answered: 20 });
assert.equal(response.status, 400);
response = await post({ winner: 'bandit', mode: '999', answered: 20 });
assert.equal(response.status, 400);
response = await post({ winner: 'bandit', mode: '12', answered: 20 }, { Origin: 'https://evil.example' });
assert.equal(response.status, 403);

response = await worker.fetch(new Request('https://stats.example/result', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://strawberry91592.github.io', 'X-Quiz-Client-Key': VALID_CLIENT_KEY },
  body: '{not-json'
}), env);
assert.equal(response.status, 400);

const originalFetch = globalThis.fetch;
let capturedStatsSql = '';
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.cloudflare.com/client/v4/accounts/test-account/analytics_engine/sql');
  capturedStatsSql = options.body;
  return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
};
response = await worker.fetch(new Request('https://stats.example/stats'), env);
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), {
  ok: true,
  totals: { fighter:0, page:0, spearman:0, fp:0, il:0, cleric:0, hunter:0, crossbow:0, assassin:0, bandit:0 },
  total: 0
});
assert.match(capturedStatsSql, /timestamp >= toDateTime\('2026-09-08 13:48:00'\)/);

globalThis.fetch = async () => new Response('upstream failure', { status: 500 });
response = await worker.fetch(new Request('https://stats.example/stats'), env);
assert.equal(response.status, 502);
globalThis.fetch = originalFetch;

console.log('Worker checks passed: 15–20 eligibility bounds, valid 20-answer submission, layered rate limits, validation, CORS protection, reset cutoff, and failure handling.');