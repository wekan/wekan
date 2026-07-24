'use strict';

// The board bar (the second header bar: board title, edit, visibility, watch,
// star, sort | filter, search, view, dependencies, multi-selection, hamburger)
// wrapped onto TWO rows on iPad landscape. Measured from the report at a 1180 CSS
// px viewport: the rows needed ~613px + ~691px = ~1304px on one line, ~124px more
// than the viewport.
//
// Almost all of that is per-button chrome rather than text, so header.css halves
// the chrome between 801px and 1400px instead of hiding anything, and drops the
// labels to icons only in the narrower tablet band (801-1000px) where even the
// halved chrome cannot fit them. This test guards the ARITHMETIC - that the
// halving still frees more than the measured deficit - not just that some rule is
// present.
//
// Run: node tests/boardHeaderOneLine.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const cssPath = path.join(root, 'client/components/main/header.css');
const css = fs.readFileSync(cssPath, 'utf8');
const jade = fs.readFileSync(
  path.join(root, 'client/components/boards/boardHeader.jade'), 'utf8');

// The measured one-line shortfall on iPad landscape (1180px viewport).
const DEFICIT_PX = 124;
// Buttons on the bar in the reported screenshot: edit, visibility, watch, star,
// sort | filter, search, view toggle, dependencies, multi-selection, hamburger.
const BUTTON_COUNT = 11;

// Body of the @media block whose query contains `queryPart`, brace-balanced.
function mediaBlock(queryPart) {
  const at = css.indexOf(`@media ${queryPart}`);
  assert.ok(at >= 0, `@media ${queryPart} must exist in header.css`);
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return { body: css.slice(open + 1, i), start: at };
    }
  }
  throw new Error(`unbalanced braces after @media ${queryPart}`);
}

// First declaration `prop` of the rule whose selector is `selector`, as a number
// of px. `margin: 0 6px` -> 6 (the side margin is what costs horizontal room).
function sideMarginPx(scope, selector, prop) {
  const rule = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const m = rule.exec(scope);
  assert.ok(m, `rule "${selector}" must exist`);
  const decl = new RegExp(`${prop}\\s*:([^;]*);`).exec(m[1]);
  assert.ok(decl, `"${selector}" must declare ${prop}`);
  const values = decl[1].trim().split(/\s+/);
  // margin: 0 12px -> the second value; margin-inline-end: 10px -> the only one.
  const px = values.length > 1 ? values[1] : values[0];
  const n = parseFloat(px);
  assert.ok(!Number.isNaN(n), `${prop} of "${selector}" must be a px number`);
  return n;
}

const BASE = css.slice(0, css.indexOf('@media'));
const tablet = mediaBlock('screen and (min-width: 801px) and (max-width: 1400px)');
const portrait = mediaBlock('screen and (min-width: 801px) and (max-width: 1000px)');

console.log('boardHeaderOneLine:');

test('the base per-button chrome is what the fix was measured against', () => {
  // If these change, the saving below changes with them - recompute the deficit.
  assert.strictEqual(
    sideMarginPx(BASE, '#header #header-main-bar .board-header-btn', 'margin'), 12);
  assert.strictEqual(
    sideMarginPx(BASE, '#header #header-main-bar .board-header-btn i.fa', 'margin'), 10);
  assert.strictEqual(
    sideMarginPx(BASE, '#header #header-main-bar .board-header-btn i.fa + span',
      'margin-inline-end'), 10);
});

test('the tablet block halves the chrome, freeing more than the deficit', () => {
  const btn = sideMarginPx(tablet.body, '#header #header-main-bar .board-header-btn', 'margin');
  const icon = sideMarginPx(tablet.body, '#header #header-main-bar .board-header-btn i.fa', 'margin');
  const span = sideMarginPx(tablet.body,
    '#header #header-main-bar .board-header-btn i.fa + span', 'margin-inline-end');

  // Both sides of the button and both sides of the icon, plus the label gap.
  const perButton = 2 * (12 - btn) + 2 * (10 - icon) + (10 - span);
  const freed = perButton * BUTTON_COUNT;
  assert.ok(freed >= DEFICIT_PX,
    `halving the chrome frees ${freed}px but the bar is ${DEFICIT_PX}px too wide`);
  // Keep real slack for languages with longer labels than the Finnish report.
  assert.ok(freed >= DEFICIT_PX * 2,
    `only ${freed}px freed - too tight for longer translations`);
});

