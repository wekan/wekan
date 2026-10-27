'use strict';

// Apple Glass Pastel: every text stands out from what is really behind it.
//
// A glass surface has no colour of its own - it is a translucent fill, a
// backdrop blur, a rim of light and a sheen over a pastel mesh - so a contrast
// check that reads `background-color` would measure nothing. This one measures
// what the screen shows: it records each visible text's colour and box, hides
// every text, takes a screenshot, and reads the pixels that were under the
// text. The ratio is WCAG 2's, against the AA limits: 4.5:1 for ordinary text,
// 3:1 for large text (24px, or 18.66px bold).
// client/components/boards/boardColors.css, THEME - Apple Glass Pastel.

const path = require('path');
const fs = require('fs');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const THEME = 'appleglasspastel';
const SHOTS = path.join(__dirname, '..', 'test-results', 'appleglasspastel-contrast');

// The texts of `scope` that are on screen and on top: colour, box, size.
function collect(scope) {
  const out = [];
  const seen = new Set();
  for (const root of document.querySelectorAll(scope)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent.trim();
      const el = node.parentElement;
      if (!text || !el || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      let o = 1;
      for (let a = el; a; a = a.parentElement) o *= Number(getComputedStyle(a).opacity);
      if (o < 0.05) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width < 3 || r.height < 6 || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
      const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
      const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const top = document.elementFromPoint(cx, cy);
      if (!top || !(top === el || el.contains(top) || top.contains(el))) continue;
      const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      el.dataset.contrastId = String(out.length);
      out.push({
        id: out.length, kind: 'text',
        text: text.slice(0, 40), color: cs.color, opacity: o,
        x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(r.width, innerWidth - r.left), h: Math.min(r.height, innerHeight - r.top),
        size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) || 400,
        where: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`,
      });
    }
    // Icons: Font Awesome glyphs, drawn in their element's colour. WCAG 1.4.11
    // asks 3:1 of a graphic that says what a control does.
    for (const el of root.querySelectorAll('i.fa, .fa')) {
      if (seen.has(el) || el.dataset.contrastId) continue;
      const glyph = getComputedStyle(el, '::before').content;
      if (!glyph || glyph === 'none' || glyph === 'normal' || glyph === '""') continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      let o = 1;
      for (let a = el; a; a = a.parentElement) o *= Number(getComputedStyle(a).opacity);
      if (o < 0.05) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 6 || r.height < 6 || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
      const top = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, r.top + r.height / 2));
      if (!top || !(top === el || el.contains(top) || top.contains(el))) continue;
      seen.add(el);
      el.dataset.contrastId = String(out.length);
      out.push({
        id: out.length, kind: 'icon', text: `icon ${[...el.classList].filter(c => c.startsWith('fa-')).join(' ')}`,
        color: cs.color, opacity: o, x: r.left, y: r.top, w: r.width, h: r.height, size: 24, weight: 400,
        where: `${(() => { const c = el.closest('a, button'); return c ? `${c.tagName.toLowerCase()}.${[...c.classList].slice(0, 3).join('.')}` : (el.parentElement ? el.parentElement.tagName.toLowerCase() : ''); })()}>i`,
      });
    }
  }
  return out;
}

// The boxes again, as they are now - after the texts were hidden.
function reboxes(items) {
  return items.map(item => {
    const el = document.querySelector(`[data-contrast-id="${item.id}"]`);
    if (!el) return item;
    let r = el.getBoundingClientRect();
    if (item.kind === 'text') {
      const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (node) { const range = document.createRange(); range.selectNodeContents(node); r = range.getBoundingClientRect(); }
    }
    return { ...item, x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(r.width, innerWidth - r.left), h: Math.min(r.height, innerHeight - r.top) };
  });
}

// The contrast of each text against the median colour of the pixels under it.
async function judge({ items, png }) {
  const img = new Image();
  img.src = `data:image/png;base64,${png}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const scale = img.width / innerWidth;
  const lin = c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  return items.map(item => {
    const x = Math.floor(item.x * scale);
    const y = Math.floor(item.y * scale);
    const w = Math.max(1, Math.floor(item.w * scale));
    const h = Math.max(1, Math.floor(item.h * scale));
    const data = ctx.getImageData(x, y, w, h).data;
    const rs = []; const gs = []; const bs = [];
    // Pixels outside the screenshot read as transparent black; they are not
    // what is behind the text.
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
    }
    if (!rs.length) return null;
    const bg = [median(rs), median(gs), median(bs)];
    const m = item.color.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = 1] = m ? m[1].split(/[ ,/]+/).filter(Boolean).map(Number) : [0, 0, 0, 1];
    const alpha = a * item.opacity;
    const fg = [r, g, b].map((c, i) => c * alpha + bg[i] * (1 - alpha));
    const [hi, lo] = [lum(fg), lum(bg)].sort((p, q) => q - p);
    const ratio = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    const large = item.kind === 'icon' || item.size >= 24 || (item.size >= 18.66 && item.weight >= 700);
    return { ...item, bg: `rgb(${bg.join(',')})`, ratio, min: large ? 3 : 4.5 };
  });
}

async function measure(page, scope, name, { minItems = 4 } = {}) {
  const found = await page.evaluate(collect, scope);
  const style = await page.addStyleTag({ content: '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }' });
  await page.waitForTimeout(150);
  const png = (await page.screenshot()).toString('base64');
  const items = await page.evaluate(reboxes, found);
  await style.evaluate(el => el.remove());
  await page.evaluate(() => document.querySelectorAll('[data-contrast-id]').forEach(el => el.removeAttribute('data-contrast-id')));
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  const visible = items.filter(i => i.w >= 1 && i.h >= 1 && i.y < page.viewportSize().height && i.x < page.viewportSize().width);
  const results = (await page.evaluate(judge, { items: visible, png })).filter(Boolean);
  const failing = results.filter(r => r.ratio < r.min);
  expect(results.length, `${name}: some text was measured`).toBeGreaterThanOrEqual(minItems);
  expect(failing.map(f => `${f.where} "${f.text}" ${f.color} on ${f.bg} = ${f.ratio}:1 (needs ${f.min})`), name).toEqual([]);
  return results;
}

async function themedBoard(board) {
  db.updateOne('boards', { _id: board.boardId }, { $set: { color: THEME } });
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' },
    { $set: { description: 'A longer description so the card details have body text to read.' } });
}

