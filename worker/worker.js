const ALLOWED_WINNERS = new Set(['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit']);
const CURRENT_MODE = '12';
const COMMUNITY_MIN_ANSWERED = 30;
const COMMUNITY_MAX_ANSWERED = 48;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const configuredOrigin = env.ALLOWED_ORIGIN || '*';
    const requestOrigin = request.headers.get('Origin') || '';
    const headers = {
      'Access-Control-Allow-Origin': configuredOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) {
        return json({ ok:false, error:'Origin not allowed.' }, headers, 403);
      }
      return new Response(null, { headers });
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      try {
        return json(await queryStats(env), headers);
      } catch {
        return json({ ok:false, error:'Stats read failed.', totals:{}, total:0 }, headers, 502);
      }
    }

    if (url.pathname === '/result' && request.method === 'POST') {
      try {
        if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) {
          return json({ ok:false, error:'Origin not allowed.' }, headers, 403);
        }

        const body = await request.json();
        const winner = typeof body.winner === 'string' ? body.winner : '';
        const mode = String(body.mode ?? '');
        const answered = Number(body.answered);

        // Validate the submission before consuming the rate-limit allowance.
        if (mode !== CURRENT_MODE) return json({ ok:false, error:'Unsupported quiz mode.' }, headers, 400);
        if (!Number.isInteger(answered) || answered < COMMUNITY_MIN_ANSWERED || answered > COMMUNITY_MAX_ANSWERED) {
          return json({ ok:false, error:'Incomplete result.' }, headers, 400);
        }
        if (!ALLOWED_WINNERS.has(winner)) return json({ ok:false, error:'Invalid result.' }, headers, 400);

        if (!env.SUBMISSION_RATE_LIMITER) {
          return json({ ok:false, error:'Submission protection unavailable.' }, headers, 503);
        }

        // There is no durable anonymous user ID. Use Cloudflare's client IP as
        // a transient abuse-control key; the IP is not written to Analytics Engine.
        // The binding itself is eventually consistent and location-local, so this
        // is abuse mitigation rather than an exact accounting guarantee.
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const { success } = await env.SUBMISSION_RATE_LIMITER.limit({ key: `result:${clientIp}` });
        if (!success) {
          return json(
            { ok:false, error:'Too many submissions. Please wait before submitting another result.' },
            { ...headers, 'Retry-After':'60' },
            429
          );
        }

        // Analytics Engine writes are intentionally non-blocking. The submitted
        // answered count is retained for auditing, while blob2 preserves the
        // current mode marker used by the read query. Older valid records used
        // double1=1, so the GET query must not discard them.
        env.RESULTS.writeDataPoint({
          blobs: [winner, CURRENT_MODE],
          doubles: [answered, Number(CURRENT_MODE)],
          indexes: ['classic-quiz']
        });

        return json({ ok:true }, headers, 200);
      } catch {
        return json({ ok:false, error:'Invalid request.' }, headers, 400);
      }
    }

    return json({ ok:false, error:'Not found.' }, headers, 404);
  }
};

async function queryStats(env) {
  // Restrict reads to the ten current 2nd Jobs and the current quiz mode.
  // Existing eligible v1 records use the classic-quiz index and blob2='12'.
  // SUM(_sample_interval) is required for correct counts when Analytics Engine
  // samples data.
  const winners = [...ALLOWED_WINNERS].map(value => `'${value}'`).join(', ');
  const sql = `SELECT blob1 AS winner, SUM(_sample_interval) AS count FROM ${env.DATASET_NAME} WHERE index1 = 'classic-quiz' AND blob2 = '${CURRENT_MODE}' AND blob1 IN (${winners}) GROUP BY winner ORDER BY count DESC`;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.ANALYTICS_READ_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: sql
  });

  if (!response.ok) throw new Error(`Analytics SQL returned ${response.status}`);
  const payload = await response.json();
  if (payload?.success === false) throw new Error('Analytics SQL rejected the query');

  const totals = Object.fromEntries([...ALLOWED_WINNERS].map(key => [key, 0]));
  let total = 0;
  for (const row of (payload.data || [])) {
    if (!ALLOWED_WINNERS.has(row.winner)) continue;
    const count = Number(row.count || 0);
    totals[row.winner] += count;
    total += count;
  }
  return { ok:true, totals, total };
}

function json(data, headers, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type':'application/json' }
  });
}