test('the tablet block only shrinks empty space, never the touch target', () => {
  // #6419 sized these buttons for touch. Shrinking them vertically or making the
  // text smaller is how that regression would come back, so the block may only
  // move horizontal space around.
  for (const prop of ['height', 'font-size', 'line-height', 'min-height']) {
    assert.ok(!new RegExp(`(^|[;{\\s])${prop}\\s*:`).test(tablet.body),
      `the tablet block must not set ${prop} - it may only change spacing`);
  }
  // Every rule that targets a BUTTON may declare margins and nothing else (the
  // h1 title's horizontal padding is fine - it is not a touch target).
  // Capture selector and body directly, so neither brace ends up in the text and
  // there is nothing to strip afterwards.
  const RULE = /([^{}]+)\{([^{}]*)\}/g;
  let rule;
  while ((rule = RULE.exec(tablet.body)) !== null) {
    const [, selector, body] = rule;
    if (!/board-header-btn/.test(selector)) continue;
    for (const decl of body.split(';')) {
      if (!decl.trim()) continue;
      const prop = decl.split(':')[0].trim();
      assert.ok(/^margin/.test(prop),
        `"${selector.trim()}" sets ${prop}; buttons may only have margins changed`);
    }
  }
});

test('tablet portrait falls back to icons only', () => {
  assert.ok(
    /#header #header-main-bar \.board-header-btn i\.fa \+ span\s*\{[^}]*display:\s*none/
      .test(portrait.body),
    'between 801px and 1000px the labels must be hidden so the bar still fits');
});

