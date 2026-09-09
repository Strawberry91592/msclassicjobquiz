const ALLOWED_WINNERS = new Set(['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit']);
const CURRENT_MODE = '12';
const COMMUNITY_MIN_ANSWERED = 15;
const COMMUNITY_MAX_ANSWERED = 20;
const TELEMETRY_EVENTS = new Set(['page_view', 'quiz_submission']);

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
      if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) return json({ ok:false, error:'Origin not allowed.' }, headers, 403);
      return new Response(null, { headers });
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      try { return json(await queryStats(env), headers); }
      catch { return json({ ok:false, error:'Stats read failed.', totals:{}, total:0 }, headers, 502); }
    }

    if (url.pathname === '/telemetry' && request.method === 'POST') {
      return handleTelemetry(request, env, headers, configuredOrigin, requestOrigin);
    }

    if (url.pathname === '/result' && request.method === 'POST') {
      if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) return json({ ok:false, error:'Origin not allowed.' }, headers, 403);

      let body;
      try { body = await request.json(); }
      catch { return json({ ok:false, error:'Invalid JSON.' }, headers, 400); }

      const winner = typeof body?.winner === 'string' ? body.winner : '';
      const mode = String(body?.mode ?? '');
      const answered = Number(body?.answered);
      const clientKey = String(request.headers.get('X-Quiz-Client-Key') || '').trim();

      if (mode !== CURRENT_MODE) return json({ ok:false, error:'Unsupported quiz mode.' }, headers, 400);
      if (!Number.isInteger(answered) || answered < COMMUNITY_MIN_ANSWERED || answered > COMMUNITY_MAX_ANSWERED) return json({ ok:false, error:'Incomplete result.' }, headers, 400);
      if (!ALLOWED_WINNERS.has(winner)) return json({ ok:false, error:'Invalid result.' }, headers, 400);
      if (!/^[A-Za-z0-9_-]{20,100}$/.test(clientKey)) return json({ ok:false, error:'Missing submission key.' }, headers, 400);
      if (!env.CLIENT_RATE_LIMITER || !env.IP_RATE_LIMITER) return json({ ok:false, error:'Submission protection unavailable.' }, headers, 503);

      try {
        const clientLimited = await env.CLIENT_RATE_LIMITER.limit({ key: `result:${clientKey}` });
        if (!clientLimited.success) return json({ ok:false, error:'Too many submissions. Please wait before submitting another result.' }, { ...headers, 'Retry-After':'60' }, 429);

        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const ipLimited = await env.IP_RATE_LIMITER.limit({ key: `result:${clientIp}` });
        if (!ipLimited.success) return json({ ok:false, error:'Too many submissions from this network. Please wait before trying again.' }, { ...headers, 'Retry-After':'60' }, 429);

        env.RESULTS.writeDataPoint({ blobs:[winner, CURRENT_MODE], doubles:[answered, Number(CURRENT_MODE)], indexes:['classic-quiz'] });
        return json({ ok:true }, headers, 200);
      } catch {
        return json({ ok:false, error:'Submission service unavailable.' }, headers, 503);
      }
    }

    return json({ ok:false, error:'Not found.' }, headers, 404);
  }
};

