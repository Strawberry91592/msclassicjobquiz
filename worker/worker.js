const ALLOWED_WINNERS = new Set(['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit']);
const CURRENT_MODE = '12';
const COMMUNITY_MIN_ANSWERED = 30;
const COMMUNITY_MAX_ANSWERED = 48;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (url.pathname === '/stats' && request.method === 'GET') {
      try {
        return json(await queryStats(env), headers);
      } catch {
        return json({ ok:false, error:'Stats read failed.', totals:{}, total:0 }, headers, 502);
      }
    }

    if (url.pathname === '/result' && request.method === 'POST') {
      try {
        const body = await request.json();
        const winner = typeof body.winner === 'string' ? body.winner : '';
        const mode = String(body.mode ?? '');
        const answered = Number(body.answered);

        // Community eligibility is enforced here, not just in the browser.
        if (mode !== CURRENT_MODE) return json({ ok:false, error:'Unsupported quiz mode.' }, headers, 400);
        if (!Number.isInteger(answered) || answered < COMMUNITY_MIN_ANSWERED || answered > COMMUNITY_MAX_ANSWERED) {
          return json({ ok:false, error:'Incomplete result.' }, headers, 400);
        }
        if (!ALLOWED_WINNERS.has(winner)) return json({ ok:false, error:'Invalid result.' }, headers, 400);

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
