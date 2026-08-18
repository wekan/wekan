'use strict';

// The board roles: one capability table, and everything that has to agree with it.
// Run: node tests/boardRoles.test.cjs
//
// What each role may do used to be spelled out three times — in the server allow
// helpers, in the client's canModify* helpers, and in prose in the docs — and the
// three had drifted. Every place they disagreed was a role that did not do what
// its name says: "comment only, assigned" could edit everything, "no comments"
// could edit nothing, and a board admin carrying another flag lost write access.
//
// models/lib/boardRoleCapabilities.js is the table now. This checks that nothing
// has grown a fourth opinion: the server rules, the UI helpers, the Admin Panel's
// Roles Status pane and docs/Features/Members/Roles.md must all be that table.
//
// A permissions page that quietly goes stale is worse than none, because it is
// what an admin decides who to trust with — so the doc is checked, not trusted.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  BOARD_ROLES,
  ROLE_FLAGS,
  ROLE_CAPABILITIES,
  memberRoleOf,
  roleCan,
  memberCan,
} = require('../models/lib/boardRoleCapabilities');

const doc = read('docs/Features/Members/Roles.md');
const boards = read('models/boards.js');
const serverUtils = read('server/lib/utils.js');
const clientUtils = read('client/lib/utils.js');
const peopleJs = read('client/components/settings/peopleBody.js');
const peopleJade = read('client/components/settings/peopleBody.jade');

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

console.log('boardRoles:');

// ── the module itself ────────────────────────────────────────────────────────

test('a member with no flag is Normal, and an inactive one has no role at all', () => {
  assert.strictEqual(memberRoleOf({ userId: 'ada', isActive: true }), 'normal');
  assert.strictEqual(memberRoleOf({ userId: 'ada', isActive: false }), null);
  assert.strictEqual(memberRoleOf({ userId: 'ada', isActive: false, isAdmin: true }), null,
    'an inactive admin is not a member; every has*() helper agrees');
  assert.strictEqual(memberRoleOf(null), null);
  assert.strictEqual(memberRoleOf(undefined), null);
});

test('each flag names its role', () => {
  for (const [role, flag] of Object.entries(ROLE_FLAGS)) {
    assert.strictEqual(memberRoleOf({ userId: 'ada', isActive: true, [flag]: true }), role, flag);
  }
});

test('GAP 3: an admin is an admin, whatever else is set on them', () => {
  // The write rule used to read the raw flags with no isAdmin exemption, unlike
  // every has*() helper on the board — so an admin who also carried isNoComments
  // silently lost write access. Not reachable from the Web UI, which writes all
  // eight flags at once, but reachable over the REST API.
  for (const flag of Object.values(ROLE_FLAGS)) {
    if (flag === 'isAdmin') continue;
    const member = { userId: 'ada', isActive: true, isAdmin: true, [flag]: true };
    assert.strictEqual(memberRoleOf(member), 'board-admin', `isAdmin + ${flag}`);
    assert.strictEqual(memberCan([member], 'ada', 'write'), true, `isAdmin + ${flag} may write`);
  }
});

test('GAP 2: "no comments" blocks commenting and nothing else', () => {
  // It used to block writing too — a second read-only role under a name that says
  // otherwise, and one the UI still offered the edit buttons for.
  assert.strictEqual(roleCan('no-comments', 'comment'), false);
  assert.strictEqual(roleCan('no-comments', 'write'), true);
  assert.strictEqual(roleCan('no-comments', 'seesAllCards'), true);
  assert.strictEqual(roleCan('no-comments', 'manageBoard'), false);
});

test('GAP 1: "comment only, assigned" is comment-only, like the role it is named after', () => {
  // Nothing outside the card publications read its flag, so it had full write
  // access — it was "normal, assigned only" under another name.
  assert.strictEqual(roleCan('comment-assigned-only', 'write'), false);
  assert.strictEqual(roleCan('comment-assigned-only', 'comment'), true);
  assert.strictEqual(roleCan('comment-assigned-only', 'seesAllCards'), false,
    'and it still only sees the cards it is assigned to');

  // The two comment-only roles differ ONLY in what they see.
  for (const cap of ['comment', 'write', 'manageBoard']) {
    assert.strictEqual(roleCan('comment-assigned-only', cap), roleCan('comment-only', cap), cap);
  }
});

test('only the board admin may manage the board', () => {
  for (const role of BOARD_ROLES) {
    assert.strictEqual(roleCan(role, 'manageBoard'), role === 'board-admin', role);
  }
});

