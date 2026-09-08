import { test, expect } from '@playwright/test';

async function mockStats(page, totals = {}) {
  await page.route('**/stats', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        total: Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0),
        totals
      })
    });
  });
  await page.route('**/result', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
}

async function advanceToResults(page, answered = 48) {
  for (let i = 0; i < 48; i++) {
    if (i < answered) await page.locator('.answer-main').first().click();
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#results')).toBeVisible();
}

test('opens directly on Question 1 with no landing screen', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await expect(page.locator('#quiz')).toBeVisible();
  await expect(page.locator('#progressText')).toHaveText('Question 1 of 48');
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#modeLabel')).toHaveText('MAPLE ISLAND → 2ND JOB');
});

test('mouse ranking and keyboard shortcuts stay consistent', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await page.locator('.answer-main').nth(2).click();
  await page.keyboard.press('a');
  await expect(page.locator('#rankingPreview')).toHaveText('Your ranking: C > A');
  await page.keyboard.press('x');
  await expect(page.locator('#rankingPreview')).toHaveText('No choices ranked yet.');
  await page.keyboard.press('z');
  await expect(page.locator('#rankingPreview')).toContainText('Abstained');
});

test('completing all 48 questions produces a 2nd Job result', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 48);
  await expect(page.locator('#winnerName')).not.toHaveText('Beginner');
  await expect(page.locator('.job-match-card')).toHaveCount(10);
});

test('29 answered questions are not counted', async ({ page }) => {
  const posts = [];
  await page.route('**/result', async route => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  await advanceToResults(page, 29);
  await expect(page.locator('#communityEligibility')).toContainText('Not counted');
  await expect(page.locator('#sharedStatsMeta')).toHaveText('0 completed quizzes counted');
  await expect(page.locator('#sharedStats')).not.toContainText('Loading the latest Maple World results');
  expect(posts).toHaveLength(0);
});

test('30 answered questions are counted and use the anonymous client key', async ({ page }) => {
  let postHeaders = null;
  await page.route('**/result', async route => {
    postHeaders = await route.request().headers();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  await advanceToResults(page, 30);
  await expect(page.locator('#communityEligibility')).toContainText('Counted');
  expect(postHeaders?.['x-quiz-client-key']).toBeTruthy();
});

test('skipping every question produces the Beginner result and loads community stats', async ({ page }) => {
  const posts = [];
  await page.route('**/result', async route => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  for (let i = 0; i < 48; i++) await page.keyboard.press('z'), await page.keyboard.press('Space');
  await expect(page.locator('#winnerName')).toHaveText('Beginner');
  await expect(page.locator('#sharedStatsMeta')).toHaveText('0 completed quizzes counted');
  await expect(page.locator('#sharedStats')).not.toContainText('Loading the latest Maple World results');
  expect(posts).toHaveLength(0);
});

test('results omit the redundant progression section', async ({ page }) => {
  await mockStats(page, { assassin: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 30);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#progressionFit')).toHaveCount(0);
  await expect(page.locator('.stage')).toHaveCount(0);
});

test('results no longer render the redundant playstyle section or signal markup', async ({ page }) => {
  await mockStats(page, { page: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 48);

  await expect(page.locator('.playstyle-panel')).toHaveCount(0);
  await expect(page.locator('#profileBars')).toHaveCount(0);
  await expect(page.locator('.signal-card')).toHaveCount(0);
  await expect(page.locator('.signal-marker')).toHaveCount(0);
});

test('every 2nd Job result card contains the two MeowDB guide boxes', async ({ page }) => {
  await mockStats(page, { assassin: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 48);

  const cards = page.locator('.job-match-card');
  await expect(cards).toHaveCount(10);
  await expect(cards.nth(0).locator('.job-match-guides a')).toHaveCount(2);
  await expect(cards.nth(0).locator('.job-match-guides a').nth(0)).toHaveText('Lv. 1–30');
  await expect(cards.nth(0).locator('.job-match-guides a').nth(1)).toHaveText('Lv. 30–70');
  await expect(cards.nth(0).locator('.job-match-guides a').nth(0)).toHaveAttribute('href', /meowdb\.com\/msclassic\/guides\//);
  await expect(cards.nth(0).locator('.job-match-guides a').nth(1)).toHaveAttribute('href', /meowdb\.com\/msclassic\/guides\//);
  for (let i = 0; i < 10; i++) await expect(cards.nth(i).locator('.job-match-guides a')).toHaveCount(2);
});

test('results-page community rankings reuse the compact popup layout', async ({ page }) => {
  await mockStats(page, { assassin: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 30);

  await expect(page.locator('.shared-stats-panel h3')).toHaveText('Community Results');
  await expect(page.locator('.shared-stats-panel .panel-mark')).toHaveCount(0);

  const rows = page.locator('.shared-stats-panel .stats-row');
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText('Assassin');

  const firstLayout = await rows.nth(0).evaluate(el => getComputedStyle(el).gridColumn);
  expect(firstLayout).toBe('1 / -1');

  const boxes = await rows.nth(1).boundingBox();
  const nextBox = await rows.nth(2).boundingBox();
  expect(boxes).not.toBeNull();
  expect(nextBox).not.toBeNull();
  expect(Math.abs((boxes?.y ?? 0) - (nextBox?.y ?? 0))).toBeLessThan(4);

  await expect(rows.nth(0)).toContainText('100.0%');
  await expect(rows.nth(9)).toContainText('0.0%');
});

test('community rankings open, sort, and explain what the ranking means', async ({ page }) => {
  await mockStats(page, { fighter: 5, bandit: 2, hunter: 1 });
  await page.goto('/index.html');
  await page.locator('#communityToggle').click();
  await expect(page.locator('#communityRankingsModal')).toBeVisible();
  await expect(page.locator('#communityRankingsTitle')).toHaveText('2nd Job rankings');
  await expect(page.locator('.community-rankings-head p')).toContainText('do not show which job is objectively best');
  await expect(page.locator('.community-rank-row').first()).toContainText('Fighter');
  await expect(page.locator('.community-rankings-footnote')).toContainText('Updates automatically');
  await page.locator('.community-close-btn').click();
  await expect(page.locator('#communityRankingsModal')).toBeHidden();
});

test('Day/Night preference persists and rankings remain readable in Day mode', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveClass(/night-mode/);
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).not.toHaveClass(/night-mode/);
  await page.locator('#communityToggle').click();
  await expect(page.locator('#communityRankingsModal')).toBeVisible();
  await page.locator('.community-close-btn').click();
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/night-mode/);
  await expect(page.locator('#quiz')).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await mockStats(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
});
