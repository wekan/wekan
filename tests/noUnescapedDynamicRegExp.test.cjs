'use strict';

// GitHub CodeQL alert #564 (js/regex-injection): releases/platform-native-packages.mjs
// compiled its command-line platform and arch into a RegExp, so the caller chose
// part of the pattern - `.*` matched any package, `(a+)+$` backtracked. The same
// shape was in the attachment and avatar upload naming (the uploaded file's
// extension), the attachment rename popup and tools/mirror-menu.mjs.
//
// This guard parses every source file and looks at every `new RegExp(...)` /
// `RegExp(...)` whose pattern is not a constant. Each value spliced into it must
// be passed through a complete escape on the spot - or the site is listed below
// with the reason its values are constants. A new site that is neither fails,
// so the shape cannot come back somewhere nobody looked.
// Run: node tests/noUnescapedDynamicRegExp.test.cjs

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walkAst = require('acorn-walk');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Escape helpers that escape every metacharacter, backslash included.
const ESCAPERS = new Set(['escapeRegExp', 'escapeForRegex', 'escapeRegExpForExternalLink', 'escapeRegex']);
const FULL_ESCAPE_SOURCE = '[.*+?^${}()|[\\]\\\\]';

// Reviewed sites: the spliced values are constants of the file, or the pattern
// is deliberately the user's own and runs where only that user is affected.
const REVIEWED = {
  'client/components/cards/cardDetails.js': 'N is the constant number pattern of the map-link parser',
  'client/components/settings/peopleBody.js': "the admin's own search box on the admin-only People page",
  'imports/lib/advancedFilter.js': "the Advanced Filter's /regex/ syntax is the viewer's own pattern, run in their browser",
  'imports/lib/dateUtils.js': 'key is a key of the constant formatMap',
  'imports/lib/fileNameDisplay.js': 'INVISIBLE_CHARS_SOURCE is a constant',
  'models/boards.js': "searchBoards/Swimlanes/Lists are called only by client templates: the viewer's own search; uniqueTitle escapes",
  'models/lib/cardSearch.js': "Board.searchCards is called only by client templates: the viewer's own search, in their browser",
  'models/lib/cardUrlAutolink.js': 'CARD_URL_RE.source is a constant regex',
  'models/lib/customFieldStringTemplate.js': 'a user pattern by design; capped, and the server runs it under a time limit (templateRegexDos)',
  'models/lib/externalLinkRules.js': 'rule.source is built with externalLinkRuleEscape',
  'models/users.js': 'UserSearchIndex.search is called only by the client import mapping UI',
  'models/usersessiondata.js': 'unpickles a RegExp the server itself pickled (server/publications/cards.js)',
  'packages/markdown/src/template-integration.js': 'CARD_URL_RE.source is a constant; rule.source is escaped when built',
  'packages/wekan-ldap/server/groupAllowlist.js': 'every character escaped by escapeRegExpChar; only * and ? become .* and .',
  'server/models/activities.js': 'BIGEVENTS_PATTERN is an operator-supplied regex by design',
  'models/lib/obsidianKanbanFormat.js': 'pattern is built from escapeRegExp(format); emoji is a key of the constant TASK_DATES',
  'models/lib/sanitizeSvg.js': 'tag comes from the constant DANGEROUS_ELEMENTS list',
  'models/lib/urlSchemeAllowlist.js': 'names is the constant scheme allowlist',
  'packages/markdown/src/secureDOMPurify.js': 'names is the constant scheme allowlist',
  'models/lib/versionCheck.js': 'label comes from the constant VERSION_MANIFEST_LABELS',
};

const SOURCE_DIRS = /^(?:client|models|server|imports|config|releases|tools|snap-src|packages)\//;
// Third-party code vendored as-is is not ours to rewrite.
const VENDORED = /^packages\/(?:wekan-fontawesome|wekan-fullcalendar)\/|\.min\.js$|\/node_modules\/|\/tests\//;

function sourceFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
    .toString()
    .split('\0')
    .filter(file => /\.(?:cjs|mjs|js)$/.test(file) && SOURCE_DIRS.test(file) && !VENDORED.test(file));
}

// value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') - the complete inline escape.
function isFullEscapeCall(node) {
  const callee = node?.type === 'CallExpression' && node.callee;
  return Boolean(callee) && callee.type === 'MemberExpression' && callee.property.name === 'replace'
    && node.arguments[0]?.regex?.pattern === FULL_ESCAPE_SOURCE && node.arguments[0].regex.flags.includes('g');
}

// `scope` holds the file's own escape helpers (`const escape = v => v.replace(<full>)`)
// and the names assigned straight from an escape (`const safe = escape(term)`).
function isEscaped(node, scope) {
  if (node.type === 'Literal' || node.type === 'TemplateLiteral' && !node.expressions.length) return true;
  if (node.type === 'Identifier') return scope.escapedNames.has(node.name);
  if (node.type !== 'CallExpression') return false;
  const callee = node.callee;
  if (callee.type === 'Identifier' && (ESCAPERS.has(callee.name) || scope.escapers.has(callee.name))) return true;
  return isFullEscapeCall(node);
}

