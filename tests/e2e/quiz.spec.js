import { test, expect } from '@playwright/test';

const STATS_ORIGIN = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

async function mockStats(page, totals = {}) {
  const posts = [];
  await page.route(`${STATS_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'POST' && url.endsWith('/result')) {
      posts.push({
        body: JSON.parse(request.postData() || '{}'),
        clientKey: request.headers()['x-quiz-client-key'] || ''
      });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    if (request.method() === 'GET' && url.endsWith('/stats')) {
      const total = Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, totals, total })
      });
      return;
    }
    await route.continue();
  });
  return posts;
}

async function advanceToResults(page, answerCount = 0) {
  for (let i = 0; i < 48; i += 1) {
    if (i < answerCount) await page.locator('.answer-main').first().click();
    await page.locator('#nextBtn').click();
    if (await page.locator('#results').isVisible()) return;
  }
  throw new Error('The quiz did not reach results after 48 questions.');
}

test('opens directly on Question 1 with no landing screen', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await expect(page.locator('#modeModal')).toHaveCount(0);
  await expect(page.locator('#quiz')).toBeVisible();
  await expect(page.locator('#qNumber')).toHaveText('01');
  await expect(page.locator('#progressText')).toHaveText('Question 1 of 48');
  await expect(page.locator('h1')).toHaveText('Find the Job That Fits Your Playstyle');
});

test('mouse ranking and keyboard shortcuts stay consistent', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await page.locator('.answer-main').nth(0).click();
  await page.keyboard.press('B');
  await expect(page.locator('#rankingPreview')).toHaveText('Your ranking: A > B');
  await page.keyboard.press('Z');
  await expect(page.locator('#rankingPreview')).toContainText('Abstained');
  await page.keyboard.press('X');
  await expect(page.locator('#rankingPreview')).toHaveText('No choices ranked yet.');
  await page.keyboard.press('Space');
  await expect(page.locator('#qNumber')).toHaveText('02');
});

test('completing all 48 questions produces a 2nd Job result', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 48);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#winnerName')).not.toHaveText('');
  await expect(page.locator('.job-match-card')).toHaveCount(10);
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].body).toMatchObject({ mode: '12', answered: 48 });
  expect(posts[0].clientKey).toMatch(/^[A-Za-z0-9_-]{20,100}$/);
});

test('29 answered questions are not counted', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 29);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#communityEligibility')).toContainText('Not counted');
  expect(posts).toHaveLength(0);
});

test('30 answered questions are counted and use the anonymous client key', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 30);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#communityEligibility')).toContainText('Counted');
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].body).toMatchObject({ mode: '12', answered: 30 });
  expect(posts[0].clientKey).toMatch(/^[A-Za-z0-9_-]{20,100}$/);

  await page.reload();
  const keyAfterReload = await page.evaluate(() => localStorage.getItem('msclassic-quiz-client-key'));
  expect(keyAfterReload).toBe(posts[0].clientKey);
});

test('skipping every question produces the Beginner result and loads community stats', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 0);
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

test('playstyle signals compare two explicit bars without the old marker', async ({ page }) => {
  await mockStats(page, { page: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 48);

  const winnerName = await page.locator('#winnerName').textContent();
  const cards = page.locator('.playstyle-panel .signal-card');
  await expect(cards).toHaveCount(6);
  await expect(cards.first()).toContainText('YOU');
  await expect(cards.first()).toContainText(winnerName || '');
  await expect(cards.first().locator('.signal-compare-row')).toHaveCount(2);
  await expect(cards.first().locator('.signal-marker')).toHaveCount(0);
  await expect(cards.first().locator('.signal-compare-you .signal-compare-track i')).toHaveAttribute('style', /width:/);
  await expect(cards.first().locator('.signal-compare-job .signal-compare-track i')).toHaveAttribute('style', /width:/);
  await expect(cards.first()).toContainText(/Very similar preference|You prefer this more|leans higher/);
});

test('results-page community rankings reuse the compact popup layout', async ({ page }) => {
  await mockStats(page, { assassin: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 30);

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
  await expect(page.locator('#quiz')).toBeVisible();
});
