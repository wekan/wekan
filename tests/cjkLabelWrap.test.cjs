'use strict';

// Plain-Node regression guard (no Meteor) for issue #4023: in Japanese and
// Chinese UI the add-card form footer wrapped labels mid-word ("追加" broke
// onto two lines inside the submit button, "リンク" rendered as リン / ク in
// the "or link / search / template" footer). CJK text has no spaces, so
// browsers may break between any two characters unless the footer opts into
// `word-break: keep-all` (and `white-space: nowrap` for the short labels).
// Run: node tests/cjkLabelWrap.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const formsCss = read('client/components/forms/forms.css');
const listBodyJade = read('client/components/lists/listBody.jade');

// Strip comments so assertions match real declarations only.
const css = formsCss.replace(/\/\*[\s\S]*?\*\//g, '');

// Split a stylesheet into { selector, body } rules (flat rules only; rules
// nested in at-rules keep their own selector text, which is fine here).
function rules(stylesheet) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stylesheet)) !== null) {
    out.push({ selector: m[1].trim(), body: m[2] });
  }
  return out;
}

function findRule(stylesheet, selectorPart, declaration) {
  return rules(stylesheet).some(
    r => r.selector.includes(selectorPart) && r.body.includes(declaration),
  );
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('add-card footer (.add-controls) forbids mid-word CJK breaks via word-break: keep-all', () => {
  assert.ok(
    findRule(css, '.add-controls', 'word-break: keep-all'),
    '.add-controls must declare word-break: keep-all',
  );
});

test('edit footer (.edit-controls) gets the same keep-all guard (same bug class)', () => {
  assert.ok(
    findRule(css, '.edit-controls', 'word-break: keep-all'),
    '.edit-controls must declare word-break: keep-all',
  );
});

test('the keep-all footer can still wrap BETWEEN links (flex-wrap: wrap)', () => {
  const flexWrapRule = rules(css).find(
    r =>
      r.selector.includes('.add-controls') &&
      r.body.includes('flex-wrap: wrap'),
  );
  assert.ok(flexWrapRule, '.add-controls must declare flex-wrap: wrap');
  assert.ok(
    findRule(css, '.add-controls', 'display: flex'),
    '.add-controls is a flex container, so flex-wrap is effective',
  );
});

test('submit button label ("追加") never splits onto two lines', () => {
  assert.ok(
    findRule(css, '.add-controls button[type=submit]', 'white-space: nowrap'),
    'submit button in .add-controls must declare white-space: nowrap',
  );
});

test('footer link groups ("or リンク", "/ 検索", "/ テンプレート") stay on one line each', () => {
  assert.ok(
    findRule(css, '.add-controls .quiet', 'white-space: nowrap'),
    '.add-controls .quiet must declare white-space: nowrap',
  );
});

test('the footer markup this pins still exists (link/search/template in a .quiet span)', () => {
  assert.ok(/span\.quiet\s*\n\s*\|\s*\{\{_ 'or'\}\}\s*\n\s*a\.js-link/.test(listBodyJade),
    'addCardForm footer: span.quiet wrapping the "or" + js-link anchor');
  assert.ok(/a\.js-search \{\{_ 'search'\}\}/.test(listBodyJade));
  assert.ok(/a\.js-card-template \{\{_ 'template'\}\}/.test(listBodyJade));
  assert.ok(/button\.primary\.confirm\(type="submit"\) \{\{_ 'add'\}\}/.test(listBodyJade));
});

test('negative: no global keep-all/nowrap that would change Latin or long-URL wrapping', () => {
  const globalish = rules(css).filter(r =>
    /(?:^|,)\s*(?:\*|html|body)\s*(?:,|$)/.test(r.selector),
  );
  for (const r of globalish) {
    assert.ok(
      !r.body.includes('word-break'),
      `global selector "${r.selector}" must not set word-break`,
    );
    assert.ok(
      !r.body.includes('white-space: nowrap'),
      `global selector "${r.selector}" must not set white-space: nowrap`,
    );
  }
});

test('negative: keep-all is scoped to the footers, not sprayed across the stylesheet', () => {
  const keepAllRules = rules(css).filter(r => r.body.includes('keep-all'));
  assert.ok(keepAllRules.length >= 1, 'at least one keep-all rule exists');
  for (const r of keepAllRules) {
    assert.ok(
      r.selector.split(',').every(s => /\.(add|edit)-controls/.test(s)),
      `keep-all rule "${r.selector}" must only target .add-controls / .edit-controls`,
    );
  }
});

test('negative: fix does not use word-break: break-all (which would break Latin words)', () => {
  const addControlRules = rules(css).filter(r =>
    r.selector.includes('.add-controls'),
  );
  for (const r of addControlRules) {
    assert.ok(
      !r.body.includes('break-all'),
      `"${r.selector}" must not use word-break: break-all`,
    );
  }
});

console.log(`\n${passed} tests passed`);
