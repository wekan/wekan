'use strict';

// Guard: #2171 - a search result is revealed on the board: scrolled into the
// middle of the view and highlighted, not only opened.
// Run: node tests/revealOnBoard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function load() {
  const code = read('client/lib/revealOnBoard.js').replace(/^export \{[^}]*\};?$/m, '').replace(/^export /gm, '');
  const context = { setTimeout, Promise, String };
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.revealOnBoard = revealOnBoard; this.HIGHLIGHT_CLASS = HIGHLIGHT_CLASS;`, context);
  return context;
}

function board() {
  const dom = new JSDOM(`<div class="board-sidebar"><a class="js-minicard" data-card-id="c1">in the sidebar</a></div>
    <div class="board-canvas"><div class="list js-list" id="js-list-l1"><a class="js-minicard" data-card-id="c1">on the board</a></div></div>`);
  const scrolled = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function (options) { scrolled.push([this.textContent, options.block]); };
  return { doc: dom.window.document, scrolled };
}

(async () => {
  const { revealOnBoard, HIGHLIGHT_CLASS } = load();
  let passed = 0;
  const timers = [];
  const setTimer = (fn) => { timers.push(fn); };

  {
    const { doc, scrolled } = board();
    assert.strictEqual(await revealOnBoard({ cardId: 'c1' }, { doc, setTimer, smooth: false }), true);
    assert.deepStrictEqual(scrolled, [['on the board', 'center']], 'the board\'s card, not the sidebar copy, is scrolled to the middle');
    const card = doc.querySelector('.board-canvas .js-minicard');
    assert.ok(card.classList.contains(HIGHLIGHT_CLASS), 'highlighted');
    assert.ok(!doc.querySelector('.board-sidebar .js-minicard').classList.contains(HIGHLIGHT_CLASS));
    timers.pop()();
    assert.ok(!card.classList.contains(HIGHLIGHT_CLASS), 'and only for a moment');
    passed += 1; console.log('ok - a card found is scrolled to and highlighted on the board');
  }
  {
    // Stepping to the next result (Enter) moves the highlight: the last one is
    // not left lit beside the new one for the rest of its moment.
    const dom = new JSDOM(`<div class="board-canvas"><a class="js-minicard" data-card-id="a">A</a><a class="js-minicard" data-card-id="b">B</a></div>`);
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
    const doc = dom.window.document;
    await revealOnBoard({ cardId: 'a' }, { doc, setTimer: () => {}, smooth: false });
    await revealOnBoard({ cardId: 'b' }, { doc, setTimer: () => {}, smooth: false });
    assert.deepStrictEqual([...doc.querySelectorAll(`.${HIGHLIGHT_CLASS}`)].map(el => el.dataset.cardId), ['b']);
    passed += 1; console.log('ok - one result is highlighted at a time');
  }
  {
    const { doc, scrolled } = board();
    assert.strictEqual(await revealOnBoard({ listId: 'l1' }, { doc, setTimer: fn => fn(), smooth: false }), true);
    assert.strictEqual(scrolled.length, 1);
    passed += 1; console.log('ok - a list found is revealed too');
  }
  {
    const { doc } = board();
    let tries = 0;
    const ok = await revealOnBoard({ cardId: 'missing' }, { doc, setTimer: (fn) => { tries += 1; fn(); } });
    assert.strictEqual(ok, false);
    assert.ok(tries > 0 && tries < 50, 'retries a little while the board draws, then gives up quietly');
    // negative: an id is never a selector a search term could shape
    assert.strictEqual(await revealOnBoard({ cardId: 'x"],body,a[x="' }, { doc, setTimer }), false);
    passed += 1; console.log('ok - negative: nothing to find, or not an id, reveals nothing');
  }
  {
    const js = read('client/components/sidebar/sidebarSearches.js');
    assert.match(js, /revealOnBoard\(\{ cardId: /);
    assert.match(js, /revealOnBoard\(\{ listId: /);
    assert.match(read('client/components/sidebar/sidebarSearches.css'), /\.is-search-highlight/);
    // Enter on the same term steps on, wrapping round; a new term starts over.
    assert.match(js, /if \(term !== tpl\.term\.get\(\)\) \{\s*tpl\.term\.set\(term\);\s*tpl\.step\.set\(0\);/);
    assert.match(js, /if \(evt\.key === 'Enter'\) tpl\.backwards = evt\.shiftKey;/);
    assert.match(js, /\(\(current - 1 \+ direction \+ cards\.length\) % cards\.length\) \+ 1/);
    // the step itself, run on its own: forward wraps to 1, back wraps to the last
    const stepSrc = js.slice(js.indexOf('function step(tpl, direction)'), js.indexOf('Template.searchSidebar.events'));
    const revealed = [];
    const run = new Function('foundCards', 'revealOnBoard', `${stepSrc}; return step;`)(() => [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }], x => revealed.push(x.cardId));
    let n = 0; const tpl = { step: { get: () => n, set: v => { n = v; } } };
    run(tpl, -1); run(tpl, 1); run(tpl, 1); run(tpl, -1);
    assert.deepStrictEqual(revealed, ['c', 'a', 'b', 'a'], 'back from none is the last, then it wraps both ways');
    assert.match(read('client/components/sidebar/sidebarSearches.css'), /prefers-reduced-motion: reduce/);
    passed += 1; console.log('ok - the board search sidebar reveals what it found');
  }
  console.log(`# ${passed} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
