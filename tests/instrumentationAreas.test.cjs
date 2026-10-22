'use strict';

// Admin Panel / Problems / Instrumentation shows the whole picture first: one
// bar per area of WeKan (models/lib/instrumentationAreas.js) instead of up to
// 200 rows on 11 pages, and a bar filters the table below to its area.
//
// Run: node tests/instrumentationAreas.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isMeteorPackageFork } = require('./lib/meteorPackageForks.cjs');
const { parse } = require('@babel/parser');
const { AREAS, OTHER, areaOf, summarizeByArea } = require('../models/lib/instrumentationAreas.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every Meteor method and publication WeKan defines - what the counters count.
function operationNames() {
  const names = new Set();
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['_build', 'node_modules', '.npm', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      // Meteor's own packages, with their own test methods, are not WeKan's.
      if (isMeteorPackageFork(rel)) continue;
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js')) {
        const src = read(rel);
        if (!/Meteor\.methods|publish/.test(src)) continue;
        let ast;
        try {
          ast = parse(src, { sourceType: 'unambiguous', errorRecovery: true, plugins: ['jsx', 'topLevelAwait'] });
        } catch (e) { continue; }
        (function visit(node) {
          if (!node || typeof node.type !== 'string') return;
          if (node.type === 'CallExpression') {
            const callee = src.slice(node.callee.start, node.callee.end);
            const first = node.arguments[0];
            if (callee === 'Meteor.methods' && first && first.type === 'ObjectExpression') {
              for (const p of first.properties) if (p.key) names.add(p.key.name ?? p.key.value);
            }
            if (/^(Meteor\.publish|publishComposite|Meteor\.publishComposite)$/.test(callee)
              && first && first.type === 'StringLiteral') names.add(first.value);
          }
          for (const k of Object.keys(node)) {
            if (k === 'loc') continue;
            const v = node[k];
            if (Array.isArray(v)) v.forEach(visit);
            else if (v && typeof v.type === 'string') visit(v);
          }
        })(ast.program);
      }
    }
  };
  ['server', 'models', 'packages', 'imports'].forEach(walk);
  return [...names];
}

console.log('instrumentationAreas:');

test('names land in the area a person would look for them in', () => {
  const expected = {
    'positionHistory.getBoardHistory': 'history', 'userPositionHistory.createCheckpoint': 'history',
    notificationCards: 'notifications', 'api.attachment.download': 'attachments',
    applyListWidthToStorage: 'lists', applySwimlaneHeightToStorage: 'swimlanes',
    moveChecklist: 'checklists', addSubtaskCard: 'subtasks', setCardCustomFieldCheckbox: 'custom-fields',
    'cards.vote': 'cards', board: 'boards', removeBoardDependency: 'boards',
    getInstrumentationReport: 'problems', backupStatus: 'backup', 'attachmentMigration.getProgress': 'migrations',
    importReportForBoard: 'import', passkeyRegister: 'login', 'customBoardRoles.save': 'people',
    'rules.createRule': 'rules', globalSearch: 'search', setUiFontSize: 'settings',
  };
  for (const [name, area] of Object.entries(expected)) assert.strictEqual(areaOf(name).id, area, name);
});

test('every WeKan method and publication has an area; "Other" stays a handful (negative)', () => {
  const names = operationNames();
  assert.ok(names.length > 500, `found only ${names.length} operations`);
  const other = names.filter(name => areaOf(name).id === OTHER.id);
  assert.ok(other.length <= 5, `too many operations in Other - give them an area: ${other.join(', ')}`);
  const used = new Set(names.map(name => areaOf(name).id));
  for (const area of AREAS) assert.ok(used.has(area.id), `${area.id} has operations`);
});

test('the summary adds calls and errors up per area, and weights the average by completed calls', () => {
  const rows = summarizeByArea([
    { name: 'card', calls: 100, completed: 100, errors: 0, averageMs: 10, maxMs: 40 },
    { name: 'cards.vote', calls: 50, completed: 48, errors: 2, averageMs: 40, maxMs: 300 },
    { name: 'board', calls: 30, completed: 30, errors: 0, averageMs: null, maxMs: null },
    { name: 'nextPage', calls: 0, completed: 0, errors: 0, averageMs: null, maxMs: null },
  ]);
  assert.deepStrictEqual(rows.map(r => r.id), ['cards', 'boards'], 'busiest first; an area with no calls is left out');
  const cards = rows[0];
  assert.strictEqual(cards.calls, 150);
  assert.strictEqual(cards.errors, 2);
  assert.strictEqual(cards.averageMs, Math.round((10 * 100 + 40 * 48) / 148));
  assert.strictEqual(cards.maxMs, 300);
  assert.strictEqual(cards.share, 1);
  assert.strictEqual(rows[1].share, 30 / 150);
  assert.strictEqual(rows[1].averageMs, null, 'no timing, no average');
  assert.strictEqual(cards.errorShare, 2 / 150);
  assert.deepStrictEqual(summarizeByArea(undefined), []);
});

test('every area is named with a key every language has', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const area of [...AREAS, OTHER]) assert.ok(en[area.labelKey], `${area.labelKey} exists`);
  for (const key of ['api-calls', 'duration', 'errors']) assert.ok(en[key], `${key} exists`);
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(data['instrumentation-other'], `${file} has instrumentation-other`);
    if (!file.startsWith('en')) assert.notStrictEqual(data['instrumentation-other'], 'Other', `${file} is translated`);
  }
});

test('the page draws the bars above the table, and a bar filters the table', () => {
  const jade = read('client/components/settings/adminProblems.jade');
  const at = jade.indexOf('template(name="instrumentationReport")');
  const tpl = jade.slice(at, jade.indexOf('\ntemplate(', at + 1));
  assert.ok(tpl.indexOf('.instrumentation-areas') < tpl.indexOf('+tablePage(tablePageData)'), 'bars first');
  assert.match(tpl, /button\.instrumentation-area\.js-instrumentation-area\(type="button" data-area=area\.id/);
  assert.match(tpl, /\.instrumentation-area-fill\(style="width: \{\{area\.barPct\}\}%"\)/);
  const js = read('client/components/settings/adminProblems.js');
  assert.match(js, /'click \.js-instrumentation-area'\(event, t\) \{[\s\S]*?t\.area\.set\(t\.area\.get\(\) === area \? null : area\);/);
  assert.match(js, /\(!area \|\| areaOf\(row\.name\)\.id === area\)/, 'the table follows the chosen area');
  const css = read('client/components/settings/adminProblems.css');
  assert.match(css, /grid-template-columns: subgrid;/, 'names, bars and numbers line up');
  assert.match(css, /button\.instrumentation-area \{[^}]*padding: 4px 6px;[^}]*color: inherit;/, 'not the global button look');
});

console.log(`\ninstrumentationAreas: ${passed} tests passed`);