for (const vp of [{ name: 'laptop', width: 1366, height: 768 }, { name: 'phone', width: 390, height: 844 }]) {
  test.describe(`Apple Glass Pastel contrast, ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('the header bars, swimlanes, lists and minicards', async ({ boardPage, board }) => {
      await themedBoard(board);
      await boardPage.reload();
      await boardPage.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      await expect(boardPage.locator('#header-quick-access')).toHaveClass(new RegExp(`board-color-${THEME}`));
      // The stock logo is white for the blue bar; on glass it is drawn dark.
      const logo = boardPage.locator('#header-quick-access div.header-logo img');
      if (await logo.count()) expect(await logo.evaluate(img => getComputedStyle(img).filter)).toContain('brightness');
      await measure(boardPage, '#header-quick-access, #header, .board-canvas', `${vp.name}-board`);
    });

    test('the opened card', async ({ boardPage, board }) => {
      await themedBoard(board);
      await boardPage.reload();
      await boardPage.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      // Wait for the theme, as the header test does: the board's colour was
      // written straight to the database, and measuring before the reloaded
      // page has it measures WeKan's stock colours instead.
      await expect(boardPage.locator('#header-quick-access')).toHaveClass(new RegExp(`board-color-${THEME}`));
      const bp = new BoardPage(boardPage);
      const cp = new CardPage(boardPage);
      await bp.clickCard(board.listIds[0], 'Alpha Card');
      await cp.waitForOpen();
      await measure(boardPage, '.card-details', `${vp.name}-card`);
    });

    test('the sidebar and the board menu', async ({ boardPage, board }) => {
      await themedBoard(board);
      await boardPage.reload();
      await boardPage.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
      // Wait for the theme, as the header test does: the board's colour was
      // written straight to the database, and measuring before the reloaded
      // page has it measures WeKan's stock colours instead.
      await expect(boardPage.locator('#header-quick-access')).toHaveClass(new RegExp(`board-color-${THEME}`));
      const cog = boardPage.locator('.board-sidebar .js-open-board-menu');
      if (!(await cog.isVisible().catch(() => false))) await boardPage.locator('.js-toggle-page-sidebar').first().click();
      await expect(cog).toBeVisible();
      await measure(boardPage, '.board-sidebar', `${vp.name}-sidebar`);
      await cog.click();
      await expect(boardPage.locator('.pop-over')).toBeVisible();
      await measure(boardPage, '.pop-over', `${vp.name}-board-menu`);
    });

    test('the board tile on All Boards', async ({ page, user, board }) => {
      await themedBoard(board);
      await loginWithToken(page, user.id, user.token);
      await page.goto('/');
      const tile = page.locator(`.board-list li.board-color-${THEME}`).first();
      await expect(tile).toBeVisible({ timeout: 30_000 });
      await tile.scrollIntoViewIfNeeded();
      await measure(page, `.board-list li.board-color-${THEME}`, `${vp.name}-all-boards`, { minItems: 1 });
    });
  });
}
