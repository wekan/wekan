'use strict';

// Guard: a checkbox is square, wherever it is put and whatever is beside it.
// Run: node tests/checkboxesAreSquare.test.cjs
//
// WeKan's checkbox is `.materialCheckBox` (client/components/forms/forms.css) -
// a 13px square that becomes a rotated tick when it carries `is-checked`. There
// are 90 of them across 19 templates, and this suite is about the one property
// that has now been broken THREE times in three different ways:
//
//   1. In the export popup, the row is a flex container and the box is a flex
//      item, so a long label SHRANK it: "Kortin tiedot (jokainen kortti kuten
//      kortin viennissä)" drew a thin vertical sliver while "Taulu" beside it
//      stayed square.
//   2. In Admin Panel, `.setting-content input[type="checkbox"]` inherited a
//      41px min-height from the form styles, which - as the comment in
//      settingBody.css says - "turns a 13px box into a tall rectangle, and
//      stretches the tick it becomes".
//   3. In the setting rows, `height: 100%` stretched the box away from its
//      words.
//
// Each was fixed where it was found. The fix that stops the fourth is in the
// rule that DEFINES the checkbox - `flex: none`, so no flex container anywhere
// can squeeze one - and this suite pins that, plus the invariant itself: every
// rule that sizes a checkbox gives it equal width and height.
//
// The CHECKED state is deliberately not square: forms.css turns the box into a
// 7x15 rotated tick. That is the mark, not the box, and it is skipped here.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('checkboxesAreSquare:');

// Every CSS rule in the client that targets a .materialCheckBox.
function checkboxRules() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) {
        const src = fs.readFileSync(full, 'utf8');
        for (const m of src.matchAll(/([^{}]*\.materialCheckBox[^{}]*)\{([^}]*)\}/g)) {
          out.push({
            file: path.relative(ROOT, full),
            line: src.slice(0, m.index).split('\n').length,
            selector: m[1].trim().split('\n').pop().trim(),
            body: m[2],
          });
        }
      }
    }
  };
  walk(path.join(ROOT, 'client'));
  return out;
}

const value = (body, prop) => {
  const m = new RegExp(`(?:^|;|\\s)${prop}:\\s*([^;]+)`).exec(body);
  return m ? m[1].trim() : null;
};

test('the checkbox is defined square, and cannot be shrunk', () => {
  const forms = read('client/components/forms/forms.css');
  const rule = /\n\.materialCheckBox \{([\s\S]*?)\n\}/.exec(forms);
  assert.ok(rule, 'forms.css must define .materialCheckBox');
  assert.strictEqual(value(rule[1], 'width'), '13px');
  assert.strictEqual(value(rule[1], 'height'), '13px');
  // The one that stops it happening again anywhere: a flex item shrinks by
  // default, and several of the rows that carry a checkbox are flex rows.
  assert.ok(/flex:\s*none/.test(rule[1]),
    'it must be `flex: none`, or a long label beside it squeezes it to a sliver');
});

test('and every rule that resizes one keeps it square', () => {
  const wrong = [];
  for (const rule of checkboxRules()) {
    if (rule.selector.includes('is-checked')) continue;      // the tick, not the box
    // The BOX must be the subject of the rule. `.checkbox-row a.flex` mentions
    // a checkbox in its comment and sizes the ROW around it, which is a
    // different thing and legitimately not square.
    if (!/\.materialCheckBox(\s*[,:]|\s*$)/.test(rule.selector)) continue;
    const w = value(rule.body, 'width');
    const h = value(rule.body, 'height');
    if (!w && !h) continue;
    if (!w || !h || w !== h) {
      wrong.push(`${rule.file}:${rule.line} ${rule.selector} -> ${w || '(unset)'} x ${h || '(unset)'}`);
    }
  }
  assert.deepStrictEqual(wrong, [],
    'these give a checkbox a different width and height:\n  ' + wrong.join('\n  '));
});

test('a theme may resize a checkbox, but not reshape it', () => {
  // The two "clean" board themes draw bigger checkboxes - 24px in the card
  // details and 18px on a minicard. That is a theme's business; being SQUARE is
  // not, which is what the rule above enforces for them too. Named here so the
  // difference is a decision on the page rather than a surprise.
  const themed = checkboxRules()
    .filter(r => r.file.endsWith('boardColors.css') && !r.selector.includes('is-checked'))
    .filter(r => value(r.body, 'width'));
  assert.ok(themed.length >= 2, 'the clean themes size their own checkboxes');
  for (const rule of themed) {
    assert.strictEqual(value(rule.body, 'width'), value(rule.body, 'height'),
      `${rule.file}:${rule.line} must stay square`);
  }
});

test('the export popup adds only alignment, not a second size (negative)', () => {
  // Its earlier fix set `box-sizing: border-box` here, which would have made
  // these boxes 13px INCLUDING their border while every other checkbox in WeKan
  // is 13px plus 2px - a fix for one page that made it the odd one out. Box
  // sizing is not global in this app, so a local one is a difference.
  const css = read('client/components/main/popup.css');
  const rule = /\.export-scope-select a > \.materialCheckBox \{([\s\S]*?)\}/.exec(css);
  assert.ok(rule, 'the export row rule must exist');
  for (const prop of ['width', 'height', 'box-sizing', 'padding', 'border']) {
    assert.strictEqual(value(rule[1], prop), null,
      `it must not set ${prop} - that belongs to forms.css, for all 90 of them`);
  }
});

console.log(`\ncheckboxesAreSquare: ${passed} tests passed`);