test('an unknown role or capability is a no', () => {
  assert.strictEqual(roleCan('emperor', 'write'), false);
  assert.strictEqual(roleCan('normal', 'launchMissiles'), false);
  assert.strictEqual(roleCan(null, 'write'), false);
  assert.strictEqual(memberCan([], 'ada', 'write'), false);
  assert.strictEqual(memberCan(null, 'ada', 'write'), false);
  assert.strictEqual(memberCan([{ userId: 'ada', isActive: true }], null, 'write'), false,
    'a logged-out visitor is not a member');
});

// ── everything that has to agree with it ────────────────────────────────────

test('the server allow rules ARE the table', () => {
  // The authority. If these grow their own flag list again, the drift is back.
  assert.ok(/memberCan\(board\.members, userId, 'write'\)/.test(serverUtils),
    'allowIsBoardMemberWithWriteAccess must ask for the write capability');
  assert.ok(/memberCan\(board\.members, userId, 'comment'\)/.test(serverUtils),
    'allowIsBoardMemberCommentOnly must ask for the comment capability');

  const code = serverUtils.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const writeFn = code.slice(code.indexOf('export function allowIsBoardMemberWithWriteAccess'));
  const body = writeFn.slice(0, writeFn.indexOf('\n}'));
  for (const flag of Object.values(ROLE_FLAGS)) {
    assert.ok(!body.includes(flag),
      `the write rule must not name ${flag} itself — that is the table's job`);
  }
});

test('the UI offers exactly what the server would accept', () => {
  // Every disagreement here was a button offered to somebody whose write the
  // server then refused, which reads as a bug to the person clicking it.
  const code = clientUtils.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  // #3189 split one of these off: a move is no longer the same question as an
  // edit. A Worker may move a card and put their own name in its assignees while
  // writing nothing else, enforced field by field on the server
  // (models/lib/workerCardWrite.js), so canMoveCard asks for `moveCard` and the
  // other two still ask for `write`. Every role with `write` also has `moveCard`,
  // so this widened the answer for exactly one role.
  const CAPABILITY_OF = {
    canModifyCard: 'write',
    canMoveCard: 'moveCard',
    canModifyBoard: 'write',
  };
  for (const [fn, capability] of Object.entries(CAPABILITY_OF)) {
    const at = code.indexOf(`  ${fn}(`);
    assert.notStrictEqual(at, -1, `${fn} must exist`);
    const body = code.slice(at, code.indexOf('\n  },', at));
    assert.ok(new RegExp(`currentUserCan\\('${capability}'(?:,|\\))`).test(body),
      `${fn} must ask the table for the ${capability} capability`);
    for (const flag of Object.values(ROLE_FLAGS)) {
      assert.ok(!body.includes(flag), `${fn} must not name ${flag} itself`);
    }
  }
  assert.ok(/memberCan\(board\.members, userId, capability\)/.test(clientUtils),
    'and currentUserCan must go through the shared helper');
});

// ── the documentation table ─────────────────────────────────────────────────
// | Role | Member flag | sees | comment | write | manage |

// #3189 added the last one: moving a card and assigning yourself is its own
// capability now, because the Worker role is defined by exactly those two writes
// and by no other.
const COLUMNS = ['role', 'flag', 'sees', 'comment', 'write', 'manage', 'move'];
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

const plain = cell => cell.replace(/\*\*/g, '').replace('⚠', '').trim();
const isYes = cell => /^yes$/i.test(plain(cell));
const isNo = cell => /^no$/i.test(plain(cell));

test('the doc table parses, one row per role, each answering every column', () => {
  assert.strictEqual(rows.length, BOARD_ROLES.length,
    `expected ${BOARD_ROLES.length} rows, parsed ${rows.length}`);
  for (const row of rows) {
    for (const col of ['comment', 'write', 'manage', 'move']) {
      assert.ok(isYes(row[col]) !== isNo(row[col]),
        `${row.name}: the "${col}" cell must say yes or no, got "${row[col]}"`);
    }
  }
});

test('every row names a flag the code really reads, and none is missing', () => {
  const documented = rows.map(r => r.flagName);
  const real = new Set(Object.values(ROLE_FLAGS));

  const invented = documented.filter(f => f && !real.has(f));
  assert.deepStrictEqual(invented, [], 'these rows name a flag no role uses');

  const missing = [...real].filter(f => !documented.includes(f));
  assert.deepStrictEqual(missing, [], 'these flags have no row');

  const flagless = rows.filter(r => !r.flagName);
  assert.strictEqual(flagless.length, 1, 'exactly one row for a member with no flag');
  assert.ok(/normal/i.test(flagless[0].name), 'and it is Normal');
});

