import { test, expect } from '@playwright/test';

async function mockStats(page, totals = {}) {
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0), totals }) });
  });
  await page.route('**/result', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
}

async function advanceToResults(page, answered = 20) {
  for (let i = 0; i < 20; i++) {
    if (i < answered) await page.locator('.answer-main').first().click();
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#results')).toBeVisible();
}

test('opens directly on Question 1 of 20', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await expect(page.locator('#quiz')).toBeVisible();
  await expect(page.locator('#progressText')).toHaveText('Question 1 of 20');
  await expect(page.locator('#results')).toBeHidden();
});

test('ranking controls work with multiple answers', async ({ page }) => {
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

test('20 answered questions produce a 2nd Job result', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  await advanceToResults(page, 20);
  await expect(page.locator('#winnerName')).not.toHaveText('Beginner');
  await expect(page.locator('.job-match-card')).toHaveCount(10);
  await expect(page.locator('#confidenceText')).toContainText('20/20 questions answered');
});

test('11 answered questions do not produce a Job recommendation', async ({ page }) => {
  const posts = [];
  await page.route('**/result', async route => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  await advanceToResults(page, 11);
  await expect(page.locator('#winnerName')).toHaveText('Not enough answers');
  await expect(page.locator('#winnerScore')).toHaveText('No Job match yet');
  await expect(page.locator('#confidenceText')).toContainText('11/20 questions answered');
  await expect(page.locator('#leaderboard .job-match-card')).toHaveCount(0);
  expect(posts).toHaveLength(0);
});

test('12 answered questions unlock a Job recommendation but are not counted', async ({ page }) => {
  const posts = [];
  await page.route('**/result', async route => {
    posts.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  await advanceToResults(page, 12);
  await expect(page.locator('#winnerName')).not.toHaveText('Beginner');
  await expect(page.locator('.job-match-card')).toHaveCount(10);
  await expect(page.locator('#communityEligibility')).toContainText('Not counted');
  expect(posts).toHaveLength(0);
});

test('15 answered questions are counted and use the anonymous client key', async ({ page }) => {
  let postHeaders = null;
  await page.route('**/result', async route => {
    postHeaders = await route.request().headers();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, totals: {} }) });
  });
  await page.goto('/index.html');
  await advanceToResults(page, 15);
  await expect(page.locator('#communityEligibility')).toContainText('Counted');
  expect(postHeaders?.['x-quiz-client-key']).toBeTruthy();
});

test('all skipped questions produce the Beginner result', async ({ page }) => {
  await mockStats(page);
  await page.goto('/index.html');
  for (let i = 0; i < 20; i++) { await page.keyboard.press('z'); await page.keyboard.press('Space'); }
  await expect(page.locator('#winnerName')).toHaveText('Beginner');
});

test('result cards, guide links, and rankings still render', async ({ page }) => {
  await mockStats(page, { assassin: 1 });
  await page.goto('/index.html');
  await advanceToResults(page, 20);
  await expect(page.locator('.job-match-card')).toHaveCount(10);
  for (let i = 0; i < 10; i++) await expect(page.locator('.job-match-card').nth(i).locator('.job-match-guides a')).toHaveCount(2);
  await page.locator('#communityToggle').click();
  await expect(page.locator('#communityRankingsModal')).toBeVisible();
  await expect(page.locator('#communityRankingsTitle')).toHaveText('2nd Job rankings');
  await expect(page.locator('.community-rankings-head p')).toContainText('do not show which job is objectively best');
  await page.locator('.community-close-btn').click();
});

test('day/night, mobile layout, and header placement remain stable', async ({ page }) => {
  await mockStats(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveClass(/night-mode/);
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).not.toHaveClass(/night-mode/);
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  const brand = await page.locator('.brand-row').boundingBox();
  const controls = await page.locator('.theme-switch-wrap').boundingBox();
  const intro = await page.locator('.intro-cards').boundingBox();
  expect((controls?.y ?? 0)).toBeGreaterThanOrEqual((brand?.y ?? 0) + (brand?.height ?? 0) - 1);
  expect((intro?.y ?? 0)).toBeGreaterThanOrEqual((controls?.y ?? 0) + (controls?.height ?? 0) - 1);
});

test('native share keeps the quiz title, text, and URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: data => { window.__sharedData = data; return Promise.resolve(); } });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
  });
  await mockStats(page);
  await page.goto('/index.html');
  await page.locator('#shareToggle').click();
  await page.waitForFunction(() => window.__sharedData);
  const shared = await page.evaluate(() => window.__sharedData);
  expect(shared.title).toBe('MapleStory Classic World Job Quiz');
  expect(shared.text).toBe('Find out which MS Classic World Job best matches your playstyle.');
  expect(shared.url).toBe(await page.evaluate(() => window.location.href));
});

test('unsupported sharing still exposes all fallback platforms and copy feedback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { window.__copiedText = text; return Promise.resolve(); } } });
  });
  await mockStats(page);
  await page.goto('/index.html');
  await page.locator('#shareToggle').click();
  await expect(page.locator('#shareModal')).toBeVisible();
  await expect(page.locator('.share-platform-grid a')).toHaveCount(5);
  for (const platform of ['whatsapp', 'reddit', 'facebook', 'x', 'bluesky']) await expect(page.locator(`[data-share-platform="${platform}"]`)).toHaveAttribute('href', /^https:\/\//);
  await page.locator('#copyShareLink').click();
  await expect(page.locator('#copyShareLink strong')).toHaveText('Link copied!');
  expect(await page.evaluate(() => window.__copiedText)).toBe(await page.evaluate(() => window.location.href));
});