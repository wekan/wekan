'use strict';

// Ad-hoc visual harness for #6419: seed a board, open it at a phone viewport,
// and screenshot the header + an open card so the mobile layout can be reviewed.
// Run with the dev server up on :3000:  node tests/playwright/mobile-shot.js
// Screenshots are written to /tmp/wekan-mobile-*.png.

const { chromium, devices } = require('@playwright/test');
const db = require('./helpers/db');
const { loginWithToken } = require('./helpers/auth');

const BASE = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const OUT = process.env.SHOT_DIR || '/tmp';

(async () => {
  const user = db.seedUser({ isAdmin: true });
  const board = db.seedBoard({
    ownerId: user.id,
    title: 'Mobile Test Board',
    cardTitlesPerList: [['Alpha Card'], ['Beta Card'], ['Gamma Card']],
  });
  // Give Alpha Card a vote so the voting buttons (#6420) are visible too.
  db.updateOne(
    'cards',
    { boardId: board.boardId, title: 'Alpha Card' },
    { $set: { vote: { question: 'Ship it?', positive: [], negative: [], public: false, allowNonBoardMembers: false } } },
  );

  const browser = await chromium.launch();
  // iPhone 12/13/14-ish portrait — triggers the max-width 800/480/400 media queries.
  // Use a real phone device preset (mobile UA + touch + viewport) so WeKan's
  // getMobileMode() auto-detection applies body.mobile-mode, exactly as on a
  // real phone — otherwise the desktop UA keeps it in desktop-mode.
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();

  await loginWithToken(page, user.id, user.token);
  await page.goto(`${BASE}/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
  await page.locator('.js-list:not(.js-list-composer)').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);

  // 1. Board header (the cramped action icons).
  await page.screenshot({ path: `${OUT}/wekan-mobile-header.png` });

  // 2. Open a card → check the close (X) reachability + voting buttons.
  await page.locator('.js-minicard').filter({ hasText: 'Alpha Card' }).first().click();
  await page.locator('.js-card-details').first().waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/wekan-mobile-card.png` });

  console.log('OK: wrote wekan-mobile-header.png and wekan-mobile-card.png to', OUT);
  await browser.close();
  db.cleanup({ boardIds: [board.boardId] });
  process.exit(0);
})().catch(e => { console.error('SHOT FAIL:', e.message); process.exit(1); });
