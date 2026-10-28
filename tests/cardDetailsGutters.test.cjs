const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jade = fs.readFileSync(path.join(root,
  'client/components/cards/cardDetails.jade'), 'utf8');
const css = fs.readFileSync(path.join(root,
  'client/components/cards/cardDetails.css'), 'utf8');

// #6638: the canvas is the wrapper that owns the entire card body. A standalone
// empty `.card-details-canvas` leaves every real child beside it, so its padding
// can look correct in computed-style tests while no visible content gets it.
assert.match(jade,
  /aria-label="\{\{_ 'card'\}\}: \{\{title\}\}"\): \.card-details-canvas\n\s{4}\/\/- The whole header row/);
assert.doesNotMatch(jade, /^\s{4}\.card-details-canvas\s*$/m);
assert.match(jade,
  /\): \.card-details-canvas\n[\s\S]*?^\s{4}\.card-details-header/m);
// The left column is at the header's level, inside the canvas. Deliberate
// change (2026-10-28): it was one level deeper, under the `else` of Card
// Settings being open on the card; the opened card has no Card Settings any
// more (docs/Features/Cards/Card-Settings.md), so it is not wrapped.
assert.match(jade,
  /\): \.card-details-canvas\n[\s\S]*?^\s{4}\.card-details-left\n[\s\S]*?^\s{6}\.card-details-items/m);
assert.doesNotMatch(jade, /^\s{4}else\n\s{6}\.card-details-left/m, 'negative: no Card Settings else around it');

// The wrapper contract includes a real, symmetric gutter and border-box sizing
// so a widened card still fits those gutters inside its declared width.
assert.match(css,
  /\.card-details \.card-details-canvas \{[\s\S]*?box-sizing: border-box;[\s\S]*?min-width: 0;[\s\S]*?padding: 0 20px;/);

console.log('cardDetailsGutters: 5 tests passed');
