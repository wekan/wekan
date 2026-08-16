'use strict';

// Guard: a link in the developer docs points at something that is in the tree.
// Run: node tests/docsLinksResolve.test.cjs
//
// WHY. docs/DeveloperDocs/Directory-Structure.md described the repository as it
// was at commit e2f768c, and went on doing so for years. Fourteen of its links
// pointed at files that had moved or been deleted - and every one of those
// fourteen was written as a full
// `https://github.com/wekan/wekan/tree/main/...` URL rather than a relative
// path, which is exactly why nobody noticed: a relative link that is broken is
// visibly broken in an editor and on GitHub, while an absolute one looks like a
// link and 404s only for the reader who follows it.
//
// So both forms are checked here, against the actual tree. A page that sends
// somebody looking for a file that is not there is worse than a page that does
// not mention it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('docsLinksResolve:');

function markdownPages(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownPages(file);
    return entry.isFile() && entry.name.endsWith('.md') ? [file] : [];
  });
}

const pages = markdownPages(DOCS);

// A link target that names a path in this repository, in either form. Anything
// else - an issue, another project, a specification - is somebody else's to
// keep working.
function repoTargets(source, page) {
  const out = [];
  for (const m of source.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
    const raw = m[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(raw)) continue;
    let decoded;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }
    out.push({ raw, file: path.normalize(path.join(path.dirname(page), decoded)) });
  }
  for (const m of source.matchAll(/\]\(https:\/\/github\.com\/wekan\/wekan\/(?:tree|blob)\/main\/([^)\s#]+)/g)) {
    out.push({ raw: m[0].slice(2), file: path.join(ROOT, m[1]) });
  }
  return out;
}

test('there are docs to check', () => {
  assert.ok(pages.length > 0, 'docs has no .md pages');
});

test('every local path in the docs exists', () => {
  const dead = [];
  for (const page of pages) {
    const source = fs.readFileSync(page, 'utf8');
    for (const target of repoTargets(source, page)) {
      if (!fs.existsSync(target.file)) {
        dead.push(`${path.relative(ROOT, page)} -> ${target.raw}`);
      }
    }
  }
  assert.deepStrictEqual(dead, [],
    'these links point at nothing in the tree:\n  ' + dead.join('\n  '));
});

test('and Directory-Structure.md still describes the whole repository', () => {
  // The failure this page had was not a broken link - it was SILENCE: two
  // thirds of the repository was not mentioned, and nothing said so. Every
  // top-level directory that holds source has to appear somewhere on the page.
  const source = fs.readFileSync(
    path.join(DOCS, 'DeveloperDocs', 'Directory-Structure.md'),
    'utf8',
  );
  const skip = new Set([
    'node_modules', 'public', 'private', 'meta', 'stacksmith', 'secrets',
    'npm-packages', 'scripts', 'tools', 'snap', 'snap-src', 'snap-base-debian',
    'sandstorm-src', 'old-CHANGELOG', 'openapi', 'migrations', 'config',
  ]);
  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'))
    .map(e => e.name)
    .filter(name => !skip.has(name));
  const unmentioned = dirs.filter(name => !source.includes(`${name}/`));
  assert.deepStrictEqual(unmentioned, [],
    `Directory-Structure.md does not mention these directories at all: ${unmentioned.join(', ')}`);
});

console.log(`\ndocsLinksResolve: ${passed} tests passed`);
