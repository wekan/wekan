/**
 * Test: minicard label compact height (#6424).
 *
 * Lightweight, dependency-free CSS regression guard (Node `assert`, runnable via
 * `node tests/minicardLabelHeight.test.cjs`). Locks in the fix for #6424, where
 * text labels on minicards rendered at ~double height because each label name is
 * rendered inside a `.viewer`, and the GLOBAL rule `.viewer { min-height: 2.5vh }`
 * (intended for the full content editor) forced every minicard label tall.
 *
 * The fix (client/components/cards/minicard.css) scopes overrides to the minicard
 * text labels so they stay on a single compact line:
 *   - reset the inner `.viewer` (and its `<p>`) min-height to 0 and render inline,
 *   - keep the `.card-label` itself compact (min-height:0, nowrap).
 *
 * This test fails if those overrides are removed/renamed, which would let the
 * global 2.5vh min-height regress the label height again.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

// Collapse whitespace so we can match rule bodies regardless of formatting.
const squish = s => s.replace(/\s+/g, ' ');

const minicardCss = squish(read('client/components/cards/minicard.css'));
const layoutsCss = squish(read('client/components/main/layouts.css'));

// --- Positive: the override rules that keep minicard labels compact exist -----

// 1) The inner viewer's min-height is reset to 0 (and rendered inline) for
//    minicard labels.
const viewerRule =
  /\.minicard \.minicard-labels \.card-label \.viewer\s*\{([^}]*)\}/.exec(minicardCss);
assert.ok(
  viewerRule,
  '#6424: missing `.minicard .minicard-labels .card-label .viewer` override rule',
);
assert.match(
  viewerRule[1],
  /min-height:\s*0/,
  '#6424: minicard label `.viewer` must reset min-height to 0',
);
assert.match(
  viewerRule[1],
  /display:\s*inline/,
  '#6424: minicard label `.viewer` should render inline so the label stays one line',
);

// 2) The label box itself stays compact / single line.
const labelRule =
  /\.minicard \.minicard-labels \.card-label\s*\{([^}]*)\}/.exec(minicardCss);
assert.ok(
  labelRule,
  '#6424: missing `.minicard .minicard-labels .card-label` compact rule',
);
assert.match(
  labelRule[1],
  /min-height:\s*0/,
  '#6424: minicard `.card-label` must reset min-height to 0',
);
assert.match(
  labelRule[1],
  /white-space:\s*nowrap/,
  '#6424: minicard `.card-label` should keep the label on a single line',
);

// --- Negative / context: the global rule the fix works around still exists ----
// This documents WHY the scoped override is needed; if the global min-height is
// ever removed the override is harmless, but this assertion makes the dependency
// explicit so the two are not accidentally decoupled without thought.
assert.match(
  layoutsCss,
  /\.viewer\s*\{[^}]*min-height:\s*2\.5vh/,
  '#6424: expected the global `.viewer { min-height: 2.5vh }` (the rule the minicard override compensates for)',
);

console.log('minicardLabelHeight.test.cjs: all assertions passed');
