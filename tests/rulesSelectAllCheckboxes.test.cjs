'use strict';

// #6749: Rules -> "Select all" / "Unselect all" appeared to do nothing.
// Run: node tests/rulesSelectAllCheckboxes.test.cjs
//
// The handlers were never the problem: they set Session 'selectedRuleIds' and
// each row's `checked=isSelected` followed it. The checkboxes those buttons
// change were INVISIBLE - client/components/forms/forms.css hides every native
// checkbox app-wide (display: none, visibility: hidden, position: absolute and
// a -9999px offset, because WeKan draws its own .materialCheckBox), and the
// rules list uses native ones with nothing undoing that. So the state changed
// and nothing on screen did; a rule could not be ticked by hand for "Delete
// selected" / "Export selected" either.
//
// This suite pins:
//   - the select-all / unselect-all / single-toggle logic, run for real with
//     several rules on the board (the reported case);
//   - that the rules list checkbox overrides every part of the hiding rule, with
//     a selector that outranks `[type="checkbox"]:checked`;
//   - and, as the negative test, that NO native checkbox anywhere under
//     client/components/rules is left hidden by that rule.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('rulesSelectAllCheckboxes:');

// ---------------------------------------------------------------- the logic

function loadRulesList(rulesOnBoards) {
  const session = new Map();
  const captured = {};
  const sandbox = {
    Session: {
      get: key => (session.has(key) ? JSON.parse(session.get(key)) : undefined),
      set: (key, value) => session.set(key, JSON.stringify(value)),
    },
    ReactiveCache: {
      getRules: ({ boardId }) => rulesOnBoards.filter(r => r.boardId === boardId),
      getRule: id => rulesOnBoards.find(r => r._id === id),
      getCurrentUser: () => ({ isAdmin: true }),
    },
    Rules: { update() {} },
    isSubmitKey: () => false,
    ReactiveVar: function ReactiveVar() {},
    Meteor: { call() {} },
    Popup: { open: () => () => {} },
    Template: {
      rulesList: {
        onCreated() {},
        helpers(h) { captured.helpers = h; },
        events(e) { captured.events = e; },
      },
    },
  };
  const source = read('client/components/rules/rulesList.js')
    .replace(/^import .*;$/gm, '');
  vm.runInNewContext(source, sandbox, { filename: 'rulesList.js' });
  return { ...captured, session: sandbox.Session };
}

const RULES = [
  { _id: 'r1', boardId: 'b1', title: 'One' },
  { _id: 'r2', boardId: 'b1', title: 'Two' },
  { _id: 'r3', boardId: 'b1', title: 'Three' },
  { _id: 'other', boardId: 'b2', title: 'Other board' },
];

function checkedIds(list) {
  return RULES.filter(r => r.boardId === 'b1')
    .filter(r => list.helpers.isSelected.call(r))
    .map(r => r._id);
}

test('Select all ticks every rule of a board with several rules', () => {
  const list = loadRulesList(RULES);
  list.session.set('currentBoard', 'b1');
  assert.deepStrictEqual(checkedIds(list), []);
  list.events['click .js-rules-select-all']();
  assert.deepStrictEqual(checkedIds(list), ['r1', 'r2', 'r3']);
  // Only THIS board's rules: another board's rule is never selected.
  assert.deepStrictEqual(list.session.get('selectedRuleIds'), ['r1', 'r2', 'r3']);
});

test('Unselect all clears every tick, including ones made by hand', () => {
  const list = loadRulesList(RULES);
  list.session.set('currentBoard', 'b1');
  for (const id of ['r1', 'r3']) {
    list.events['change .js-rule-select']({
      currentTarget: { checked: true, getAttribute: () => id },
    });
  }
  assert.deepStrictEqual(checkedIds(list), ['r1', 'r3']);
  list.events['click .js-rules-select-none']();
  assert.deepStrictEqual(checkedIds(list), []);
  // ...and Select all after a partial manual selection still selects all.
  list.events['change .js-rule-select']({
    currentTarget: { checked: true, getAttribute: () => 'r2' },
  });
  list.events['click .js-rules-select-all']();
  assert.deepStrictEqual(checkedIds(list), ['r1', 'r2', 'r3']);
});

test('negative: unticking one rule removes only that rule', () => {
  const list = loadRulesList(RULES);
  list.session.set('currentBoard', 'b1');
  list.events['click .js-rules-select-all']();
  list.events['change .js-rule-select']({
    currentTarget: { checked: false, getAttribute: () => 'r2' },
  });
  assert.deepStrictEqual(checkedIds(list), ['r1', 'r3']);
});

