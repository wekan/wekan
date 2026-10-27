'use strict';

// WebhookBleed (Hall of Fame, 2026-05-31, fixed at WeKan v9.32) - the three
// findings of that release that no other suite named:
// Run: node tests/webhookBleed.test.cjs
//
// 1. SSRF via webhook integration URLs (CVE-2026-53446, GHSA-hc3x-hq3m-663q,
//    CWE-918) - pinned by server/lib/tests/dnsbleed.security.tests.js and the
//    integration-URL suites; not repeated here.
// 2. copyBoard DDP method authorization bypass (CVE-2026-53445,
//    GHSA-7w2h-g83c-jqrp, CWE-862): any logged-in user could copy ANY board,
//    private ones included, with every card, checklist, custom field, label and
//    rule. The REST copy route required board admin; the method required
//    nothing. It now requires an ACTIVE board ADMIN, before anything is read
//    or copied. (The caller-supplied property injection the same advisory
//    describes is CopyIdentityBleed, pinned by tests/boardCopyProperties.test.cjs.)
// 3. Regression from the AvatarBleed RCE fix (CVE-2026-52891,
//    GHSA-35j7-h385-2q9g, CWE-78): that fix moved MIME detection from a shell
//    `exec` to `execFile` and made avatar file names shell-safe, but renamed
//    `asyncExec` to `asyncExecFile`, leaving the admin-configured external
//    scanner calling an undefined function - every upload failed validation
//    while a scanner was configured. Here: both halves of the AvatarBleed fix
//    still hold, the scanner's `asyncExec` is defined again, and nothing else
//    in the tree reaches a shell with an uploaded path. (The scanner's own
//    quoting is ScannerBleed, tests/scannerBleed.test.cjs.)
//
// copyBoard's refusal is not recorded in Admin Panel -> Problems: the method
// throws not-authorized exactly as for a stale client, so an attempt cannot be
// told apart from ordinary use; unsupported copy properties ARE recorded, as
// CopyIdentityBleed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function methodBody(src, name) {
  const at = src.indexOf(`async ${name}(`);
  assert.ok(at >= 0, `method ${name} exists`);
  const next = src.slice(at + 1).search(/\n  async \w+\(|\n  \w+\(|\n\}\);/);
  return src.slice(at, next < 0 ? undefined : at + 1 + next);
}

const boardsPub = code(read('server/publications/boards.js'));

