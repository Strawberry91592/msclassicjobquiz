# MapleStory Classic World — Choose Your Job

GitHub Pages-ready static quiz for choosing among the ten MapleStory Classic World 2nd Jobs.

## Open source
This project is released under the **MIT License**. See [LICENSE](LICENSE).

## Current behavior
- Quiz opens directly on Question 1 after choosing the quiz card.
- Click answers in order to rank them. Partial rankings and unranked choices are supported.
- `A` / `B` / `C` / `D` select answers in the same order as clicking.
- `Space` advances to the next question or results.
- `Z` abstains from the current question.
- `X` clears the current question's choices.
- Night mode is the default; Day/Night preference is saved locally.
- If the player reaches the end without ranking a single answer, the quiz gives the hidden Beginner joke result.
- Beginner is not part of class scoring or community statistics.
- Shared community statistics remain optional and are sent only for the ten actual 2nd Job results.
- The current quiz contains 48 Job 1 → Job 2 questions.
- 3rd Job is not part of scoring or the question bank; only the disabled future box mentions it.

## v1.0
- Community statistics require 30–48 substantive answered questions; the Worker also enforces this threshold.
- Beginner remains excluded from community statistics.
- Job matches use featured #1 and compact #2–#10 cards.
- Standalone Closest Job Paths section removed; #2–#4 include expandable close-match explanations.
- Repeated ranking instructions remain out of the question card.
- Community stats queries ignore pre-v1.0 records without the current mode marker, preventing legacy incomplete results from entering the displayed totals.