// The values spliced into a pattern expression: template expressions and the
// operands of `+`. Constant text needs nothing.
function splicedValues(node, scope) {
  if (!node) return [];
  if (node.type === 'Literal') return [];
  if (node.type === 'TemplateLiteral') return node.expressions.flatMap(e => (isEscaped(e, scope) ? [] : [e]));
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...splicedValues(node.left, scope), ...splicedValues(node.right, scope)];
  }
  return isEscaped(node, scope) ? [] : [node];
}

function unescapedSites(source) {
  let ast;
  try {
    ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true,
      allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, locations: true });
  } catch {
    return null;
  }
  const scope = { escapers: new Set(), escapedNames: new Set() };
  walkAst.simple(ast, {
    VariableDeclarator(decl) {
      if (decl.id.type !== 'Identifier' || !decl.init) return;
      const fn = decl.init;
      if ((fn.type === 'ArrowFunctionExpression' || fn.type === 'FunctionExpression') && isFullEscapeCall(fn.body)) {
        scope.escapers.add(decl.id.name);
      }
    },
    FunctionDeclaration(fn) {
      const body = fn.body.body;
      if (fn.id && body.length === 1 && body[0].type === 'ReturnStatement' && isFullEscapeCall(body[0].argument)) {
        scope.escapers.add(fn.id.name);
      }
    },
  });
  walkAst.simple(ast, {
    VariableDeclarator(decl) {
      if (decl.id.type === 'Identifier' && decl.init?.type === 'CallExpression' && isEscaped(decl.init, scope)) {
        scope.escapedNames.add(decl.id.name);
      }
    },
  });
  const sites = [];
  const visit = node => {
    if (node.callee.type !== 'Identifier' || node.callee.name !== 'RegExp') return;
    const pattern = node.arguments[0];
    if (!pattern || pattern.regex) return;
    if (splicedValues(pattern, scope).length) sites.push(node.loc.start.line);
  };
  walkAst.simple(ast, { NewExpression: visit, CallExpression: visit });
  return sites;
}

test('every value compiled into a RegExp is escaped, or the site is reviewed', () => {
  const offenders = [];
  let parsed = 0;
  for (const file of sourceFiles()) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const sites = unescapedSites(fs.readFileSync(full, 'utf8'));
    if (sites === null) continue; // not plain JavaScript (JSX, Flow, a fragment)
    parsed += 1;
    if (REVIEWED[file]) continue;
    for (const line of sites) offenders.push(`${file}:${line}`);
  }
  assert.ok(parsed > 500, `only ${parsed} files parsed - wrong root?`);
  assert.deepStrictEqual(offenders, [],
    `escape the value (escapeRegExp) or compare literally (startsWith/endsWith/includes):\n${offenders.join('\n')}`);
});

test('each reviewed site still exists, so the list does not outlive its reason', () => {
  for (const file of Object.keys(REVIEWED)) {
    const sites = unescapedSites(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    assert.ok(sites && sites.length, `${file} no longer builds a dynamic RegExp; remove it from REVIEWED`);
  }
});

test('the fixed sites build no RegExp from their input', () => {
  for (const file of ['releases/platform-native-packages.mjs', 'models/attachments.js', 'models/avatars.js',
    'client/components/cards/attachments.js', 'tools/mirror-menu.mjs']) {
    assert.deepStrictEqual(unescapedSites(fs.readFileSync(path.join(ROOT, file), 'utf8')), [], file);
  }
});

test('negative: the guard catches each shape it was written for', () => {
  for (const bad of [
    'const re = new RegExp(`^@napi-rs/canvas-${platform}-${arch}$`);',
    'name.replace(new RegExp(file.extensionWithDot + "$"), "");',
    'const re = RegExp("\\\\." + ext + "$");',
    'new RegExp(`^${value.replace(/\\./g, "\\\\.")}$`);',
    'const escape = v => v.replace(/\\./g, "\\\\."); new RegExp(escape(term));',
    'const safe = term.trim(); new RegExp(safe);',
  ]) {
    assert.deepStrictEqual(unescapedSites(bad), [1], bad);
  }
  for (const good of [
    'new RegExp(`^${escapeRegExp(name)}$`, "i");',
    "new RegExp(term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i');",
    'new RegExp("packages/[^/]+/upstream/", "gim");',
    'new RegExp(/a+/);',
    "const escape = v => v.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'); new RegExp(escape(term), 'i');",
    "const safe = escapeRegExp(term); new RegExp(safe, 'i');",
  ]) {
    assert.deepStrictEqual(unescapedSites(good), [], good);
  }
});

console.log(`\nnoUnescapedDynamicRegExp: ${passed} tests passed`);