test('GHSA-7w2h-g83c-jqrp: copyBoard requires an active board admin before copying', () => {
  const body = methodBody(boardsPub, 'copyBoard');
  // The signed-out refusal records an AuthBleed attempt first (authz.copy),
  // then throws - still before the board is read.
  assert.match(body, /if \(!this\.userId\) \{[\s\S]*?throw new Meteor\.Error\('not-authorized'\);\s*\}/);
  assert.ok(body.indexOf('!this.userId') < body.indexOf('ReactiveCache.getBoard(boardId)'),
    'signed out is refused before anything is read');
  assert.match(body, /if \(!board\) throw new Meteor\.Error\('not-found'\)/);
  assert.match(body, /if \(!board\.hasAdmin\(this\.userId\)\) throw new Meteor\.Error\('not-authorized'\)/);
  const guard = body.indexOf('board.hasAdmin(this.userId)');
  assert.ok(guard < body.indexOf('.copy('), 'the admin check runs before the copy');
  assert.ok(guard < body.indexOf('boardWithCopyProperties('), 'and before the properties are applied');
  assert.doesNotMatch(body, /isBoardMember\(|hasMember\(/, 'membership alone is not enough');
});

test('GHSA-7w2h-g83c-jqrp: hasAdmin means an ACTIVE admin member', () => {
  const src = read('models/boards.js');
  const at = src.indexOf('  hasAdmin(memberId) {');
  assert.ok(at >= 0);
  const helper = src.slice(at, src.indexOf('\n  },', at));
  assert.match(helper, /userId: memberId,\s*isActive: true,\s*isAdmin: true/);
  // Model the predicate the way it is written.
  const hasAdmin = (members, id) => members.some(m => m.userId === id && m.isActive === true && m.isAdmin === true);
  assert.equal(hasAdmin([{ userId: 'u', isActive: true, isAdmin: true }], 'u'), true);
  assert.equal(hasAdmin([{ userId: 'u', isActive: true, isAdmin: false }], 'u'), false, 'a plain member');
  assert.equal(hasAdmin([{ userId: 'u', isActive: false, isAdmin: true }], 'u'), false, 'a removed admin');
  assert.equal(hasAdmin([], 'stranger'), false, 'a non-member of a private board');
});

test('GHSA-7w2h-g83c-jqrp negative: every server path that copies a whole board checks board admin', () => {
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['tests', 'node_modules', '_build', '.build'].includes(e.name)) continue;
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js')) files.push(rel);
    }
  };
  walk('server');
  let copySites = 0;
  for (const file of files) {
    const src = code(read(file));
    // A whole-board copy: the board helper reached through boardWithCopyProperties
    // or a prototype copy of a board document (the REST route).
    for (const m of src.matchAll(/boardWithCopyProperties\([^)]*\)(?:\.copy\(|;)|const copy = Object\.assign\(Object\.create\(Object\.getPrototypeOf\(board\)\)/g)) {
      copySites += 1;
      const before = src.slice(Math.max(0, src.lastIndexOf('\n  async ', m.index), src.lastIndexOf('WebApp.handlers.', m.index)), m.index);
      assert.match(before, /board\.hasAdmin\(this\.userId\)|Authentication\.checkBoardAdmin\(req\.userId/,
        `${file}: a whole-board copy without a board-admin check`);
    }
  }
  assert.ok(copySites >= 3, `copyBoard, saveBoardAsTemplate and the REST copy route are found (${copySites})`);
});

const validation = read('models/fileValidation.js');
const validationCode = code(validation);

test('GHSA-35j7-h385-2q9g regression: the scanner\'s asyncExec is defined wherever it is called', () => {
  assert.match(validationCode, /import \{ exec \} from 'node:child_process';/);
  assert.match(validationCode, /let asyncExec;/);
  assert.match(validationCode, /asyncExec = promisify\(exec\);/);
  const calls = [...validationCode.matchAll(/\basyncExec\(/g)];
  assert.equal(calls.length, 1, 'the shell exec is used exactly once');
  assert.match(validationCode.slice(calls[0].index, calls[0].index + 120),
    /^asyncExec\(externalCommandLine\.replace\("\{file\}", shellQuote\(fileObj\.path\)\)\)/,
    'and only for the admin-configured scanner command, with the path quoted');
  // Every async*Exec* identifier that is called is also declared.
  for (const [, name] of validationCode.matchAll(/\b(async\w*Exec\w*)\(/g)) {
    assert.match(validationCode, new RegExp(`\\b(let|const|var|function)\\s+${name}\\b|\\{[^}]*\\b${name}\\b[^}]*\\}\\s*=\\s*require`),
      `${name} is called but never declared (the v9.31 ReferenceError)`);
  }
});

test('GHSA-35j7-h385-2q9g: MIME detection never spawns a shell', () => {
  const mime = code(read('models/lib/mimeDetection.js'));
  assert.match(mime, /const \{ execFile \} = require\('node:child_process'\);/);
  assert.match(mime, /execFile\('file', args,/);
  assert.doesNotMatch(mime, /\bexec\(|\bexecSync\(|shell:\s*true/);
});

test('GHSA-35j7-h385-2q9g: an avatar file name keeps no shell or path metacharacter', () => {
  const avatars = read('models/avatars.js');
  const strip = /\.replace\(\/\[\^a-zA-Z0-9_\.\\-\]\/g, '_'\)/g;
  assert.ok((avatars.match(strip) || []).length >= 2, 'namingFunction and sanitize both strip');
  assert.match(avatars, /const safeName = filenameWithoutExtension\.replace\(\/\[\^a-zA-Z0-9_\.\\-\]\/g, '_'\);\s*const ret = fileId \+ "-original-" \+ safeName;/);
  const sanitize = s => s.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  for (const attack of ['$(id)', 'a`id`b', 'x;rm -rf /', '../../etc/passwd', 'a"b\'c', 'a|b&c>d']) {
    const out = sanitize(attack);
    assert.match(out, /^[a-zA-Z0-9_.\-]*$/, attack);
    assert.doesNotMatch(out, /\//, `${attack}: no path separator survives`);
  }
});

test('GHSA-35j7-h385-2q9g negative: no other file reaches a shell through child_process', () => {
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['tests', 'node_modules', '_build', '.build', '.npm', '.tools'].includes(e.name)) continue;
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.(c|m)?js$/.test(rel)) files.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'imports', 'client', 'config']) {
    if (fs.existsSync(path.join(ROOT, dir))) walk(dir);
  }
  const shellUsers = [];
  for (const file of files) {
    const src = code(read(file));
    if (!/child_process/.test(src)) continue;
    if (/\{[^}]*\bexec(Sync)?\b[^}]*\}\s*(=\s*require\(|from\s)['"]?(node:)?child_process|child_process['"]\)\.exec(Sync)?\b|shell:\s*true/.test(src)) {
      shellUsers.push(file);
    }
  }
  assert.deepEqual(shellUsers, ['models/fileValidation.js'],
    'only the admin-configured scanner may run a shell command line');
});

console.log(`webhookBleed: ${passed} checks passed`);
