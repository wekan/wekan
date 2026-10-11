'use strict';
(async () => {

// Plain-Node unit test (no Meteor, no browser) for #6430's card drop preview.
// Run: node tests/cardDropPreviewSource.test.cjs
//
// #6430 "Card flicker (~1 sec) on drag": the stop handler must call
// sortable('cancel'), which puts the dragged card back at its SOURCE before
// Blaze re-renders it at its destination. b687f37272 added a preview that
// fills the DROP slot meanwhile - but left the real card visible at the
// source, so for that gap the card was drawn in BOTH lists. The reporter's
// video (comment 6111272360) shows exactly that frame: card "2" already in
// the target list and still in the source list, then the source catches up.
//
// client/lib/cardDropPreview.js now also hides the source node until the move
// lands, and shows it again when the move fails or never arrives. This drives
// that code against a minimal DOM: a container is a list of children, and the
// sibling/connected properties are derived from it the way the browser does.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ── timers the test controls ───────────────────────────────────────────────
let clock = 0;
let timers = [];
globalThis.setTimeout = (fn, ms) => {
  const t = { fn, at: clock + ms };
  timers.push(t);
  return t;
};
globalThis.clearTimeout = (t) => {
  timers = timers.filter((x) => x !== t);
};
function advance(ms) {
  clock += ms;
  const due = timers.filter((t) => t.at <= clock);
  timers = timers.filter((t) => t.at > clock);
  due.forEach((t) => t.fn());
}

// ── a minimal DOM ──────────────────────────────────────────────────────────
const observers = [];
globalThis.MutationObserver = class {
  constructor(cb) { this.cb = cb; this.target = null; observers.push(this); }
  observe(target) { this.target = target; }
  disconnect() { this.target = null; }
};
globalThis.CSS = { escape: (s) => s };
function notify(container) {
  observers.filter((o) => o.target === container).forEach((o) => o.cb([]));
}

class Container {
  constructor(name) { this.name = name; this.children = []; }
  insertBefore(node, ref) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const i = ref ? this.children.indexOf(ref) : -1;
    if (i === -1) this.children.push(node); else this.children.splice(i, 0, node);
    node.parent = this;
  }
  append(node) { this.insertBefore(node, null); }
  querySelectorAll(selector) {
    const id = /data-card-id="([^"]+)"/.exec(selector)[1];
    return this.children.filter((c) => c.cardId === id);
  }
}

