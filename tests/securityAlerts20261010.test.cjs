'use strict';

// The GitHub code scanning and Dependabot alerts of 2026-10-10, each pinned
// where it was reported AND as a shape that must not exist anywhere else.
// Run: node tests/securityAlerts20261010.test.cjs
//
//   #555  models/lib/planeFormat.js: a Markdown link title escaped [ and ] but
//         not backslash, and its URL went through encodeURIComponent, which
//         leaves ( and ) alone. ClickUp, Super Productivity and Vikunja built
//         their links the same way. All four now use models/lib/markdownLink.js.
//   #554  tests/importExportDocsCoverage.test.cjs: replace(/ /g, ' ') replaced a
//         space with itself where an escape for the regular expression was meant.
//         tests/noIdentityReplacement.test.cjs now finds that regex form too.
//   #556  npm-packages/exceljs/lib/utils/col-cache.js: decodeEx split the sheet
//         name with a backtracking regular expression over a workbook's text.
//   #557, #558  npm-packages/exceljs/spec/manual/public/*.html loaded a CDN
//         script without Subresource Integrity.
//   Dependabot #137-#142  brace-expansion 5.0.6 in npm-packages/exceljs (and in
//         the vendored jade's dev tools): six denial-of-service advisories,
//         fixed in 5.0.12.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const tracked = pattern => execFileSync('git', ['ls-files', '-z', '--', pattern], { cwd: ROOT, encoding: 'utf8' })
  .split('\0').filter(Boolean).filter(file => fs.existsSync(path.join(ROOT, file)));

