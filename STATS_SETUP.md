# Shared Result Counter Setup

The quiz has a community result counter for completed attempts. GitHub Pages is static, so the counter uses a small Cloudflare Worker with Workers Analytics Engine.

The browser sends only the winning job key, mode, and answered-question count. The Worker stores anonymous aggregate counts only. It does not store quiz answers, names, IP addresses, or persistent identifiers.

## What is already in the repository

- `worker/worker.js` accepts `POST /result` and serves `GET /stats`.
- `worker/wrangler.toml` defines the Analytics Engine dataset and the live GitHub Pages origin.
- `.github/workflows/deploy-stats-worker.yml` deploys the Worker whenever the Worker files change.
- After deployment, the workflow automatically writes the Worker URL into `config.js`, so the GitHub Pages quiz becomes connected without manually editing the frontend.

## One-time Cloudflare setup

Cloudflare currently requires authentication for Worker deployments. Create a Cloudflare API token with permission to deploy Workers and an Analytics Engine read token for the account. Keep both as GitHub repository secrets; never commit them to the repository.

In the GitHub repository, open **Settings → Secrets and variables → Actions** and add:

- `CLOUDFLARE_API_TOKEN` — token used by GitHub Actions to deploy the Worker.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.
- `ANALYTICS_READ_TOKEN` — a Cloudflare API token that can read Workers Analytics Engine through the SQL API.

Then run **Actions → Deploy Stats Worker → Run workflow** once. The workflow deploys `maplestory-classic-quiz-stats`, stores the required Worker secrets, and automatically connects `config.js` to the resulting Worker URL.

Cloudflare's current documentation confirms that Analytics Engine datasets are created automatically on the first write when the dataset binding is defined in Wrangler, and that GitHub Actions deployments use a Cloudflare API token and account ID. citeturn493320search0turn493320search3

## Community eligibility

Only results with 30–48 answered questions are submitted by the quiz, and the Worker independently rejects anything outside that range. A fully skipped attempt becomes Beginner and is never counted.
