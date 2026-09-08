# MapleStory Classic World — Choose Your Job

GitHub Pages-ready static quiz for choosing among the ten MapleStory Classic World 2nd Jobs.

## Open source
This project is released under the **MIT License**. See [LICENSE](LICENSE).

## Current behavior
- The quiz opens directly on Question 1. There is no landing or quiz-selection screen.
- Click answers in order to rank them. Partial rankings and unranked choices are supported.
- `A` / `B` / `C` / `D` select answers in the same order as clicking.
- `Space` advances to the next question or results.
- `Z` abstains from the current question.
- `X` clears the current question's choices.
- Night mode is the default; Day/Night preference is saved locally.
- The Rankings button opens aggregate community results and refreshes them while the window is open.
- Community rankings are playstyle matches, not a ranking of which job is objectively best.
- If the player reaches the end without ranking a single answer, the quiz gives the hidden Beginner joke result.
- Beginner is not part of class scoring or community statistics.
- Shared community statistics are submitted only for the ten actual 2nd Job results with 30–48 answered questions.
- The current quiz contains 48 Job 1 → Job 2 questions.
- 3rd Job is not part of scoring or the question bank and is not presented as an available quiz path.

## Scoring model
- Each answer maps to explicit playstyle dimensions.
- Ranked choices receive decreasing influence by position (#1 strongest, then #2, #3, #4).
- Each question has an explicit weight and each playstyle dimension has an explicit weight.
- Class profiles contain values for the same 20 dimensions, allowing the scoring layer to compare the user's preference signal against each current 2nd Job.
- Questions and class data are kept separate from the application logic so the scoring model can be reviewed independently.

## Community result counter
The community counter uses a Cloudflare Worker with Workers Analytics Engine. The browser sends only the winning job key, quiz mode, and answered-question count; an anonymous browser throttle key is sent in a separate header and is not stored as quiz data. The Worker validates the quiz values before recording an aggregate event.

The public result endpoint uses two server-side rate-limit layers: at most two accepted submissions per minute for one anonymous browser key, plus a broader twenty-attempts-per-minute ceiling for the request's temporary IP-based rate-limit key. The browser key handles normal per-browser throttling without penalizing unrelated users who share an IP; the IP ceiling limits trivial bypass by generating fresh browser keys. This is abuse mitigation, not an exact vote-integrity system; Cloudflare documents that Workers Rate Limiting is eventually consistent and local to the Cloudflare location handling the request.

Neither the browser key nor the IP address is written to Analytics Engine. The IP is used only as a transient rate-limit key, and the browser key is stored locally by the browser to make the per-browser limit stable.

See [STATS_SETUP.md](STATS_SETUP.md) for deployment and Cloudflare configuration details.

## Tests
The repository contains two layers of automated checks:

- `npm run test:model` validates the 48-question bank, ten-class model, weights, vectors, and approved question revisions.
- `npm run test:worker` validates the Worker submission contract, CORS handling, layered rate limits, eligibility boundaries, and invalid-result rejection.
- `npm run test:e2e` runs browser tests covering direct startup, ranking input, keyboard controls, full completion, the 29/30 answer community boundary, Beginner handling, anonymous client-key persistence, rankings, theme persistence, and mobile layout.

Run everything with `npm test`.

## v1.0 release notes
- Community statistics require 30–48 substantive answered questions; the Worker enforces the same threshold.
- Beginner is excluded from community statistics.
- Job matches use featured #1 and compact #2–#10 cards.
- The standalone Closest Job Paths section was removed; #2–#4 include expandable close-match explanations.
- Repeated ranking instructions remain out of the question card.
- Community stats queries ignore records that do not carry the current mode marker.
- Community submissions use layered server-side rate limiting to reduce automated ranking inflation.
