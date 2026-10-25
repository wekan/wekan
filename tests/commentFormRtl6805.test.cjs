'use strict';

// #6805: on a right-to-left page (Persian in the report) the avatar of the
// comment form stood outside the card. The avatar is placed at the reading
// start (inset-inline-start: -38px) and the form keeps 38px free for it - but
// that room was a physical LEFT margin, so in right-to-left the avatar went to
// the right, where nothing was free. Every side of the comments' layout is a
// logical one now, and mirrors with the page.
// Run: node tests/commentFormRtl6805.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'client/components/activities/comments.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const rule = sel => {
  const at = css.indexOf(`${sel} {`);
  assert.notStrictEqual(at, -1, sel);
  return css.slice(at, css.indexOf('}', at));
};

// The room and the avatar are on the same logical side, the same size.
const form = rule('.new-comment');
const avatar = rule('.new-comment .member');
assert.match(form, /margin-inline: 38px 0;/);
assert.match(avatar, /inset-inline-start: -38px;/);
console.log('  ok - the avatar is drawn in the room kept for it, at the reading start');

// Negative: no physical side anywhere in the comments' layout - a margin or
// padding shorthand of four values with different left and right, or a
// left/right property, does not mirror.
const offenders = [];
css.split('\n').forEach((line, i) => {
  const four = line.match(/^\s*(margin|padding):\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);/);
  if (four && four[3] !== four[5]) offenders.push(`${i + 1}: ${line.trim()}`);
  if (/^\s*(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/.test(line)) offenders.push(`${i + 1}: ${line.trim()}`);
});
assert.deepStrictEqual(offenders, []);
console.log('  ok - nothing in comments.css is fixed to the left or the right');
console.log('commentFormRtl6805: 2 passed');
