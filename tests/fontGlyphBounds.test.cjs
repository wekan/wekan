'use strict';

// Firefox logged one warning per glyph, on every page load, for every Font
// Awesome file WeKan serves:
//
//   downloadable font: glyf: Glyph bbox was incorrect; adjusting (glyph 19)
//   (font-family: "Font Awesome 6 Free" style:normal weight:400 stretch:100
//   src index:0) source: .../webfonts/fa-regular-400.woff2
//
// Run: node tests/fontGlyphBounds.test.cjs
//
// 819 of the 2163 glyphs in the four files were affected, so the console filled
// with hundreds of lines and stopped being useful for spotting anything else.
//
// Every TrueType glyph stores its own bounding box in the `glyf` table. Font
// Awesome shipped boxes that were TIGHTER than the outline: they bounded the
// on-curve points only, while the box has to bound the control points too,
// because a quadratic curve can bulge past its endpoints. Firefox's OpenType
// sanitiser noticed, corrected each box in memory and said so. Nothing rendered
// wrongly - the warning was the whole of the damage - but the numbers in the
// file were wrong, and they were wrong upstream, in Font Awesome's own build.
//
// releases/fix-font-bboxes.py recomputes them. This is the guard that keeps them
// recomputed: the fonts are VENDORED, so the next Font Awesome upgrade drops
// fresh upstream files straight back into the tree, and without something
// checking, the warnings would return silently and nobody would connect them to
// a font upgrade months later.
//
// It parses the .ttf files here rather than trusting fontTools, so the check is
// independent of the tool that wrote them - and it reads the `.ttf` because the
// `.woff2` is brotli-compressed and cannot be parsed without a dependency. That
// is sound only because the script writes BOTH from one corrected font, which is
// pinned below.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const webfonts = path.join(
  repoRoot, 'packages/wekan-fontawesome/fontawesome-free/webfonts');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A minimal TrueType reader: table directory -> head/maxp/loca/glyf, then each
// simple glyph's stated box against the box its own points describe.
function wrongBoxes(file) {
  const d = fs.readFileSync(file);
  const numTables = d.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i += 1) {
    const o = 12 + 16 * i;
    tables[d.toString('latin1', o, o + 4)] = d.readUInt32BE(o + 8);
  }
  for (const t of ['head', 'maxp', 'loca', 'glyf']) {
    assert.ok(tables[t] !== undefined, `${path.basename(file)}: no ${t} table`);
  }

  const indexToLocFormat = d.readInt16BE(tables.head + 50);
  const numGlyphs = d.readUInt16BE(tables.maxp + 4);
  const loca = [];
  for (let i = 0; i <= numGlyphs; i += 1) {
    loca.push(indexToLocFormat === 0
      ? 2 * d.readUInt16BE(tables.loca + 2 * i)
      : d.readUInt32BE(tables.loca + 4 * i));
  }

  const wrong = [];
  let simple = 0;
  for (let gid = 0; gid < numGlyphs; gid += 1) {
    if (loca[gid] === loca[gid + 1]) continue;          // empty glyph, no box
    let p = tables.glyf + loca[gid];
    const numberOfContours = d.readInt16BE(p);
    if (numberOfContours < 0) continue;                 // composite: bounds come
    simple += 1;                                        // from its components
    const stated = [d.readInt16BE(p + 2), d.readInt16BE(p + 4),
      d.readInt16BE(p + 6), d.readInt16BE(p + 8)];
    p += 10;

    const endPts = [];
    for (let i = 0; i < numberOfContours; i += 1) { endPts.push(d.readUInt16BE(p)); p += 2; }
    const numPoints = numberOfContours ? endPts[endPts.length - 1] + 1 : 0;
    p += 2 + d.readUInt16BE(p);                         // skip the instructions

    const flags = [];
    while (flags.length < numPoints) {
      const f = d[p]; p += 1;
      flags.push(f);
      if (f & 8) { let r = d[p]; p += 1; while (r--) flags.push(f); }
    }

    // x then y, each as deltas: short with a sign bit, or "same as previous".
    const read = (shortBit, sameBit) => {
      const out = []; let v = 0;
      for (const f of flags) {
        if (f & shortBit) { const dv = d[p]; p += 1; v += (f & sameBit) ? dv : -dv; }
        else if (!(f & sameBit)) { v += d.readInt16BE(p); p += 2; }
        out.push(v);
      }
      return out;
    };
    const xs = read(2, 16);
    const ys = read(4, 32);
    if (!xs.length) continue;

    const actual = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    if (stated.join() !== actual.join()) wrong.push({ gid, stated, actual });
  }
  return { simple, wrong };
}

const FONTS = ['fa-brands-400', 'fa-regular-400', 'fa-solid-900', 'fa-v4compatibility'];

console.log('fontGlyphBounds:');

test('every glyph states the box its own points describe', () => {
  let checked = 0;
  for (const stem of FONTS) {
    const file = path.join(webfonts, `${stem}.ttf`);
    const { simple, wrong } = wrongBoxes(file);
    checked += simple;
    assert.ok(simple > 0, `${stem}: no simple glyphs parsed - the reader is broken`);
    const shown = wrong.slice(0, 3)
      .map(w => `glyph ${w.gid} states ${w.stated} but its points are ${w.actual}`);
    assert.deepStrictEqual(shown, [],
      `${stem}.ttf: ${wrong.length} of ${simple} glyphs state a wrong bounding box. ` +
      `Firefox logs one console warning per glyph per page load for these. ` +
      `Upstream Font Awesome ships them wrong, so a font upgrade brings them back: ` +
      `re-run  python3 releases/fix-font-bboxes.py`);
  }
  // If a Font Awesome upgrade ever shipped a subset, this would quietly check
  // almost nothing.
  assert.ok(checked > 2000,
    `only ${checked} glyphs checked across ${FONTS.length} fonts; expected 2000+`);
});

test('the .woff2 the browser loads is written beside the .ttf that was checked', () => {
  // The check above reads the .ttf, but a browser loads the .woff2 - and the
  // warnings named the .woff2. That is only sound because one corrected font is
  // saved to both, so they cannot disagree. If the script ever stops doing that,
  // this guard would be checking a file nobody downloads.
  const script = fs.readFileSync(path.join(repoRoot, 'releases/fix-font-bboxes.py'), 'utf8');
  assert.ok(/font\.flavor = None\s*\n\s*font\.save\(ttf\)/.test(script),
    'the .ttf must be written from the corrected font');
  assert.ok(/font\.flavor = 'woff2'\s*\n\s*font\.save\(woff2\)/.test(script),
    'and the .woff2 from that same font, not from a separate pass');
  for (const stem of FONTS) {
    assert.ok(fs.existsSync(path.join(webfonts, `${stem}.woff2`)),
      `${stem}.woff2 is what the browser actually downloads`);
  }
});

test('the fix is written down where the fonts are, not only in this test', () => {
  const script = fs.readFileSync(path.join(repoRoot, 'releases/fix-font-bboxes.py'), 'utf8');
  assert.ok(/--check/.test(script), 'it can report without writing');
  assert.ok(/Glyph bbox was incorrect/.test(script),
    'quoting the browser warning is what makes it findable when it recurs');
});

console.log(`\n${passed} tests passed`);
