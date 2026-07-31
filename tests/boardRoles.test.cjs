'use strict';

// docs/Features/Members/Roles.md is a table of what each board role may do. This
// keeps it honest: it reads the table and the code together and fails when they
// drift. Run: node tests/boardRoles.test.cjs
//
// A permissions table that quietly goes stale is worse than none, because it is
// the thing an admin decides who to trust with. So every role the code can
// produce must have a row, every row must name a real member flag, and the two
// columns that are decided by one list each - "create / edit" and "comment" - must
// match those lists in server/lib/utils.js.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const doc = read('docs/Features/Members/Roles.md');
const boards = read('models/boards.js');
const serverUtils = read('server/lib/utils.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// ── the table, parsed ────────────────────────────────────────────────────────
// | Role | Member flag | sees | comment | create/edit | move | lists | settings |
const COLUMNS = ['role', 'flag', 'sees', 'comment', 'edit', 'move', 'lists', 'settings'];
const rows = doc
  .split('\n')
  .filter(line => line.startsWith('| **'))
  .map(line => {
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    const row = {};
    COLUMNS.forEach((name, i) => { row[name] = cells[i] || ''; });
    row.name = row.role.replace(/\*\*/g, '');
    row.flagName = (row.flag.match(/`(\w+)`/) || [])[1] || null;
    return row;
  });

// A cell is a yes/no answer, whatever emphasis or ⚠ marker it carries.
const isYes = cell => /(^|[^a-z])yes([^a-z]|$)/i.test(cell.replace(/\*\*/g, ''));
const isNo = cell => /(^|[^a-z])no([^a-z]|$)/i.test(cell.replace(/\*\*/g, ''));

console.log('boardRoles:');

test('the table parses, and every row answers every column', () => {
  assert.ok(rows.length >= 9, `expected the nine board roles, parsed ${rows.length}`);
  for (const row of rows) {
    for (const col of ['comment', 'edit', 'move', 'lists', 'settings']) {
      assert.ok(isYes(row[col]) !== isNo(row[col]),
        `${row.name}: the "${col}" cell must say yes or no, got "${row[col]}"`);
    }
  }
});

test('every role the code can return has a row', () => {
  // Board.memberRole() is the single place that names a member's role. Compare on
  // the FLAG rather than the name: the doc writes roles for a reader ("Comment
  // only, assigned") and the code as keys ('comment-assigned-only'), and matching
  // those as text is a guessing game that would fail on wording alone.
  const at = boards.indexOf('  memberRole(memberId) {');
  assert.notStrictEqual(at, -1, 'memberRole() must exist');
  const body = boards.slice(at, boards.indexOf('\n  },', at));

  const flags = [...body.matchAll(/if \(member\.(is\w+)\) return '([\w-]+)'/g)]
    .map(m => ({ flag: m[1], key: m[2] }));
  assert.ok(flags.length >= 8, `memberRole distinguishes ${flags.length} flags`);
  assert.ok(/return 'normal';/.test(body), 'and a flagless "normal" fallback');

  const documented = new Set(rows.map(r => r.flagName).filter(Boolean));
  const missing = flags.filter(f => !documented.has(f.flag))
    .map(f => `${f.key} (${f.flag})`);
  assert.deepStrictEqual(missing, [],
    'these roles exist in the code with no row in the table');

  // ...and nothing in the table that the code cannot produce.
  const real = new Set(flags.map(f => f.flag));
  const invented = [...documented].filter(f => !real.has(f));
  assert.deepStrictEqual(invented, [],
    'these rows name a flag memberRole() never reads');

  // The flagless row is the plain member, and there must be exactly one.
  const flagless = rows.filter(r => !r.flagName);
  assert.strictEqual(flagless.length, 1, 'exactly one row for a member with no flag set');
  assert.ok(/normal/i.test(flagless[0].name), 'and it is Normal');
});

test('every flag the table names is a real board member flag', () => {
  // A typo here documents a permission that does not exist.
  for (const row of rows) {
    if (!row.flagName) {
      assert.ok(/none/i.test(row.flag), `${row.name}: no flag and not marked as such`);
      continue;
    }
    assert.ok(boards.includes(`'members.$.${row.flagName}'`),
      `${row.name}: ${row.flagName} is not in the board members schema`);
  }
});

// ── the two columns the server decides with one list each ────────────────────

function flagsExcludedBy(fnName) {
  const at = serverUtils.indexOf(`export function ${fnName}(`);
  assert.notStrictEqual(at, -1, `${fnName} must exist`);
  const body = serverUtils.slice(at, serverUtils.indexOf('\n}', at));
  return new Set([
    ...[...body.matchAll(/!e\.(\w+)/g)].map(m => m[1]),
    ...[...body.matchAll(/!board\.has(\w+)\(/g)].map(m => `is${m[1]}`),
  ]);
}

test('"create / edit" matches allowIsBoardMemberWithWriteAccess', () => {
  // The rule every card / list / swimlane / checklist allow() calls.
  const excluded = flagsExcludedBy('allowIsBoardMemberWithWriteAccess');
  for (const row of rows) {
    if (row.name === 'Board admin') continue; // gate is isBoardAdmin, not this list
    const blocked = row.flagName ? excluded.has(row.flagName) : false;
    assert.strictEqual(isNo(row.edit), blocked,
      `${row.name}: the table says edit=${row.edit.replace(/\*\*/g, '')} but the write rule `
      + `${blocked ? 'excludes' : 'does not exclude'} ${row.flagName || 'it'}`);
    // Lists/swimlanes/checklists go through the SAME rule, so the two columns
    // cannot disagree.
    assert.strictEqual(isNo(row.lists), isNo(row.edit),
      `${row.name}: cards and lists are gated by one rule, so these columns must agree`);
  }
});

test('"comment" matches allowIsBoardMemberCommentOnly', () => {
  // The rule card comments and comment reactions call.
  const excluded = flagsExcludedBy('allowIsBoardMemberCommentOnly');
  for (const row of rows) {
    if (row.name === 'Board admin') continue; // has*() ignores flags on an admin
    const blocked = row.flagName ? excluded.has(row.flagName) : false;
    assert.strictEqual(isNo(row.comment), blocked,
      `${row.name}: the table says comment=${row.comment.replace(/\*\*/g, '')} but the `
      + `comment rule ${blocked ? 'excludes' : 'does not exclude'} ${row.flagName || 'it'}`);
  }
});

test('"which cards they see" matches the assigned-only scope', () => {
  const scope = read('models/lib/boardCardScope.js');
  const at = scope.indexOf('function isAssignedOnlyMember(');
  const body = scope.slice(at, scope.indexOf('\n}', at));
  const restricting = [...body.matchAll(/member\.(is\w+)/g)].map(m => m[1]);
  assert.strictEqual(restricting.length, 3, 'three flags restrict visibility');

  for (const row of rows) {
    const assignedOnly = /assigned/i.test(row.sees);
    const restricted = row.flagName ? restricting.includes(row.flagName) : false;
    assert.strictEqual(assignedOnly, restricted,
      `${row.name}: the table says "${row.sees}" but the card scope `
      + `${restricted ? 'does' : 'does not'} narrow ${row.flagName || 'it'} to assignees`);
  }
});

test('board settings are the board-admin row only', () => {
  for (const row of rows) {
    assert.strictEqual(isYes(row.settings), row.name === 'Board admin',
      `${row.name}: only the board admin may change settings, members and roles`);
  }
});

test('the gaps the table marks are still there, and still explained', () => {
  // Each ⚠ is a place the code and the role's name disagree. If one is fixed, its
  // row and its entry under "Known gaps" have to go with the fix - a table that
  // still warns about a fixed problem is as wrong as one that hides a real one.
  const warned = rows.filter(r => Object.values(r).some(c => String(c).includes('⚠')));
  assert.ok(warned.length > 0, 'the table marks the known gaps');

  const gaps = doc.slice(doc.indexOf('## Known gaps'), doc.indexOf('## Where the UI'));
  for (const row of warned) {
    assert.ok(gaps.includes(row.flagName),
      `${row.name} is marked ⚠ but ${row.flagName} is not explained under "Known gaps"`);
  }

  // And the two the text names must still be true of the code.
  assert.ok(!flagsExcludedBy('allowIsBoardMemberWithWriteAccess').has('isCommentAssignedOnly'),
    'gap 1: isCommentAssignedOnly still has write access');
  assert.ok(flagsExcludedBy('allowIsBoardMemberWithWriteAccess').has('isNoComments'),
    'gap 2: the write rule still excludes isNoComments');
});

test('the doc is reachable from the pages that talk about roles', () => {
  assert.ok(read('docs/Features/Members/Members.md').includes('Roles.md'),
    'Members.md must link to it');
  assert.ok(read('docs/API/Role.md').includes('Roles.md'),
    'the API role page must link to it');
});

console.log(`\nboardRoles: ${passed} tests passed`);
