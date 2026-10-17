'use strict';

// The new UI at the common screen sizes, upright and on its side: a phone, the
// iPhone Duo foldable (open and closed), a tablet, a laptop and a 55"
// touchscreen. For each one:
//   - the board header's icons and texts are on screen, and the page does not
//     scroll sideways;
//   - board menu → Original positions is reachable and its sidebar fits;
//   - Admin Panel → Problems → Memory Usage and Disk usage show their live line;
//   - the Table, Calendar Mode, Time, Timeline and Map views open and fit;
//   - dragscroll pans the board - by mouse where there is a mouse, by finger
//     where there is a touchscreen.
// Screenshots of every step go to .tools/log/viewports/<device>/ for review.
//
// Run: cd tests/playwright && npx playwright test viewport-matrix --project=chromium

const path = require('path');
const fs = require('fs');
const { test, expect, devices } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, openBoard, waitForMeteor } = require('../helpers/auth');

// Each device group seeds its own user and board, so the groups can run on
// several workers at once.
test.describe.configure({ mode: 'parallel' });

const SHOTS = path.join(__dirname, '..', '..', '..', '.tools', 'log', 'viewports');

// Device presets without their browser type: the suite runs them in Chromium,
// with each device's size, pixel ratio, user agent and touch.
const preset = name => {
  const { defaultBrowserType, ...rest } = devices[name];
  return rest;
};
const screen = (width, height, touch) => ({
  viewport: { width, height }, deviceScaleFactor: touch ? 2 : 1,
  isMobile: false, hasTouch: touch,
  userAgent: devices['Desktop Chrome'].userAgent,
});

// An iPhone (iOS Safari user agent, touch, 3x) at a given size in CSS pixels.
const iphoneDuo = (width, height) => ({ ...preset('iPhone 15'), viewport: { width, height } });

const DEVICES = [
  ['phone-portrait', preset('iPhone 15')],
  ['phone-landscape', preset('iPhone 15 landscape')],
  // iPhone Duo, Apple's foldable (on sale 2026-10-23). Apple's specs
  // (apple.com/iphone-duo/specs): inner 7.6" 1878 x 2670 px at 430 ppi, outer
  // 5.4" 1398 x 2034 px at 460 ppi. At the 3x of every current iPhone that is
  // 626 x 890 and 466 x 678 CSS pixels. Playwright has no preset for it yet.
  ['iphone-duo-inner-portrait', iphoneDuo(626, 890)],
  ['iphone-duo-inner-landscape', iphoneDuo(890, 626)],
  ['iphone-duo-cover-portrait', iphoneDuo(466, 678)],
  ['iphone-duo-cover-landscape', iphoneDuo(678, 466)],
  ['tablet-portrait', preset('iPad Pro 11')],
  ['tablet-landscape', preset('iPad Pro 11 landscape')],
  ['laptop-landscape', screen(1366, 768, false)],
  ['laptop-portrait', screen(768, 1366, false)],
  // 55" 4K touch panel at 200 %: 1920 x 1080 CSS pixels.
  ['touchscreen55-landscape', screen(1920, 1080, true)],
  ['touchscreen55-portrait', screen(1080, 1920, true)],
];

// Every element matching `selector` that is shown has a size and lies inside
// the viewport horizontally. Returns the offenders.
async function offScreen(page, selector) {
  return page.evaluate(sel => {
    const vw = window.innerWidth;
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || el.closest('[hidden]')) continue;
      if (!el.offsetParent && style.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      const label = `${el.className || el.tagName} "${(el.textContent || el.title || '').trim().slice(0, 30)}"`;
      if (r.width < 1 || r.height < 1) out.push(`${label}: no size`);
      else if (r.left < -1 || r.right > vw + 1) out.push(`${label}: ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`);
    }
    return out;
  }, selector);
}

// Icons drawn in the colour of what is behind them - on screen and still
// invisible (the Table view's toggles were white on white). Compares an icon's
// colour with the first ancestor that paints a background.
async function invisibleIcons(page, selector) {
  return page.evaluate(sel => {
    const opaque = c => c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c);
    const out = [];
    for (const icon of document.querySelectorAll(sel)) {
      if (!icon.offsetParent) continue;
      const r = icon.getBoundingClientRect();
      if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) continue;
      let el = icon;
      let bg = null;
      while (el && el !== document.documentElement) {
        const c = getComputedStyle(el).backgroundColor;
        if (opaque(c)) { bg = c; break; }
        el = el.parentElement;
      }
      const color = getComputedStyle(icon).color;
      if (bg && color === bg) out.push(`${icon.className} in ${el.className || el.tagName}: ${color} on ${bg}`);
    }
    return out;
  }, selector);
}