test('phones (<= 800px) keep their existing treatment', () => {
  // The tablet rules must start above the phone breakpoint, so the phone block -
  // which hides labels and grows the buttons to 44px - is untouched.
  assert.ok(/min-width:\s*801px/.test(css.slice(tablet.start, tablet.start + 120)),
    'the tablet block must start at 801px, above the phone breakpoint');
  // Anchored on the #6419 comment: the same query text also opens a NESTED media
  // block earlier in the file, so matching the query string alone finds the wrong one.
  const anchor = css.indexOf('/* #6419: taller bar');
  assert.ok(anchor >= 0, 'the phone block must still be there');
  const phoneStart = css.lastIndexOf('@media', anchor);
  assert.ok(/max-width:\s*800px/.test(css.slice(phoneStart, anchor)),
    'the #6419 sizing must still live under the <= 800px phone query');
  const phone = css.slice(phoneStart, css.indexOf('#header-quick-access', anchor));
  assert.ok(/height:\s*44px/.test(phone),
    'the phone block must still give 44px touch targets');
  assert.ok(/i\.fa \+ span\s*\{\s*display:\s*none/.test(phone),
    'the phone block must still hide the labels');
});

test('the tablet rules come after the base rules they override', () => {
  // Same selectors, and a media query adds no specificity - source order decides.
  const baseAt = css.indexOf('#header #header-main-bar .board-header-btn {');
  assert.ok(baseAt >= 0 && baseAt < tablet.start,
    'the tablet overrides must appear after the base .board-header-btn rule');
  assert.ok(css.indexOf('@media print') > tablet.start,
    'the tablet block belongs with the screen rules, before @media print');
});

test('every button the bar shows is a .board-header-btn (so the rules reach it)', () => {
  // The selectors above are the only ones that shrink; a control added with a
  // different class would keep the old spacing and could re-wrap the bar.
  const bar = jade.slice(jade.indexOf('template(name="boardHeaderBar")'),
    jade.indexOf('template(name="boardVisibilityList")'));
  const anchors = bar.match(/^\s*a\.[a-z0-9-]+/gim) || [];
  for (const a of anchors) {
    assert.ok(/a\.board-header-btn/.test(a.trim()),
      `"${a.trim()}" is not a .board-header-btn - the tablet spacing will not apply`);
  }
  assert.ok(anchors.length >= BUTTON_COUNT,
    'the bar should still hold at least the buttons this fix was measured with');
});

// ── A long board title moves ALL the buttons to the second row ──────────────
// Reported on iPad landscape: with a long title, the left group (edit, visibility,
// watch, star, sort) stayed beside the title and only the right group wrapped, so
// the controls were split across both rows. The groups are now nested in ONE flex
// item, which as a single item either fits beside the title or moves down whole.

const bar = jade.slice(jade.indexOf('template(name="boardHeaderBar")'),
  jade.indexOf('template(name="boardVisibilityList")'));

test('all three button groups are inside one wrapper', () => {
  const wrapperAt = bar.indexOf('.board-header-btns-group');
  assert.ok(wrapperAt >= 0, 'the .board-header-btns-group wrapper must exist');
  const wrapperIndent = (() => {
    const line = bar.slice(0, wrapperAt).split('\n').pop();
    return line.length;
  })();
  for (const group of ['left', 'center', 'right']) {
    const at = bar.indexOf(`.board-header-btns.${group}`);
    assert.ok(at > wrapperAt,
      `.board-header-btns.${group} must come after the wrapper`);
    const indent = bar.slice(0, at).split('\n').pop().length;
    assert.ok(indent > wrapperIndent,
      `.board-header-btns.${group} must be nested INSIDE the wrapper (indent ` +
      `${indent} vs wrapper ${wrapperIndent}) - as a sibling it wraps on its own ` +
      'and splits the controls across both rows');
  }
});

test('the title is a sibling of the wrapper, not inside it', () => {
  const titleAt = bar.indexOf('h1.header-board-menu');
  const wrapperAt = bar.indexOf('.board-header-btns-group');
  assert.ok(titleAt >= 0 && titleAt < wrapperAt,
    'the board title must stay its own flex item, before the button wrapper');
  const titleIndent = bar.slice(0, titleAt).split('\n').pop().length;
  const wrapperIndent = bar.slice(0, wrapperAt).split('\n').pop().length;
  assert.strictEqual(titleIndent, wrapperIndent,
    'title and wrapper must be siblings so the flex row can break between them');
});

test('the wrapper is a flex item that can move down as a whole', () => {
  const rule = /#header #header-main-bar \.board-header-btns-group\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, '.board-header-btns-group must be styled in header.css');
  const body = rule[1];
  assert.ok(/display:\s*flex/.test(body), 'the wrapper must be a flex container');
  assert.ok(/flex-wrap:\s*wrap/.test(body),
    'its own groups must still be able to wrap when even the buttons alone do not fit');
  // flex-basis must stay content-based: with `flex: 1 1 0` the wrapper would
  // measure as zero-width and never move down, so the split would come back.
  const flex = /flex:\s*([^;]+);/.exec(body);
  assert.ok(flex, 'the wrapper must declare flex');
  assert.ok(/auto\s*$/.test(flex[1].trim()),
    `flex-basis must be auto (content width), got "${flex[1].trim()}" - a 0 basis ` +
    'would keep the buttons glued beside the title');
});

test('a title wider than the bar wraps instead of overflowing', () => {
  const rule = /#header #header-main-bar h1 \{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the h1 rule must exist');
  assert.ok(/min-width:\s*0/.test(rule[1]),
    'without min-width:0 a flex item cannot shrink below its min-content width');
  assert.ok(/max-width:\s*100%/.test(rule[1]), 'the title must not exceed the bar');
  assert.ok(/overflow-wrap:\s*(break-word|anywhere)/.test(rule[1]),
    'a single very long word in a title must break rather than overflow');
});

test('the HTML export still strips the whole button area', () => {
  const exportHTML = fs.readFileSync(
    path.join(root, 'client/lib/exportHTML.js'), 'utf8');
  assert.ok(/board-header-btns-group/.test(exportHTML),
    'exportHTML must remove the wrapper too, or the export keeps an empty div');
});

console.log(`\nboardHeaderOneLine: ${passed} tests passed`);
