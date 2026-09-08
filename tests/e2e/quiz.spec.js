import { test, expect } from '@playwright/test';

const STATS_ORIGIN = 'https://maplestory-classic-quiz-stats.w8hmz81kq7n2gw.workers.dev';

async function mockStats(page, totals = {}) {
  const posts = [];
  await page.route(`${STATS_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = request.url();
    if (request.method() === 'POST' && url.endsWith('/result')) {
      posts.push(JSON.parse(request.postData() || '{}'));
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

async function advance(page, count, answer = false) {
  for (let i = 0; i < count; i += 1) {
    if (answer) await page.locator('.answer-main').first().click();
    await page.locator('#nextBtn').click();
  }
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
  await advance(page, 48, true);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#winnerName')).not.toHaveText('');
  await expect(page.locator('.job-match-card')).toHaveCount(10);
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toMatchObject({ mode: '12', answered: 48 });
});

test('29 answered questions are not counted', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advance(page, 29, true);
  await advance(page, 19, false);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#communityEligibility')).toContainText('Not counted');
  expect(posts).toHaveLength(0);
});

test('30 answered questions are counted', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advance(page, 30, true);
  await advance(page, 18, false);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#communityEligibility')).toContainText('Counted');
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toMatchObject({ mode: '12', answered: 30 });
});

test('skipping every question produces the Beginner result and no community submission', async ({ page }) => {
  const posts = await mockStats(page);
  await page.goto('/index.html');
  await advance(page, 48, false);
  await expect(page.locator('#winnerName')).toHaveText('Beginner');
  expect(posts).toHaveLength(0);
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