test('every cell of the doc table matches the capability table', () => {
  // The whole point: the page cannot claim a permission the code does not give.
  const byFlag = new Map(Object.entries(ROLE_FLAGS).map(([role, flag]) => [flag, role]));
  for (const row of rows) {
    const role = row.flagName ? byFlag.get(row.flagName) : 'normal';
    const caps = ROLE_CAPABILITIES[role];
    assert.ok(caps, `${row.name}: no capabilities for ${role}`);

    assert.strictEqual(isYes(row.comment), caps.comment, `${row.name}: comment`);
    assert.strictEqual(isYes(row.write), caps.write, `${row.name}: create / edit`);
    assert.strictEqual(isYes(row.manage), caps.manageBoard, `${row.name}: board settings`);
    assert.strictEqual(isYes(row.move), caps.moveCard, `${row.name}: move a card / assign yourself`);
    assert.strictEqual(/assigned/i.test(row.sees), !caps.seesAllCards,
      `${row.name}: which cards they see`);
  }
});

test('"which cards they see" matches the assigned-only publication scope', () => {
  // That column is enforced by the card publications, not by the capability table,
  // so the two have to be checked against each other.
  const scope = read('models/lib/boardCardScope.js');
  const at = scope.indexOf('function isAssignedOnlyMember(');
  const body = scope.slice(at, scope.indexOf('\n}', at));
  const restricting = [...body.matchAll(/member\.(is\w+)/g)].map(m => m[1]);

  const restrictedByTable = BOARD_ROLES.filter(r => !ROLE_CAPABILITIES[r].seesAllCards)
    .map(r => ROLE_FLAGS[r]);
  assert.deepStrictEqual([...restricting].sort(), [...restrictedByTable].sort(),
    'the publication scope and the capability table must restrict the same roles');
});

test('the table marks no gap, because there is none left', () => {
  // A table that warns about a fixed problem is as wrong as one that hides a real
  // one. #3189 was the last ⚠ - a Worker can move a card and assign itself now -
  // so the warning and its "Known gaps" entry had to go with the fix, and this
  // test flipped with them.
  const warned = rows.filter(r => Object.values(r).some(c => String(c).includes('⚠')));
  assert.deepStrictEqual(warned.map(r => r.flagName), [],
    'a ⚠ in the table means a role that cannot do what its name says; add the '
    + 'entry under "Known gaps" with it');
  assert.strictEqual(roleCan('worker', 'moveCard'), true, 'and a Worker can move a card');
  assert.strictEqual(roleCan('worker', 'write'), false,
    'while still not being able to edit one - that is what made this a field-level '
    + 'policy rather than a table edit');

  const gaps = doc.slice(doc.indexOf('## Known gaps'), doc.indexOf('## Setting a role'));
  assert.ok(/None recorded/.test(gaps), 'the section says so plainly');
  assert.ok(!/isWorker/.test(gaps), 'and no longer carries the Worker entry');

  // The four that ARE fixed must be recorded as fixed, not as gaps.
  const fixed = doc.slice(doc.indexOf('## Fixed'), doc.indexOf('## Known gaps'));
  for (const flag of ['isCommentAssignedOnly', 'isNoComments', 'isAdmin']) {
    assert.ok(fixed.includes(flag), `${flag} must be recorded under "Fixed"`);
  }
  assert.ok(/#3189/.test(fixed) && /Worker/.test(fixed),
    'including the Worker one, with the issue it came from');
});

// ── Admin Panel / People / Roles: the Roles Status table ────────────────────