class Card {
  constructor(cardId) {
    this.cardId = cardId;
    this.parent = null;
    this.style = { display: '' };
    this.attrs = {};
    const classes = new Set(['minicard-wrapper', 'js-minicard']);
    this.classList = {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      contains: (c) => classes.has(c),
    };
  }
  get isConnected() { return !!this.parent; }
  get nextSibling() { return this.sibling(1); }
  get previousElementSibling() { return this.sibling(-1); }
  get nextElementSibling() { return this.sibling(1); }
  sibling(d) {
    if (!this.parent) return null;
    return this.parent.children[this.parent.children.indexOf(this) + d] || null;
  }
  cloneNode() { const c = new Card(this.cardId); return c; }
  removeAttribute(a) { delete this.attrs[a]; }
  setAttribute(a, v) { this.attrs[a] = v; }
  remove() {
    if (!this.parent) return;
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
  get visible() { return this.isConnected && this.style.display !== 'none'; }
}

const {
  createCardDropPreview,
  retireCardDropPreview,
  cardReachedDropSlot,
} = await import('../client/lib/cardDropPreview.js');

let passed = 0;
async function test(name, fn) {
  observers.length = 0; timers = []; clock = 0;
  await fn();
  passed += 1;
  console.log('  ok -', name);
}
const tick = () => new Promise((r) => setImmediate(r));

// One drag, the way list.js's stop handler runs it: the item is in the drop
// slot, the preview goes beside it, sortable('cancel') puts the item back,
// then the move is started and the preview handed to retire.
function drop({ source, target, item, slotBefore, cancelBefore, moveResult }) {
  target.insertBefore(item, slotBefore);
  const preview = createCardDropPreview(item, target);
  source.insertBefore(item, cancelBefore);
  retireCardDropPreview(preview, item.cardId, target, moveResult, item);
  return preview;
}

console.log('cardDropPreviewSource:');

await test('a move to another list never shows the card in both lists', async () => {
  const source = new Container('test');
  const target = new Container('test 2');
  const [s1, s2, sB, s3] = ['1', '2', 'B', '3'].map((t) => new Card(t));
  [s1, s2, sB, s3].forEach((c) => source.append(c));
  const [a, C, D] = ['a', 'C', 'D'].map((t) => new Card(t));
  [a, C, D].forEach((c) => target.append(c));

  // The video: "2" dropped between C and D.
  const preview = drop({ source, target, item: s2, slotBefore: D, cancelBefore: sB });

  // The frame the reporter saw: the target shows the card (the preview)...
  assert.deepStrictEqual(target.children.map((c) => c.cardId), ['a', 'C', '2', 'D']);
  // ...and the source must NOT show it too.
  assert.strictEqual(s2.visible, false, 'the source copy is hidden after sortable("cancel")');
  assert.deepStrictEqual(
    source.children.filter((c) => c.visible).map((c) => c.cardId),
    ['1', 'B', '3'],
  );

  // Blaze renders the moved card in the target BEFORE it removes the source
  // copy: the source copy must stay hidden through that gap.
  const real = new Card('2');
  target.insertBefore(real, preview);
  notify(target);
  assert.strictEqual(preview.isConnected, false, 'the preview goes once the real card is there');
  assert.strictEqual(s2.visible, false, 'the source copy is not shown again on success');

  // Then Blaze removes it, and the board is as it should be.
  s2.remove();
  advance(10_000);
  assert.deepStrictEqual(source.children.map((c) => c.cardId), ['1', 'B', '3']);
  assert.deepStrictEqual(target.children.map((c) => c.cardId), ['a', 'C', '2', 'D']);
});

await test('a reorder within one list does not jump the card back first', async () => {
  const list = new Container('test');
  const [X, A, B] = ['X', 'A', 'B'].map((t) => new Card(t));
  [X, A, B].forEach((c) => list.append(c));

  // X dragged between A and B; cancel puts it back on top.
  const preview = drop({ source: list, target: list, item: X, slotBefore: B, cancelBefore: A });
  assert.deepStrictEqual(list.children.map((c) => c.cardId), ['X', 'A', 'X', 'B']);
  assert.strictEqual(preview.isConnected, true, 'the original at its OLD place is not "arrived"');
  assert.deepStrictEqual(
    list.children.filter((c) => c.visible).map((c) => c === preview ? 'preview' : c.cardId),
    ['A', 'preview', 'B'],
    'only the drop slot shows the card',
  );

  // Blaze moves the same node into place.
  list.insertBefore(X, preview);
  notify(list);
  assert.strictEqual(preview.isConnected, false);
  assert.strictEqual(X.visible, true, 'the moved card is shown again');
  assert.deepStrictEqual(list.children.map((c) => c.cardId), ['A', 'X', 'B']);
});

await test('a drop back in its own place changes nothing', async () => {
  const list = new Container('test');
  const [A, X, B] = ['A', 'X', 'B'].map((t) => new Card(t));
  [A, X, B].forEach((c) => list.append(c));
  const preview = drop({ source: list, target: list, item: X, slotBefore: B, cancelBefore: B });
  assert.strictEqual(preview.isConnected, false);
  assert.strictEqual(X.visible, true);
  assert.deepStrictEqual(list.children.map((c) => c.cardId), ['A', 'X', 'B']);
});

// ── negative: the card is never left invisible ─────────────────────────────

await test('a rejected move shows the card back at its source', async () => {
  const source = new Container('s');
  const target = new Container('t');
  const card = new Card('c'); const other = new Card('o');
  source.append(card); source.append(other);
  const failing = Promise.reject(new Error('denied'));
  const preview = drop({ source, target, item: card, slotBefore: null, cancelBefore: other, moveResult: failing });
  assert.strictEqual(card.visible, false);
  await tick();
  assert.strictEqual(preview.isConnected, false, 'no stale preview');
  assert.strictEqual(card.visible, true, 'the card reappears where it still is');
});

await test('a move that never arrives restores the card after the timeout', async () => {
  const source = new Container('s');
  const target = new Container('t');
  const card = new Card('c'); const other = new Card('o');
  source.append(card); source.append(other);
  const preview = drop({ source, target, item: card, slotBefore: null, cancelBefore: other });
  advance(9_999);
  assert.strictEqual(card.visible, false);
  advance(1);
  assert.strictEqual(preview.isConnected, false);
  assert.strictEqual(card.visible, true);
});

await test('a source copy Blaze never removes is shown again', async () => {
  const source = new Container('s');
  const target = new Container('t');
  const card = new Card('c'); const other = new Card('o');
  source.append(card); source.append(other);
  const preview = drop({ source, target, item: card, slotBefore: null, cancelBefore: other });
  target.insertBefore(new Card('c'), preview);
  notify(target);
  assert.strictEqual(card.visible, false);
  advance(10_000);
  assert.strictEqual(card.visible, true, 'never left invisible while still in the DOM');
});

await test('only another node, or the original beside the preview, counts as arrived', async () => {
  const list = new Container('l');
  const [orig, mid] = [new Card('c'), new Card('m')];
  const preview = new Card('c'); preview.classList.add('card-drop-preview');
  [orig, mid, preview].forEach((c) => list.append(c));
  assert.strictEqual(cardReachedDropSlot([orig, preview], preview, orig), false);
  assert.strictEqual(cardReachedDropSlot([preview], preview, orig), false);
  list.insertBefore(orig, preview);
  assert.strictEqual(cardReachedDropSlot([orig, preview], preview, orig), true);
  assert.strictEqual(cardReachedDropSlot([new Card('c'), preview], preview, orig), true);
});

// ── and nowhere else: every caller hands over the source node ──────────────
await test('every retireCardDropPreview call passes the node to hide', async () => {
  const root = path.join(__dirname, '..');
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '_build', '.build', '.tools', '.git', '.meteor', 'tests'].includes(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.js$/.test(e.name)) files.push(f);
    }
  })(root);
  const calls = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/retireCardDropPreview\(([^)]*)\)/g)) {
      if (/export function/.test(src.slice(Math.max(0, m.index - 20), m.index))) continue;
      calls.push({ f: path.relative(root, f), args: m[1].split(',').map((s) => s.trim()).filter(Boolean) });
    }
  }
  assert.ok(calls.length >= 1, 'list.js calls retireCardDropPreview');
  for (const c of calls) {
    assert.strictEqual(c.args.length, 5, `${c.f} must pass the source node as the 5th argument`);
  }
  const list = fs.readFileSync(path.join(root, 'client/components/lists/list.js'), 'utf8');
  assert.ok(
    /retireCardDropPreview\(\s*dropPreview,\s*card\._id,\s*targetContainer,\s*moveResult,\s*cardDomElement,?\s*\)/.test(list),
    'list.js hands over cardDomElement, the node sortable("cancel") put back',
  );
});

console.log(`\ncardDropPreviewSource: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
