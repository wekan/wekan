'use strict';

// Mobile mode: the board fits the width exactly, and every title sits on the vertical
// centre of its row.
//
// Reported: the lists area was slightly too wide - a horizontal scrollbar with a small
// amount to scroll right and nothing there to see - and the swimlane title, the list
// title and the board title all sat too high on their rows.
//
// Two separate causes for the width:
//
//   1. `100vw` again. It was fixed in boardHeader.css, but boardBody.css (18) and
//      list.css (32) had the same thing, including `.mini-list.mobile-view` - the very
//      rows a phone shows. 100vw is the viewport width INCLUDING the vertical
//      scrollbar, so each of those was a scrollbar wider than the box it sat in. These
//      only started showing when an explicit mobile-mode toggle began driving
//      isMiniScreen, which is what applies the `.mobile-view` class on a desktop.
//   2. box-sizing. `* { box-sizing: unset }` (layouts.css) makes content-box the
//      default, so a rule setting `width: 100%` AND `padding: 1rem` - the swimlane
//      header, the list header, the list body and the minicard all do - comes out 32px
//      wider than its parent, at four nesting levels.
//
// `100vw` is still right for a position:fixed OVERLAY (the mobile card details, a
// popover, the sidebar, the notifications drawer): those are sized to the viewport by
// definition and are not in the flow of a scrolling container.
//
// Run: node tests/mobileBoardFit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '');

const boardHeader = read('client/components/boards/boardHeader.css');
const boardBody = read('client/components/boards/boardBody.css');
const listCss = read('client/components/lists/list.css');
const headerCss = read('client/components/main/header.css');

function rule(css, selector) {
  const at = css.indexOf(selector + ' {');
  assert.ok(at > -1, `${selector} must be styled`);
  return css.slice(at + selector.length, css.indexOf('}', at));
}

console.log('mobileBoardFit:');

test('the board and its lists are sized in %, not viewport width', () => {
  for (const [name, css] of [['boardBody.css', boardBody], ['list.css', listCss]]) {
    assert.ok(!/100vw/.test(noComments(css)),
      `${name} must not size in-flow board elements with 100vw`);
  }
  // ...and they are still full width, measured against their parent.
  assert.ok(/width:\s*100%/.test(rule(listCss, '.mini-list.mobile-view')),
    'the mobile list rows are still full width');
});

test('a fixed overlay may still be a viewport wide (negative)', () => {
  // Sized to the viewport by definition, and not in the flow of a scroller.
  const overlays = [
    ['client/components/cards/cardDetails.css', 'body.mobile-mode .card-details'],
    ['client/components/sidebar/sidebar.css', '.board-sidebar.sidebar'],
  ];
  for (const [file, selector] of overlays) {
    const css = read(file);
    // A selector can be styled in several blocks (media queries, mobile overrides), so
    // gather them all rather than trusting the first one to hold everything.
    const blocks = [];
    for (let at = css.indexOf(selector + ' {'); at > -1;
      at = css.indexOf(selector + ' {', at + 1)) {
      blocks.push(css.slice(at, css.indexOf('}', at)));
    }
    assert.ok(blocks.length, `${selector} must be styled`);
    const all = blocks.join('\n');
    assert.ok(/100vw/.test(all), `${selector} legitimately spans the viewport`);
    assert.ok(/position:\s*fixed/.test(all),
      `${selector} must be position:fixed for that to be correct`);
  }
});

test('full-width mobile boxes measure their padding inside', () => {
  // Otherwise width:100% + padding:1rem is 32px wider than the parent.
  const at = boardHeader.indexOf('box-sizing: border-box !important');
  assert.ok(at > -1, 'the mobile board boxes need border-box');
  const selectors = boardHeader.slice(boardHeader.lastIndexOf('*/', at) + 2, at);
  for (const sel of ['.mobile-mode .list-header', '.mobile-mode .list-body',
    '.mobile-mode .swimlane-header', '.mobile-mode .minicard', '.mobile-mode .list']) {
    assert.ok(selectors.includes(sel), `${sel} sets width:100% and padding, so it needs border-box`);
  }
});

test('the swimlane title is centred on its row', () => {
  const header = rule(boardHeader, '.mobile-mode .swimlane-header');
  assert.ok(/display:\s*flex/.test(header),
    'as a block the title sat at the top of the band');
  assert.ok(/align-items:\s*center/.test(header), 'centred vertically');
  const wrap = rule(boardHeader, '.mobile-mode .swimlane-header-wrap');
  assert.ok(/align-items:\s*center/.test(wrap),
    'so the title and the icons beside it share one centre line');
});

test('the list title is centred on its row', () => {
  // It used to be pinned to the BOTTOM of grid row 1, with the card count pinned to
  // the TOP of row 2, so the pair hugged the middle. With no card count row 2 is
  // empty and the title sat in the upper half.
  const name = rule(boardHeader, '.mobile-mode .list-header .list-header-name');
  assert.ok(/align-self:\s*center/.test(name), 'the title centres in its row');
  assert.ok(!/align-self:\s*end/.test(name), 'not pinned to the bottom of row 1');
  const count = rule(boardHeader, '.mobile-mode .list-header .cardCount');
  assert.ok(/align-self:\s*center/.test(count), 'and so does the card count');
});