test('each row binds its checkbox to the selection', () => {
  const jade = read('client/components/rules/rulesList.jade');
  assert.match(jade, /input\.js-rule-select\(type="checkbox"[^)\n]*checked=isSelected\)/);
  assert.match(jade, /button\.primary\.js-rules-select-all\(type="button"\)/);
  assert.match(jade, /button\.primary\.js-rules-select-none\(type="button"\)/);
});

// ---------------------------------------------------------------- the CSS

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

function cssRules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stripComments(css)))) {
    const decls = {};
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i > 0) decls[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    out.push({ selectors: m[1].split(',').map(s => s.trim()).filter(Boolean), decls });
  }
  return out;
}

const formsCss = cssRules(read('client/components/forms/forms.css'));
const hideRule = formsCss.find(r => r.selectors.includes('[type="checkbox"]:checked')
  && r.selectors.includes('[type="checkbox"]:not(:checked)'));

test('forms.css still hides native checkboxes app-wide (what is being undone)', () => {
  assert.ok(hideRule, 'the app-wide checkbox hiding rule moved; update this suite');
  assert.strictEqual(hideRule.decls.display, 'none');
  assert.strictEqual(hideRule.decls.visibility, 'hidden');
});

// What a rule must say to undo each hiding declaration of forms.css.
const UNDO = {
  display: v => v !== 'none',
  visibility: v => v === 'visible',
  position: v => v === 'static' || v === 'relative',
  'inset-inline-start': v => v === 'auto' || /^-?\d+(px)?$/.test(v) && Math.abs(parseInt(v, 10)) < 50,
};

function assertUndoes(decls, where) {
  for (const prop of Object.keys(hideRule.decls)) {
    if (!UNDO[prop]) continue;
    assert.ok(prop in decls && UNDO[prop](decls[prop]),
      `${where} must undo forms.css "${prop}: ${hideRule.decls[prop]}" (has ${decls[prop]})`);
  }
}

const rulesCss = cssRules(read('client/components/rules/rules.css'));

test('the rules list checkbox is visible, and outranks [type="checkbox"]:checked', () => {
  const rule = rulesCss.find(r => r.selectors.some(s => /\.js-rule-select\[type="checkbox"\]/.test(s)));
  assert.ok(rule, 'rules.css needs a .js-rule-select[type="checkbox"] override');
  assertUndoes(rule.decls, '.js-rule-select');
  assert.strictEqual(rule.decls['min-height'], '0',
    'forms.css gives every input a 41px min-height; a checkbox must not inherit it');
  const sel = rule.selectors.find(s => /\.js-rule-select/.test(s));
  // Specificity: at least two classes plus the attribute, i.e. above (0,2,0).
  const classesAndAttrs = (sel.match(/\.[\w-]+|\[[^\]]+\]/g) || []).length;
  assert.ok(classesAndAttrs >= 3, `selector "${sel}" is not more specific than forms.css`);
  // No later rule hides it again.
  for (const r of rulesCss) {
    if (!r.selectors.some(s => /js-rule-select/.test(s))) continue;
    assert.notStrictEqual(r.decls.display, 'none');
    assert.notStrictEqual(r.decls.visibility, 'hidden');
  }
});

test('negative: no native checkbox under client/components/rules is left hidden', () => {
  const dir = path.join(ROOT, 'client/components/rules');
  const jadeFiles = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.jade')) jadeFiles.push(p);
    }
  }(dir));
  const allCss = fs.readdirSync(dir).filter(f => f.endsWith('.css'))
    .flatMap(f => cssRules(fs.readFileSync(path.join(dir, f), 'utf8')));
  let checked = 0;
  for (const file of jadeFiles) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*input((?:[.#][\w-]+)*)\(([^)]*type="checkbox"[^)]*)\)/);
      if (!m || /materialCheckBox/.test(line)) continue;
      const hooks = (m[1].match(/[.#][\w-]+/g) || []);
      const idAttr = m[2].match(/\bid="([^"]+)"/);
      if (idAttr) hooks.push(`#${idAttr[1]}`);
      assert.ok(hooks.length, `${path.relative(ROOT, file)}: "${line.trim()}" has no class or id to style it by`);
      const covering = allCss.filter(r => r.selectors.some(s => hooks.some(h => s.includes(h))));
      assert.ok(covering.length, `${path.relative(ROOT, file)}: "${line.trim()}" is hidden by forms.css`);
      const merged = Object.assign({}, ...covering.map(r => r.decls));
      assertUndoes(merged, `${path.relative(ROOT, file)} ${hooks.join('')}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 4, `expected the rules checkboxes to be found, found ${checked}`);
});

console.log(`rulesSelectAllCheckboxes: ${passed} passed`);
