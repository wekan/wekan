'use strict';

// A dependency's card title is readable, not cut off at the pane's edge.
// Run: node tests/cardDependencyWrap.test.cjs
//
// In an opened card's Dependencies section each row is `icon | title | controls`
// in a flex row, and the title was `white-space: nowrap` with an ellipsis. The
// card details pane is narrow and a card title is a sentence, so everything past
// the pane's width - which is most of a real title, starting right of the
// coloured icon - could not be read at all.
//
// The fix is two properties, and the second is the one that is easy to miss:
// `white-space: normal` alone would not have helped, because a flex item's
// default `min-width: auto` refuses to shrink below its content. The item has
// to be allowed to be narrower than its text before the text can wrap inside
// it, which is `min-width: 0`.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(
  path.join(ROOT, 'client/components/boards/dependencyOverlay.css'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function rule(selector) {
  const i = css.indexOf(`${selector} {`);
  assert.ok(i !== -1, `missing rule: ${selector}`);
  return css.slice(i, css.indexOf('}', i));
}

console.log('cardDependencyWrap:');

const link = rule('.card-details-dependencies-list .card-dependency-link');
const row = rule('.card-details-dependencies-list .card-dependency');

test('the title wraps instead of being cut off', () => {
  assert.ok(/white-space:\s*normal/.test(link), 'it is allowed to be more than one line');
  assert.ok(!/text-overflow:\s*ellipsis/.test(link), 'and is not truncated with an ellipsis');
  assert.ok(!/white-space:\s*nowrap/.test(link), 'nor held on one line');
});

test('min-width: 0, without which none of that works (negative)', () => {
  // The flexbox trap: `min-width: auto` is the default on a flex item, so the
  // item never shrinks below its content and the text overflows the row rather
  // than wrapping in it.
  assert.ok(/min-width:\s*0/.test(link),
    'the item may be narrower than its text, which is what lets the text wrap');
  assert.ok(/flex:\s*1 1 auto/.test(link), 'while still taking the free space');
});

test('a title with no spaces in it still wraps', () => {
  // A card titled with a URL or a long id is one word; without this it would
  // push the type, colour and remove controls off the row.
  assert.ok(/overflow-wrap:\s*anywhere/.test(link), 'a long token breaks inside itself');
});

test('the icon and controls sit beside the first line', () => {
  // With a wrapping title the row is tall, and centring would float the icon
  // halfway down the block.
  assert.ok(/align-items:\s*flex-start/.test(row), 'aligned to the top of the row');
  assert.ok(!/align-items:\s*center/.test(row), 'not to its middle');
});

test('the row still lays the three parts out in a line (negative)', () => {
  // The fix is about the text, not about the shape of the row.
  assert.ok(/display:\s*flex/.test(row), 'still a flex row');
  assert.ok(/gap:\s*6px/.test(row), 'with the same spacing');
  const select = rule('.card-details-dependencies-list .js-dependency-type');
  assert.ok(/flex:\s*0 0 auto/.test(select), 'and the controls still do not stretch');
});

console.log(`\ncardDependencyWrap: ${passed} tests passed`);
