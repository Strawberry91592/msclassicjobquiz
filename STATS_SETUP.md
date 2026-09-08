# Shared Result Counter Setup

The quiz has a community result counter for completed attempts. GitHub Pages is static, so the counter uses a small Cloudflare Worker with Workers Analytics Engine.

The browser sends only the winning job key, mode, and answered-question count as quiz data. The Worker stores anonymous aggregate counts only. It does not write quiz answers, names, IP addresses, or persistent identifiers to Analytics Engine.

## What is already in the repository

- `worker/worker.js` accepts `POST /result` and serves `GET /stats`.
- `community-client-key.js` creates a random anonymous browser throttle key locally and attaches it to eligible `/result` submissions.
- `worker/wrangler.toml` defines the Analytics Engine dataset, GitHub Pages origin, and two backend rate-limit bindings.
- `.github/workflows/deploy-stats-worker.yml` deploys the Worker whenever the Worker files change.
- After deployment, the workflow automatically writes the Worker URL into `config.js`, so the GitHub Pages quiz becomes connected without manually editing the frontend.

## One-time Cloudflare setup

Cloudflare Worker deployment credentials are kept in GitHub Actions secrets; never commit them to the repository.

In the GitHub repository, open **Settings → Secrets and variables → Actions** and add:

- `CLOUDFLARE_API_TOKEN` — token used by GitHub Actions to deploy Workers.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.
- `ANALYTICS_READ_TOKEN` — a Cloudflare API token that can read Workers Analytics Engine through the SQL API.

Then run **Actions → Deploy Stats Worker → Run workflow** once. The workflow deploys `maplestory-classic-quiz-stats`, stores the required Worker secrets, and automatically connects `config.js` to the resulting Worker URL.

## Community eligibility

Only results with 30–48 answered questions are submitted by the quiz, and the Worker independently rejects anything outside that range. A fully skipped attempt becomes Beginner and is never counted.

## Abuse protection

The `/result` endpoint uses two Cloudflare Workers Rate Limiting bindings in sequence:

1. **Browser-key ceiling:** two accepted submissions per minute for the random anonymous key stored locally in the browser. The key is only used as a throttle identifier; it is not written to Analytics Engine.
2. **Network ceiling:** twenty submission attempts per minute for the request's `CF-Connecting-IP` value. The IP is used only by the transient rate limiter and is not written to Analytics Engine.

The browser key makes the normal limit specific to one browser instead of punishing unrelated people who share a public IP. The network ceiling prevents an attacker from bypassing that first limiter simply by creating a fresh browser key for every request.

Both limiters run only after the Worker has accepted the Origin, mode, answer-count, winner, and client-key validation. A blocked submission receives HTTP 429 with a `Retry-After: 60` response header. This is lightweight abuse mitigation, not a guarantee of one human vote per person. Cloudflare documents that Workers Rate Limiting is eventually consistent and local to the Cloudflare location handling a request, so the limits should be treated as a practical anti-flood control rather than an exact accounting mechanism.

## Frontend behavior

The Rankings window polls `/stats` while open. A just-accepted submission can take a short time to become visible because Analytics Engine is eventually consistent; the frontend retries an immediately empty read before giving up.
