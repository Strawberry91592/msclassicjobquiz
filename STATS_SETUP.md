# Shared Result Counter Setup

The quiz has a community result counter for completed attempts. GitHub Pages is static, so the counter uses a small Cloudflare Worker with Workers Analytics Engine.

The browser sends only the winning job key, mode, and answered-question count. The Worker stores anonymous aggregate counts only. It does not write quiz answers, names, IP addresses, or persistent identifiers to Analytics Engine.

## What is already in the repository

- `worker/worker.js` accepts `POST /result` and serves `GET /stats`.
- `worker/wrangler.toml` defines the Analytics Engine dataset, GitHub Pages origin, and backend rate-limit binding.
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

The `/result` endpoint uses a Cloudflare Workers Rate Limiting binding. The current configuration allows two accepted submissions per minute for a transient key based on the client's `CF-Connecting-IP` value.

The rate limit is applied only after winner, mode, answer-count, and Origin checks succeed, so malformed requests do not consume the allowance. A blocked submission receives HTTP 429 with a `Retry-After: 60` response header.

This is intentionally lightweight abuse mitigation rather than a guarantee of one human vote per person. Cloudflare documents that the Workers Rate Limiting API is eventually consistent and local to the Cloudflare location handling the request, and recommends stable user identifiers where available. This quiz is anonymous and does not have accounts, so the client IP is used only as a transient rate-limit key and is not sent to Analytics Engine.

## Frontend behavior

The Rankings window polls `/stats` while open. A just-accepted submission can take a short time to become visible because Analytics Engine is eventually consistent; the frontend retries an immediately empty read before giving up.
