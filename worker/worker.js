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
      'Access-Control-Allow-Headers': 'Content-Type, X-Quiz-Client-Key',
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
      if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) {
        return json({ ok:false, error:'Origin not allowed.' }, headers, 403);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok:false, error:'Invalid JSON.' }, headers, 400);
      }

      const winner = typeof body?.winner === 'string' ? body.winner : '';
      const mode = String(body?.mode ?? '');
      const answered = Number(body?.answered);
      const clientKey = String(request.headers.get('X-Quiz-Client-Key') || '').trim();

      if (mode !== CURRENT_MODE) return json({ ok:false, error:'Unsupported quiz mode.' }, headers, 400);
      if (!Number.isInteger(answered) || answered < COMMUNITY_MIN_ANSWERED || answered > COMMUNITY_MAX_ANSWERED) {
        return json({ ok:false, error:'Incomplete result.' }, headers, 400);
      }
      if (!ALLOWED_WINNERS.has(winner)) return json({ ok:false, error:'Invalid result.' }, headers, 400);
      if (!/^[A-Za-z0-9_-]{20,100}$/.test(clientKey)) {
        return json({ ok:false, error:'Missing submission key.' }, headers, 400);
      }
      if (!env.CLIENT_RATE_LIMITER || !env.IP_RATE_LIMITER) {
        return json({ ok:false, error:'Submission protection unavailable.' }, headers, 503);
      }

      try {
        // Two accepted results/minute per anonymous browser key. This avoids
        // punishing multiple legitimate users who share one public IP.
        const clientLimited = await env.CLIENT_RATE_LIMITER.limit({ key: `result:${clientKey}` });
        if (!clientLimited.success) {
          return json(
            { ok:false, error:'Too many submissions. Please wait before submitting another result.' },
            { ...headers, 'Retry-After':'60' },
            429
          );
        }

        // A broader network-level ceiling prevents an attacker from creating a
        // new browser key for every request and bypassing the first limiter.
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const ipLimited = await env.IP_RATE_LIMITER.limit({ key: `result:${clientIp}` });
        if (!ipLimited.success) {
          return json(
            { ok:false, error:'Too many submissions from this network. Please wait before trying again.' },
            { ...headers, 'Retry-After':'60' },
            429
          );
        }

        env.RESULTS.writeDataPoint({
          blobs: [winner, CURRENT_MODE],
          doubles: [answered, Number(CURRENT_MODE)],
          indexes: ['classic-quiz']
        });

        return json({ ok:true }, headers, 200);
      } catch {
        // A rate-limit or Analytics Engine failure is an infrastructure error,
        // not a malformed client request. Do not mislabel it as HTTP 400.
        return json({ ok:false, error:'Submission service unavailable.' }, headers, 503);
      }
    }

    return json({ ok:false, error:'Not found.' }, headers, 404);
  }
};

async function queryStats(env) {
  const winners = [...ALLOWED_WINNERS].map(value => `'${value}'`).join(', ');
  const sql = `SELECT blob1 AS winner, SUM(_sample_interval) AS count FROM ${env.DATASET_NAME} WHERE timestamp >= toDateTime('${env.COMMUNITY_RESET_AT}') AND index1 = 'classic-quiz' AND blob2 = '${CURRENT_MODE}' AND blob1 IN (${winners}) GROUP BY winner ORDER BY count DESC`;
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