async function main() {
  const { markdownLink, markdownLinkTitle, markdownLinkUrl } = await import('../models/lib/markdownLink.js');
  const MarkdownIt = require('markdown-it');
  const md = new MarkdownIt();
  const tests = [];
  const test = (name, fn) => tests.push([name, fn]);

  test('a link title cannot escape its brackets, a URL cannot end its link early', () => {
    assert.equal(markdownLinkTitle('evil\\'), 'evil\\\\');
    assert.equal(markdownLinkTitle('[x]'), '\\[x\\]');
    assert.equal(markdownLinkUrl('https://e.example/a)b c<d>\\e\nf'), 'https://e.example/a%29b%20c%3Cd%3E%5Ce%0Af');
    assert.equal(markdownLinkUrl('https://e.example/ä\u00a0x'), 'https://e.example/ä%C2%A0x');
    // What markdown-it makes of it: ONE link, with the whole URL and title.
    for (const [title, url] of [['evil\\', 'https://e.example/a)b'], ['a](javascript:alert(1))', 'https://e.example/'],
      ['t', 'https://e.example/x) [y](https://other.example/']]) {
      const html = md.renderInline(markdownLink(title, url));
      assert.equal((html.match(/<a /g) || []).length, 1, html);
      // Text in the title stays text, and the URL stays one URL: the only
      // href is the one given, on its own host.
      const href = /href="([^"]*)"/.exec(html)[1];
      assert.equal(new URL(href).hostname, 'e.example', html);
      assert.equal(decodeURIComponent(href), url, html);
    }
  });

  test('negative: the old escaping, before the fix, let the URL out', () => {
    // What the old code wrote for the title "t" and the URL
    // "https://e.example/x) [y](https://other.example/": encodeURIComponent
    // turned the space into %20 and left the parentheses. Written out rather
    // than re-implemented, so the incomplete escaping is not code in the tree
    // again (CodeQL alert 559 was this test re-running it).
    const oldMarkdown = '[t](https://e.example/x)%20[y](https://other.example/)';
    const html = md.renderInline(oldMarkdown);
    assert.equal((html.match(/<a /g) || []).length, 2, 'the reported fault is real: the link ended at the ")"');
    assert.match(html, /href="https:\/\/other\.example\/"/);
  });

  test('Plane, ClickUp, Super Productivity and Vikunja write links through the helper', async () => {
    const { parsePlaneExport } = await import('../models/lib/planeFormat.js');
    const plane = parsePlaneExport([{ project_name: 'P', project_identifier: 'P', name: 'Task', state_name: 'Todo',
      sequence_id: 1, links: [{ title: 'evil\\', url: 'https://e.example/a)b' }] }]);
    assert.match(plane.tasks[0].description, /- \[evil\\\\\]\(https:\/\/e\.example\/a%29b\)/);
    const { vikunjaHtmlToText } = await import('../models/lib/vikunjaFormat.js');
    const { text } = vikunjaHtmlToText('<p><a href="https://e.example/a)b">x</a> <img src="https://e.example/i)j" alt="a]b"></p>');
    assert.match(text, /\]\(https:\/\/e\.example\/a%29b\)/);
    assert.match(text, /!\[a\\\]b\]\(https:\/\/e\.example\/i%29j\)/);
    for (const file of ['models/lib/planeFormat.js', 'models/lib/clickupCsvFormat.js', 'models/lib/superProductivityFormat.js',
      'models/lib/vikunjaFormat.js']) {
      assert.match(read(file), /from '\.\/markdownLink\.js'/, file);
    }
  });

  test('negative: no code builds a link with the incomplete escaping', () => {
    // tests/ too: code scanning reads the tests, and alert 559 was a test
    // re-running the old escaping to show it was wrong.
    const files = tracked('models').concat(tracked('server'), tracked('client'), tracked('imports'), tracked('tests'))
      .filter(file => /\.(c|m)?js$/.test(file) && !file.includes('/node_modules/'));
    for (const file of files) {
      const source = read(file);
      assert.doesNotMatch(source, /replace\(\/\[\(\)\\s\]\/g, encodeURIComponent\)/, `${file}: encodeURIComponent leaves ( and ) as they are`);
      assert.doesNotMatch(source, /\.replace\(\/\[\[\\\]\]\/g, '\\\\\$&'\)/, `${file}: a title escape without backslash`);
    }
  });

  test('ExcelJS reads a sheet name in linear time, as the expression it replaced', () => {
    const colCache = require(path.join(ROOT, 'npm-packages/exceljs/lib/utils/col-cache.js'));
    const old = value => {
      const g = value.match(/(?:(?:(?:'((?:[^']|'')*)')|([^'^ !]*))!)?(.*)/);
      return { sheetName: g[1] || g[2], reference: g[3] };
    };
    const alphabet = ["'", '!', 'a', ' ', '^', '$', '1'];
    for (let n = 0; n < 20000; n += 1) {
      let value = '';
      for (let i = 0, length = (n * 7) % 11; i < length; i += 1) value += alphabet[(n * 31 + i * 17 + (n >> i)) % alphabet.length];
      assert.deepEqual(colCache.splitSheetName(value), old(value), JSON.stringify(value));
    }
    const start = Date.now();
    colCache.splitSheetName('a'.repeat(2000000));
    colCache.splitSheetName(`'${"''".repeat(1000000)}`);
    assert.ok(Date.now() - start < 1000, 'linear, not polynomial');
    assert.ok(!read('npm-packages/exceljs/lib/utils/col-cache.js').includes("[^'^ !]*"), 'negative: the expression is gone');
    // The vendored copy and the fork it comes from say the same thing.
    const fork = path.join(ROOT, '.tools/exceljs/lib/utils/col-cache.js');
    if (fs.existsSync(fork)) assert.equal(fs.readFileSync(fork, 'utf8'), read('npm-packages/exceljs/lib/utils/col-cache.js'));
  });

  test('negative: no tracked page loads an external script without integrity', () => {
    for (const file of tracked('*.html').concat(tracked('*.htm'), tracked('*.jade'))) {
      for (const tag of read(file).match(/<script\b[^>]*\bsrc=["']https?:[^>]*>/gi) || []) {
        assert.match(tag, /\bintegrity=["']sha(256|384|512)-/, `${file}: ${tag}`);
        assert.match(tag, /\bcrossorigin=/, `${file}: ${tag}`);
      }
    }
  });

  test('negative: no tracked lockfile pins a vulnerable brace-expansion', () => {
    // Fixed in 5.0.12; the advisories cover 3.0.0 up to it. 1.x and 2.x are
    // other lines, outside every one of the six.
    const vulnerable = version => {
      const [major, minor, patch] = version.split('.').map(Number);
      return major >= 3 && (major < 5 || (major === 5 && minor === 0 && patch < 12));
    };
    const locks = tracked('*package-lock.json').filter(file => !file.startsWith('.tools/'));
    assert.ok(locks.includes('npm-packages/exceljs/package-lock.json'));
    for (const file of locks) {
      const packages = JSON.parse(read(file)).packages || {};
      for (const [where, entry] of Object.entries(packages)) {
        if (!/(^|\/)node_modules\/brace-expansion$/.test(where)) continue;
        assert.ok(!vulnerable(entry.version), `${file}: ${where} ${entry.version}`);
      }
    }
  });

  let passed = 0;
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nsecurityAlerts20261010: ${passed} tests passed`);
}

console.log('securityAlerts20261010:');
main().catch(error => { console.error(error); process.exit(1); });
