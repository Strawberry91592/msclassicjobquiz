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
  RESULTS: {
    writeDataPoint(point) {
      if (throwAnalyticsWrite) throw new Error('simulated Analytics failure');
      submissions.push(point);
    }
  },
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

async function options(headers = {}) {
  const request = new Request('https://stats.example/result', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://strawberry91592.github.io',
      ...headers
    }
  });
  return worker.fetch(request, env);
}

let response = await options();
assert.equal(response.status, 200, 'A valid CORS preflight should succeed.');
assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://strawberry91592.github.io');
assert.match(response.headers.get('Access-Control-Allow-Headers') || '', /X-Quiz-Client-Key/i);

response = await options({ Origin: 'https://evil.example' });
assert.equal(response.status, 403, 'A disallowed Origin must fail CORS preflight.');

response = await post({ winner: 'bandit', mode: '12', answered: 48 });
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
throwClientLimiter = true;
response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 503, 'A rate-limit service failure must return HTTP 503.');
assert.equal(submissions.length, 1, 'A failed rate-limit check must not write an Analytics event.');
throwClientLimiter = false;

throwAnalyticsWrite = true;
response = await post({ winner: 'bandit', mode: '12', answered: 48 });
assert.equal(response.status, 503, 'An Analytics write failure must return HTTP 503.');
throwAnalyticsWrite = false;

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

const malformed = new Request('https://stats.example/result', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://strawberry91592.github.io',
    'X-Quiz-Client-Key': VALID_CLIENT_KEY
  },
  body: '{not-json'
});
response = await worker.fetch(malformed, env);
assert.equal(response.status, 400, 'Malformed JSON must be rejected as a client error.');

const originalFetch = globalThis.fetch;
let capturedStatsSql = '';
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.cloudflare.com/client/v4/accounts/test-account/analytics_engine/sql');
  capturedStatsSql = options.body;
  return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
};

response = await worker.fetch(new Request('https://stats.example/stats'), env);
assert.equal(response.status, 200, 'Stats should remain readable after applying the reset cutoff.');
assert.deepEqual(await response.json(), {
  ok: true,
  totals: {
    fighter: 0,
    page: 0,
    spearman: 0,
    fp: 0,
    il: 0,
    cleric: 0,
    hunter: 0,
    crossbow: 0,
    assassin: 0,
    bandit: 0
  },
  total: 0
});
assert.match(
  capturedStatsSql,
  /timestamp >= toDateTime\('2026-09-08 13:48:00'\)/,
  'Community stats must exclude all Analytics Engine events before the reset cutoff.'
);

globalThis.fetch = async () => new Response('upstream failure', { status: 500 });
response = await worker.fetch(new Request('https://stats.example/stats'), env);
assert.equal(response.status, 502, 'An Analytics stats failure must return HTTP 502.');
globalThis.fetch = originalFetch;

console.log('Worker checks passed: CORS preflight, valid submission, layered client/IP rate limits, infrastructure-error status handling, client-key validation, eligibility bounds, winner/mode validation, malformed JSON, Origin protection, stats reset cutoff, and stats failure handling.');