test('both top bars centre their contents vertically', () => {
  const quick = rule(headerCss, '.mobile-mode #header-quick-access');
  // A fixed 28px CONTENT box that ~44px touch targets overflowed, then clipped by
  // overflow:hidden - which is what made them read as sitting high.
  assert.ok(/height:\s*auto/.test(quick), 'the bar takes its content height');
  assert.ok(/min-height:\s*\d+px/.test(quick), 'with a floor so it keeps its size');
  assert.ok(/align-items:\s*center/.test(quick), 'and centres them');
  assert.ok(/padding-block:\s*\d+px/.test(quick),
    'symmetric block padding, or centring is measured off a lopsided box');
  const main = rule(headerCss, '.mobile-mode #header #header-main-bar');
  assert.ok(/align-items:\s*center/.test(main), 'the board bar centres too');
  assert.ok(/padding-block:\s*\d+px/.test(main), 'with symmetric padding');
});

test('the board title itself is centred, not just its box', () => {
  const h1 = rule(headerCss, '.mobile-mode #header #header-main-bar h1');
  assert.ok(/align-items:\s*center/.test(h1), 'the title centres its own text');
  assert.ok(/line-height:\s*1\.3/.test(h1),
    'a tall line box would leave the text high inside a centred element');
});

test('no band of grey follows the swimlane resize bar', () => {
  // The bar is pinned to the bottom edge of the lists container, so a margin AFTER
  // that container is a fixed band of grey sitting under the bar - and it travels with
  // the bar as the swimlane is resized, which is exactly how it was described.
  const handle = rule(read('client/components/swimlanes/swimlanes.css'),
    '.swimlane-resize-handle');
  assert.ok(/bottom:\s*0/.test(handle), 'the bar is pinned to the bottom edge');
  const all = rule(boardHeader, '.mobile-mode .swimlane');
  assert.ok(/margin-bottom:\s*0 !important/.test(all),
    'no margin after a swimlane - its header bar separates it from the next');
  assert.ok(!/margin-bottom:\s*2rem/.test(all), 'the old 2rem band must be gone');
});

test('NO mobile rule leaves a bottom margin on a swimlane, header or list', () => {
  // boardHeader.css restates the same selectors in several later blocks - the mobile
  // overrides, a media query, a "force mobile mode" block. Later rules of equal
  // specificity WIN, so zeroing the margin in the first block only looks fixed: the
  // duplicates put the band straight back. This checks every block, not the first one.
  const offenders = [];
  const src = boardHeader.replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
  const targets = /\.mobile-mode [^{}]*\.(swimlane|swimlane-header|list)\b[^{}]*\{/;
  for (const block of src.split('}')) {
    const head = block.slice(block.lastIndexOf('\n', block.indexOf('{')) + 1);
    if (!targets.test(head + '{')) continue;
    const body = block.slice(block.indexOf('{') + 1);
    // A non-zero bottom margin, written either way round.
    const m = /margin-bottom:\s*(?!0)([\w.]+)/.exec(body)
      || /margin:\s*[\w.]+\s+[\w.]+\s+(?!0)([\w.]+)/.exec(body);
    if (m) offenders.push(`${head.trim()} -> ${m[0]}`);
  }
  assert.deepStrictEqual(offenders, [],
    'these put a fixed band of grey below a swimlane, header or list:\n  '
    + offenders.join('\n  '));
});

test('the resize bar still resizes', () => {
  // The height being dragged is an INLINE style. Overriding it with
  // `height: auto !important` would make the bar do nothing at all, so the container
  // keeps the height it was given; only the floor under it is removed, which is what
  // held a short swimlane open below the chosen height.
  const lists = rule(boardHeader, '.mobile-mode .swimlane.js-lists');
  assert.ok(/min-height:\s*0 !important/.test(lists), 'no minimum holding it open');
  assert.ok(!/height:\s*auto/.test(lists.replace(/min-height:[^;]*;/g, '')),
    'the dragged height must not be overridden, or resizing does nothing');
  const base = read('client/components/swimlanes/swimlanes.css');
  assert.ok(/\.swimlane\.js-lists\.js-swimlane \{[^}]*min-height:\s*150px/.test(base),
    'the 150px floor this overrides must still be the desktop behaviour');
  const jade = read('client/components/swimlanes/swimlanes.jade');
  assert.ok(/style="height:\{\{swimlaneHeight\}\};"/.test(jade),
    'and the inline height it must not fight is really there');
});

test('the swimlane header wrapper is only as tall as its bar', () => {
  // It is a `.swimlane` too, so it picks up that element's sizing; anything left over
  // renders as the lighter grey of .swimlane around the darker header bar.
  const headerWrap = rule(boardHeader, '.mobile-mode .swimlane.nodragscroll');
  assert.ok(/height:\s*auto !important/.test(headerWrap), 'it hugs its content');
  assert.ok(/min-height:\s*0 !important/.test(headerWrap), 'with no floor');
  assert.ok(/padding:\s*0 !important/.test(headerWrap), 'and no padding around the bar');
  // .nodragscroll is what the header-only swimlane element carries.
  const jade = read('client/components/swimlanes/swimlanes.jade');
  assert.ok(/\.swimlane\.nodragscroll\n\s*\+swimlaneHeader/.test(jade),
    'the header wrapper is the .nodragscroll one');
});

console.log(`\nmobileBoardFit: ${passed} tests passed`);