async function handleTelemetry(request, env, headers, configuredOrigin, requestOrigin) {
  if (configuredOrigin !== '*' && requestOrigin !== configuredOrigin) return json({ ok:false, error:'Origin not allowed.' }, headers, 403);
  if (!env.TELEMETRY) return json({ ok:false, error:'Telemetry service unavailable.' }, headers, 503);

  let body;
  try { body = await request.json(); }
  catch { return json({ ok:false, error:'Invalid JSON.' }, headers, 400); }

  const event = clean(body?.event, 32);
  if (!TELEMETRY_EVENTS.has(event)) return json({ ok:false, error:'Invalid telemetry event.' }, headers, 400);

  const client = body?.client && typeof body.client === 'object' ? body.client : {};
  const quiz = body?.quiz && typeof body.quiz === 'object' ? body.quiz : {};
  const clientKey = clean(request.headers.get('X-Quiz-Client-Key'), 100);
  const ip = clean(request.headers.get('CF-Connecting-IP'), 128) || 'unknown';
  const userAgent = clean(request.headers.get('User-Agent'), 1024);
  const acceptLanguage = clean(request.headers.get('Accept-Language'), 512);
  const secChUa = clean(request.headers.get('Sec-CH-UA'), 512);
  const secChUaPlatform = clean(request.headers.get('Sec-CH-UA-Platform'), 256);
  const secChUaMobile = clean(request.headers.get('Sec-CH-UA-Mobile'), 32);
  const referrer = clean(request.headers.get('Referer'), 2048);
  const path = clean(client.path || '/', 512);
  const sessionId = clean(client.sessionId, 128);
  const cf = request.cf || {};

  const clientFields = [
    ['screen', client.screen],
    ['viewport', client.viewport],
    ['devicePixelRatio', client.devicePixelRatio],
    ['colorDepth', client.colorDepth],
    ['pixelDepth', client.pixelDepth],
    ['maxTouchPoints', client.maxTouchPoints],
    ['hardwareConcurrency', client.hardwareConcurrency],
    ['deviceMemory', client.deviceMemory],
    ['platform', client.platform],
    ['vendor', client.vendor],
    ['language', client.language],
    ['languages', client.languages],
    ['timezone', client.timezone],
    ['cookieEnabled', client.cookieEnabled],
    ['doNotTrack', client.doNotTrack],
    ['webdriver', client.webdriver],
    ['userAgentData', client.userAgentData]
  ];

  const clientSnapshot = Object.fromEntries(clientFields.map(([key, value]) => [key, cleanStructured(value, 1024)]));
  const quizSnapshot = {
    winner: clean(quiz.winner, 32),
    mode: clean(quiz.mode, 16),
    answered: Number.isInteger(Number(quiz.answered)) ? Number(quiz.answered) : null
  };
  const cfSnapshot = {
    country: clean(cf.country, 8),
    continent: clean(cf.continent, 8),
    region: clean(cf.region, 128),
    regionCode: clean(cf.regionCode, 32),
    city: clean(cf.city, 128),
    timezone: clean(cf.timezone, 128),
    asn: Number.isFinite(Number(cf.asn)) ? Number(cf.asn) : null,
    asOrganization: clean(cf.asOrganization, 256),
    colo: clean(cf.colo, 8),
    httpProtocol: clean(cf.httpProtocol, 32),
    tlsVersion: clean(cf.tlsVersion, 32),
    clientTcpRtt: numberOrNull(cf.clientTcpRtt),
    clientQuicRtt: numberOrNull(cf.clientQuicRtt),
    deliveryRate: numberOrNull(cf.edgeL4?.deliveryRate)
  };

  const detailBlob = JSON.stringify({ client: clientSnapshot, quiz: quizSnapshot, cloudflare: cfSnapshot });
  if (detailBlob.length > 12000) return json({ ok:false, error:'Telemetry payload too large.' }, headers, 413);

  try {
    env.TELEMETRY.writeDataPoint({
      blobs: [
        event,
        sessionId,
        clientKey,
        ip,
        userAgent,
        acceptLanguage,
        secChUa,
        secChUaPlatform,
        secChUaMobile,
        referrer,
        path,
        clientSnapshot.screen,
        clientSnapshot.viewport,
        clientSnapshot.devicePixelRatio,
        clientSnapshot.colorDepth,
        clientSnapshot.maxTouchPoints,
        clientSnapshot.hardwareConcurrency,
        clientSnapshot.deviceMemory,
        clientSnapshot.timezone,
        detailBlob
      ],
      doubles: [],
      indexes: [sessionId || event]
    });
    return json({ ok:true }, headers, 200);
  } catch {
    return json({ ok:false, error:'Telemetry storage unavailable.' }, headers, 503);
  }
}

async function queryStats(env) {
  const winners = [...ALLOWED_WINNERS].map(value => `'${value}'`).join(', ');
  const sql = `SELECT blob1 AS winner, SUM(_sample_interval) AS count FROM ${env.DATASET_NAME} WHERE timestamp >= toDateTime('${env.COMMUNITY_RESET_AT}') AND index1 = 'classic-quiz' AND blob2 = '${CURRENT_MODE}' AND blob1 IN (${winners}) GROUP BY winner ORDER BY count DESC`;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.ANALYTICS_READ_TOKEN}`, 'Content-Type': 'application/json' },
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

function clean(value, maxLength) {
  if (value == null) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, maxLength);
}

function cleanStructured(value, maxLength) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return clean(value, maxLength);
  try { return clean(JSON.stringify(value), maxLength); }
  catch { return ''; }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function json(data, headers, status=200) {
  return new Response(JSON.stringify(data), { status, headers:{ ...headers, 'Content-Type':'application/json' } });
}
