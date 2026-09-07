export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (url.pathname === '/stats' && request.method === 'GET') {
      const data = await queryStats(env);
      return json(data, headers);
    }

    if (url.pathname === '/result' && request.method === 'POST') {
      try {
        const body = await request.json();
        const winner = typeof body.winner === 'string' ? body.winner : '';
        const allowed = new Set(['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit']);
        const answered = Number(body.answered);
        if (!Number.isInteger(answered) || answered < 30 || answered > 48) return json({ ok:false, error:'Incomplete result.' }, headers, 400);
        if (!allowed.has(winner)) return json({ ok:false, error:'Invalid result.' }, headers, 400);

        // Store only anonymous aggregate dimensions. No quiz answers, IPs, names,
        // identifiers, or other user data are written.
        env.RESULTS.writeDataPoint({
          blobs: [winner, String(body.mode || '12')],
          doubles: [1],
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
  // Analytics Engine's SQL endpoint requires account credentials, which are kept
  // server-side as Worker secrets. Never expose them in the GitHub Pages app.
  const sql = `SELECT blob1 AS winner, blob2 AS mode, SUM(_sample_interval) AS count FROM ${env.DATASET_NAME} WHERE blob2 = '12' GROUP BY winner, mode ORDER BY count DESC`;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.ANALYTICS_READ_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: sql
  });
  if (!response.ok) return { ok:false, totals:{}, total:0 };
  const payload = await response.json();
  const totals = {};
  let total = 0;
  for (const row of (payload.data || [])) {
    const count = Number(row.count || 0);
    totals[row.winner] = (totals[row.winner] || 0) + count;
    total += count;
  }
  return { ok:true, totals, total };
}

function json(data, headers, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type':'application/json' } });
}
