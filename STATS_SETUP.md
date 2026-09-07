# Shared Result Counter Setup

The quiz can optionally show an aggregate count of how often each 2nd Job is the final match. GitHub Pages is static, so the counter needs a small external endpoint.

This repository includes a Cloudflare Worker example using Workers Analytics Engine. The browser sends only the winning job key; no answers, names, IP addresses, or persistent identifiers are sent by the quiz.

The Worker expects:

- `POST /result` with `{ "winner": "hunter" }`
- `GET /stats` returning aggregate totals

Allowed winner keys are the ten 2nd Job paths used by `classes.js`.

Deploy the Worker, set the dataset name/account credentials required by the Worker, then set `STATS_API_URL` in `config.js` to the Worker URL.

### Community eligibility
Only results with 30–48 questions containing at least one ranked answer are submitted. The Worker enforces the same threshold, so incomplete browser requests cannot enter the aggregate totals.