async function noSidewaysScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

for (const [name, use] of DEVICES) {
  test.describe(name, () => {
    test.use(use);
    // Device emulation (isMobile) and the touch swipe (a CDP session) exist only
    // in Chromium; the whole-suite runs of Firefox and WebKit skip this file.
    test.skip(({ browserName }) => browserName !== 'chromium', 'device emulation is Chromium-only');
    let user;
    let board;
    const dir = path.join(SHOTS, name);

    test.beforeAll(() => {
      fs.mkdirSync(dir, { recursive: true });
      user = db.seedUser({ isAdmin: true });
      board = db.seedBoard({
        ownerId: user.id,
        title: `Viewports ${name}`,
        listCount: 10,
        cardTitlesPerList: [
          ['Alpha card with a long title that has to wrap somewhere', 'Beta'],
          ['Gamma', 'Delta'], ['Epsilon'], ['Zeta'], ['Eta'], ['Theta'],
        ],
      });
      // Where things were put when they were made, as the server writes it on
      // creation (seeding goes straight to the database, which writes none): the
      // first card started in List A under another title and has moved since.
      const cards = db.find('cards', { boardId: board.boardId }, { _id: 1, title: 1, listId: 1, sort: 1 });
      const lists = db.find('lists', { boardId: board.boardId }, { _id: 1, title: 1, sort: 1, swimlaneId: 1 });
      const lane = db.findOne('swimlanes', { boardId: board.boardId }, { _id: 1, title: 1, sort: 1 });
      const now = new Date();
      const first = cards.find(c => c.title.startsWith('Alpha'));
      db.insertMany('positionHistory', [
        { boardId: board.boardId, entityType: 'swimlane', entityId: lane._id, originalPosition: { sort: lane.sort, title: lane.title }, originalTitle: lane.title, createdAt: now, updatedAt: now },
        ...lists.slice(0, 3).map(l => ({ boardId: board.boardId, entityType: 'list', entityId: l._id, originalPosition: { sort: l.sort, title: l.title }, originalSwimlaneId: lane._id, originalTitle: l.title, createdAt: now, updatedAt: now })),
        { boardId: board.boardId, entityType: 'card', entityId: first._id, originalPosition: { sort: 0, title: 'First idea' }, originalSwimlaneId: lane._id, originalListId: lists.find(l => l._id !== first.listId)._id, originalTitle: 'First idea', createdAt: now, updatedAt: now },
      ]);
    });
    test.afterAll(() => {
      db.deleteMany('positionHistory', { boardId: board.boardId });
      db.cleanup({ boardIds: [board.boardId], userIds: [user.id] });
    });

    test('board header: icons and texts on screen, no sideways page scroll', async ({ page }) => {
      await loginWithToken(page, user.id, user.token);
      await openBoard(page, board.boardId, board.slug);
      await waitForMeteor(page);
      await page.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(dir, '1-board.png') });
      expect(await offScreen(page, '#header .fa, #header-main-bar .fa, .board-header-btn, .header-board-menu .fa, .board-header-title, .js-board-title')).toEqual([]);
      expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(1);
      expect(await invisibleIcons(page, '#header .fa, .board-header-btn .fa, .js-minicard .fa')).toEqual([]);
      // A minicard's title is readable, not cut to nothing.
      const title = page.locator('.js-minicard .minicard-title').first();
      await expect(title).toBeVisible();
      expect((await title.boundingBox()).width).toBeGreaterThan(40);
    });

    test('board menu → Original positions fits', async ({ page }) => {
      await loginWithToken(page, user.id, user.token);
      await openBoard(page, board.boardId, board.slug);
      await waitForMeteor(page);
      await page.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      // The one header hamburger opens whichever sidebar the page has
      // (docs/Features/Header-Bar/Header.md); the board menu cog is inside it.
      const cog = page.locator('.board-sidebar .js-open-board-menu');
      if (!(await cog.isVisible().catch(() => false))) {
        await page.locator('.js-toggle-page-sidebar').first().click();
      }
      await cog.click();
      const entry = page.locator('.pop-over .js-open-original-positions');
      await expect(entry).toBeVisible();
      await entry.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(dir, '2-board-menu.png') });
      expect(await offScreen(page, '.pop-over .js-open-original-positions, .pop-over .js-open-original-positions .fa')).toEqual([]);
      expect(await invisibleIcons(page, '.pop-over .fa')).toEqual([]);
      await entry.click();
      const view = page.locator('.original-positions-view');
      await expect(view).toBeVisible();
      await expect(page.locator('.sidebar')).toContainText('Original positions');
      await page.waitForTimeout(500);
      // The seeded rows, by today's names, with the moved card marked.
      await expect(view.locator('.original-positions-group')).toHaveCount(3);
      await expect(view).toContainText('First idea');
      await expect(view.locator('.original-position-moved')).toHaveCount(1);
      await page.screenshot({ path: path.join(dir, '3-original-positions.png') });
      expect(await offScreen(page, '.original-positions-view, .original-positions-view .fa, .original-positions-view h3, .js-refresh-history')).toEqual([]);
    });

    for (const [area, label] of [['ram', 'Memory Usage'], ['disk', 'Disk usage']]) {
      test(`Admin Panel → Problems → ${label} shows its live line`, async ({ page }) => {
        await loginWithToken(page, user.id, user.token);
        await page.goto(`/admin/problems/${area}`);
        const live = page.locator('.admin-cpu-current').first();
        await expect(live).toBeVisible({ timeout: 30_000 });
        await expect(live).toContainText('%');
        await expect(live).toContainText(label);
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(dir, `4-problems-${area}.png`) });
        expect(await offScreen(page, '.admin-cpu-current, .admin-cpu-label, .admin-cpu-percent, .side-menu li a')).toEqual([]);
        // The left menu has no list bullets at any width (they showed as a dot
        // after every entry on a phone).
        expect(await page.evaluate(() => getComputedStyle(document.querySelector('.side-menu ul')).listStyleType)).toBe('none');
        await live.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(dir, `4-problems-${area}-live.png`) });
        // The event table's headers stay readable: a column is never squeezed to
        // a letter per line (13 columns on a phone once were, about 25px each).
        const narrowest = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.table-page-table th')]
          .map(th => th.getBoundingClientRect().width)));
        expect(narrowest).toBeGreaterThanOrEqual(50);
        expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(1);
      });
    }

    test('Admin Panel → Problems → Instrumentation shows its areas as bars that fit', async ({ page }) => {
      await loginWithToken(page, user.id, user.token);
      await page.goto('/admin/problems/instrumentation');
      const bars = page.locator('.instrumentation-areas');
      await expect(bars.locator('.instrumentation-area').first()).toBeVisible({ timeout: 30_000 });
      await bars.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(dir, '4-problems-instrumentation.png') });
      expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(1);
      expect(await offScreen(page, '.instrumentation-area-name, .instrumentation-area-bar, .instrumentation-area-num:not(:empty)')).toEqual([]);
      // Every bar has room to show its length.
      const narrowest = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.instrumentation-area-bar')]
        .map(bar => bar.getBoundingClientRect().width)));
      expect(narrowest).toBeGreaterThanOrEqual(60);
    });

    for (const [view, content] of [
      ['table', '.table-view-table'],
      ['calendar-mode', '.calendar-mode-view'],
      ['time', '.stats-view-content'],
      ['timeline', '.stats-view-content'],
      ['map', '.map-view'],
    ]) {
      test(`the ${view} view opens and fits`, async ({ page }) => {
        await loginWithToken(page, user.id, user.token);
        await openBoard(page, board.boardId, board.slug);
        await waitForMeteor(page);
        await page.locator('.js-toggle-board-view').first().click();
        const item = page.locator(`.pop-over .js-open-${view}-view`);
        await item.scrollIntoViewIfNeeded();
        await item.click();
        const shown = page.locator(content).first();
        await expect(shown).toBeVisible({ timeout: 20_000 });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(dir, `5-view-${view}.png`) });
        expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(1);
        expect(await offScreen(page, '.board-header-btn, .js-toggle-board-view')).toEqual([]);
        expect(await invisibleIcons(page, '.board-canvas .fa, .board-header-btn .fa')).toEqual([]);
        if (view === 'table') {
          // Every column can be reached by a person: one that starts past the
          // screen edge must sit in a container they can scroll (overflow-x
          // auto or scroll): the table itself at 800px and below, its wrapper
          // above that. The board canvas around it is overflow-x: hidden, which
          // script can scroll but a finger or a wheel cannot, so it does not
          // count - on an upright iPad the date columns were cut off that way.
          const unreachable = await page.evaluate(() => [...document.querySelectorAll('.table-view-table thead th')]
            .filter(th => th.offsetParent)
            .filter(th => {
              const r = th.getBoundingClientRect();
              if (r.left >= -1 && r.right <= innerWidth + 1) return false;
              for (let el = th.parentElement; el && el !== document.body; el = el.parentElement) {
                const s = getComputedStyle(el);
                if (/(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth) return false;
              }
              return true;
            })
            .map(th => `"${th.textContent.trim()}" at ${Math.round(th.getBoundingClientRect().left)}`));
          expect(unreachable).toEqual([]);
        }
        // Back to Swimlanes so the next test starts where a user does.
        await page.locator('.js-toggle-board-view').first().click();
        await page.locator('.pop-over .js-open-swimlanes-view').click();
      });
    }

    test('dragscroll pans the board', async ({ page }) => {
      await loginWithToken(page, user.id, user.token);
      await openBoard(page, board.boardId, board.slug);
      await waitForMeteor(page);
      await page.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(800);
      // The board's dragscroll container that overflows, the axis it overflows
      // on, and a point inside it that is neither a card, a handle nor a field.
      const plan = await page.evaluate(() => {
        const scrollers = [...document.querySelectorAll('.dragscroll')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 &&
            (el.scrollWidth > el.clientWidth + 20 || el.scrollHeight > el.clientHeight + 20);
        });
        for (const el of scrollers) {
          const axis = el.scrollWidth > el.clientWidth + 20 ? 'x' : 'y';
          const r = el.getBoundingClientRect();
          const top = Math.max(r.top, 0) + 10;
          const bottom = Math.min(r.bottom, window.innerHeight) - 10;
          const left = Math.max(r.left, 0) + 10;
          const right = Math.min(r.right, window.innerWidth) - 10;
          for (let y = bottom; y > top; y -= 15) {
            for (let x = left + (right - left) / 2; x < right; x += 25) {
              const hit = document.elementFromPoint(x, y);
              if (!hit || hit.closest('.dragscroll') !== el) continue;
              if (hit.closest('input, select, textarea, a, button, .nodragscroll, .handle, .ui-sortable-handle, .js-minicard, .js-list-header')) continue;
              // A finger is not a point: the browser snaps a touch to an
              // interactive element nearby, so a swipe that starts beside a
              // list's resize handle resizes the list - correctly - instead of
              // panning. Start where a person would pan: clear of every handle.
              const near = [...document.querySelectorAll('.js-list-resize-handle, .js-swimlane-resize-handle, .handle, .ui-sortable-handle')]
                .some(h => {
                  const b = h.getBoundingClientRect();
                  return b.width && x > b.left - 40 && x < b.right + 40 && y > b.top - 40 && y < b.bottom + 40;
                });
              if (near) continue;
              return { axis, x, y, cls: el.className, before: axis === 'x' ? el.scrollLeft : el.scrollTop,
                room: axis === 'x' ? right - left : bottom - top };
            }
          }
        }
        return null;
      });
      test.skip(!plan, 'nothing on this board overflows its dragscroll container at this size');
      const distance = Math.min(200, Math.floor(plan.room / 3));
      const dx = plan.axis === 'x' ? -distance : 0;
      const dy = plan.axis === 'y' ? -distance : 0;
      if (use.hasTouch) {
        const cdp = await page.context().newCDPSession(page);
        const point = (x, y) => [{ x, y, id: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(plan.x, plan.y) });
        for (let i = 1; i <= 10; i++) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove', touchPoints: point(plan.x + (dx * i) / 10, plan.y + (dy * i) / 10),
          });
          await page.waitForTimeout(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(plan.x, plan.y);
        await page.mouse.down();
        await page.mouse.move(plan.x + dx, plan.y + dy, { steps: 10 });
        await page.mouse.up();
      }
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(dir, '6-dragscroll.png') });
      const after = await page.evaluate(({ cls, axis }) => {
        const el = [...document.querySelectorAll('.dragscroll')].find(e => e.className === cls);
        return el ? (axis === 'x' ? el.scrollLeft : el.scrollTop) : null;
      }, plan);
      expect(after - plan.before, `${plan.axis}-scroll of ${plan.cls}`).toBeGreaterThan(distance / 3);
    });
  });
}