test('the Roles Status pane renders from the capability table', () => {
  assert.ok(/require\('\/models\/lib\/boardRoleCapabilities'\)/.test(peopleJs),
    'it must read the one table, not a copy of it');
  assert.ok(/BOARD_ROLES\.map\(roleKey =>/.test(peopleJs), 'a row per role');
  assert.ok(/\.\.\.ROLE_CAPABILITIES\[roleKey\]/.test(peopleJs), 'and its capabilities');
});

test('the Roles Status table is READ-ONLY', () => {
  const at = peopleJs.indexOf('const ROLES_STATUS_COLUMNS');
  const spec = peopleJs.slice(at, peopleJs.indexOf('];', at));
  // The shared template renders an interactive row only when the page supplies a
  // rowTemplate, and an editable cell only through the column spec. Neither here.
  assert.ok(!/rowTemplate/.test(spec), 'no interactive row template');
  assert.ok(!/headerTemplate/.test(spec), 'no interactive header');
  assert.ok(!/js-/.test(spec), 'no click handles in the cells');

  const helper = peopleJs.slice(peopleJs.indexOf('rolesStatusTable() {'));
  const body = helper.slice(0, helper.indexOf('\n  },'));
  assert.ok(!/rowTemplate|actions:/.test(body), 'and no action buttons');
});

test('it is the shared table page, not a hand-written table', () => {
  assert.ok(/\+tablePage\(rolesStatusTable\)/.test(peopleJade),
    'the pane must render the shared template (docs/Features/Page/Table.md)');
  assert.ok(!/table\.roles-status|<table/.test(peopleJade.slice(
    peopleJade.indexOf('template(name="rolesGeneral")'),
    peopleJade.indexOf('template(name="templatesGeneral")'))),
    'and must not hand-write a table of its own');
  for (const helper of ['buildHeader(ROLES_STATUS_COLUMNS)', 'buildRows(page, ROLES_STATUS_COLUMNS)']) {
    assert.ok(peopleJs.includes(helper), `it must build its rows with ${helper}`);
  }
});

test('the settings above the Save button drive the table below it', () => {
  const helper = peopleJs.slice(peopleJs.indexOf('rolesStatusTable() {'));
  const body = helper.slice(0, helper.indexOf('\n  },'));
  assert.ok(/tpl\.workingRoles\.get\(\)/.test(body),
    'the Invite column must read the WORKING copy — the checkboxes as they are '
    + 'ticked — not the saved document, or the table would not follow them');
  assert.ok(/INVITE_TO_BOARD_ROLES\.includes\(roleKey\)/.test(body),
    'and a role that is not offered for invitation reads as not invitable, '
    + 'rather than as an unticked one');
});

test('every string in it is translatable', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const at = peopleJs.indexOf('const ROLES_STATUS_COLUMNS');
  const spec = peopleJs.slice(at, peopleJs.indexOf('];', at));

  const keys = [...spec.matchAll(/labelKey: '([\w-]+)'/g)].map(m => m[1]);
  assert.strictEqual(keys.length, 6, `expected six column headers, found ${keys.length}`);

  const helper = peopleJs.slice(peopleJs.indexOf('rolesStatusTable() {'));
  const body = helper.slice(0, helper.indexOf('\n  },'));
  const more = [...body.matchAll(/(?:titleKey|descKey|emptyKey): '([\w-]+)'/g)].map(m => m[1]);
  const cellKeys = [...spec.matchAll(/'(roles-status-sees-\w+)'/g)].map(m => m[1]);

  for (const key of [...keys, ...more, ...cellKeys, 'yes', 'no', ...BOARD_ROLES]) {
    assert.ok(key in en, `${key} is missing from en.i18n.json`);
  }

  // No literal English in the cells: the values are booleans, and a hard-coded
  // "Yes" would be English in every language.
  assert.ok(/TAPi18n\.__\(value \? 'yes' : 'no'\)/.test(peopleJs),
    'yes/no cells must be translated');
  assert.ok(/TAPi18n\.__\(doc\.roleKey\)/.test(spec),
    'and the role name is its own translation key');
});

test('the table design doc no longer calls Roles a non-table pane', () => {
  // docs/Features/Page/Table.md lists the pages that do NOT use the shared design,
  // "so the gap is visible rather than forgotten". Roles has one now.
  const design = read('docs/Features/Page/Table.md');
  const notUsing = design.slice(
    design.indexOf('## Pages that do not use this design'),
    design.indexOf('## Pages that use this design'));
  assert.ok(!/Roles is a checkbox list/.test(notUsing),
    'the "Roles is a checkbox list" reason is out of date — it has a table now');
  assert.ok(/Roles Status/.test(design), 'and Roles Status must be listed as a page that uses it');
});

test('the doc is reachable from the pages that talk about roles', () => {
  assert.ok(read('docs/Features/Members/Members.md').includes('Roles.md'),
    'Members.md must link to it');
  assert.ok(read('docs/API/Role.md').includes('Roles.md'),
    'the API role page must link to it');
});

console.log(`\nboardRoles: ${passed} tests passed`);
