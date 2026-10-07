'use strict';

// wekan/wekan#3218: custom URL schemes become links only when an administrator
// lists them (Admin Panel → Features → URL), and never javascript:, data: or
// another scheme that runs or hides content. Run: node tests/urlSchemeAllowlist.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const allowlist = require('../models/lib/urlSchemeAllowlist.js');

const { parseAllowedUrlSchemes, allowedUriRegExp, hrefScheme, NEVER_LINKED } = allowlist;
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const key = 'automatic-linked-url-schemes-hint';
  const schemes = text => (text.match(/\b(?:thunderlink|onenote|javascript|data|vbscript)\b/g) || []).sort();
  const locales = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
    .filter(name => name.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(name))
    .map(name => name.replace(/\.i18n\.json$/, ''));
  assert.ok(locales.length >= 234, 'all non-English locales are discovered');
  for (const code of locales) {
    const locale = JSON.parse(read(`imports/i18n/data/${code}.i18n.json`));
    assert.deepEqual(Object.keys(locale), Object.keys(source), `${code}: source order`);
    assert.ok(locale[key]?.trim(), `${code}: nonempty hint`);
    assert.notEqual(locale[key], source[key], `${code}: translated hint`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), `${code}: source tokens`);
    assert.deepEqual(schemes(locale[key]), schemes(source[key]), `${code}: exact scheme identifiers`);
  }
  const pending = JSON.parse(read('releases/translations/pending-transifex.json'));
  assert.ok(!pending.keys.some(entry => entry.key === key), 'filled hint leaves pending inventory');
  assert.notDeepEqual(schemes('thunderlink onenote javascript data'), schemes(source[key]), 'missing blocked scheme is detected');
  console.log(`  ok - URL scheme hint translations in ${locales.length} locales preserve identifiers`);
  // Parsing: how people write schemes, one per line or separated by commas.
  assert.deepEqual(parseAllowedUrlSchemes('thunderlink\nOneNote:\nfile://, conisio ; x-my-app'),
    ['conisio', 'file', 'onenote', 'thunderlink', 'x-my-app']);
  assert.deepEqual(parseAllowedUrlSchemes('thunderlink\nthunderlink:'), ['thunderlink'], 'duplicates collapse');
  // Off by default.
  for (const empty of [undefined, null, '', '   \n', 42, {}]) assert.deepEqual(parseAllowedUrlSchemes(empty), []);
  // Negative: dangerous, built-in and malformed names never get in.
  assert.deepEqual(parseAllowedUrlSchemes('javascript\nJavaScript:\ndata\nvbscript\nblob\nabout\nview-source'), []);
  assert.deepEqual(parseAllowedUrlSchemes('https\nmailto\nhttp'), [], 'built-ins need no listing');
  assert.deepEqual(parseAllowedUrlSchemes('1abc\n-x\nfoo bar\n<script>\na/b\nthunder_link\n' + 'a'.repeat(33)), ['bar', 'foo']);
  assert.equal(parseAllowedUrlSchemes(Array.from({ length: 80 }, (_, i) => `s${i}`).join('\n')).length, allowlist.MAX_SCHEMES);
  for (const name of NEVER_LINKED) assert.deepEqual(parseAllowedUrlSchemes(name), [], name);
  console.log('  ok - the setting parses to plain scheme names, never a dangerous one');

  // The URI rule: the original allowlist, plus exactly the listed schemes.
  const { allowedUriRegExp: packageRegExp, linkableSchemes } = await import('../packages/markdown/src/secureDOMPurify.js');
  const samples = ['https://wekan.fi', 'mailto:a@b.c', '/relative', '#x', 'thunderlink://msg', 'onenote:x', 'file://srv/a',
    'javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,x', 'vbscript:x', 'x-my-app:y', 'thunderlinkx:y'];
  for (const schemes of [[], ['thunderlink'], ['thunderlink', 'onenote', 'file', 'x-my-app']]) {
    const app = allowedUriRegExp(schemes);
    const pkg = packageRegExp(schemes);
    for (const uri of samples) assert.equal(app.test(uri), pkg.test(uri), `app and package disagree on ${uri} for ${schemes}`);
  }
  const none = allowedUriRegExp([]);
  assert.ok(none.test('https://wekan.fi') && none.test('/relative'));
  assert.ok(!none.test('thunderlink://msg') && !none.test('file://srv/a'), 'nothing custom by default');
  const some = allowedUriRegExp(['thunderlink']);
  assert.ok(some.test('thunderlink://msg') && some.test('THUNDERLINK:msg'));
  assert.ok(!some.test('thunderlinkx:y') && !some.test('onenote:x'), 'only the exact listed scheme');
  // Negative: even if a dangerous name were passed straight in, it is dropped.
  for (const build of [allowedUriRegExp, packageRegExp]) {
    const forced = build(['javascript', 'data', 'vbscript', 'a|b', '.*']);
    assert.ok(!forced.test('javascript:alert(1)') && !forced.test('data:text/html,x') && !forced.test('vbscript:x'));
    assert.ok(!forced.test('zzz:anything'), 'a name cannot inject a pattern');
  }
  assert.deepEqual(linkableSchemes(['thunderlink', 'javascript', 'data', 5, null, 'A B']), ['thunderlink']);
  assert.equal(hrefScheme('  ThunderLink://x'), 'thunderlink');
  assert.equal(hrefScheme('/b/x'), '');
  console.log('  ok - app and package build the same link rule, with only listed schemes added');

  // Both sanitizer passes, with and without the list.
  const window = new JSDOM('').window;
  const { secureSanitize, getSecureDOMPurifyConfig } = await import('../packages/markdown/src/secureDOMPurify.js');
  const purifier = createDOMPurify(window);
  const links = '<a href="thunderlink://msg">t</a><a href="onenote:x">o</a><a href="javascript:alert(1)">j</a><a href="https://wekan.fi">w</a>';
  const hrefs = html => [...new JSDOM(html).window.document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
  assert.deepEqual(hrefs(secureSanitize(purifier, links)), ['https://wekan.fi']);
  assert.deepEqual(hrefs(secureSanitize(purifier, links, getSecureDOMPurifyConfig(['thunderlink']))), ['thunderlink://msg', 'https://wekan.fi']);
  assert.deepEqual(hrefs(secureSanitize(purifier, links, getSecureDOMPurifyConfig(['thunderlink', 'javascript']))),
    ['thunderlink://msg', 'https://wekan.fi'], 'javascript: stays refused');

  const viewerSource = read('imports/lib/secureDOMPurify.js')
    .replace(/^import DOMPurify from 'dompurify';$/m, '')
    .replace(/^import \{ allowedUriRegExp \} from '\/models\/lib\/urlSchemeAllowlist';$/m, '')
    .replace(/^export function /gm, 'function ');
  const viewer = { DOMPurify: createDOMPurify(window), allowedUriRegExp };
  vm.runInNewContext(`${viewerSource}\nthis.sanitizeHTML = sanitizeHTML;`, viewer);
  assert.deepEqual(hrefs(viewer.sanitizeHTML(links)), ['https://wekan.fi']);
  assert.deepEqual(hrefs(viewer.sanitizeHTML(links, { urlSchemes: ['thunderlink', 'onenote'] })),
    ['thunderlink://msg', 'onenote:x', 'https://wekan.fi']);
  assert.deepEqual(hrefs(viewer.sanitizeHTML(links, { urlSchemes: ['thunderlink'], stripLinks: true })), [],
    '"render links as plain text" still wins');
  console.log('  ok - both sanitizer passes link only the listed schemes');

  // Wiring: the setting reaches both passes and the link filter.
  const editor = read('client/components/main/editor.js');
  assert.match(editor, /parseAllowedUrlSchemes\(setting && setting\.automaticLinkedUrlSchemes\)/);
  assert.equal((editor.match(/sanitizeHTML\(content, \{ stripLinks, urlSchemes \}\)/g) || []).length, 2);
  assert.match(editor, /else if \(scheme && !BUILT_IN\.includes\(scheme\)\) \{[\s\S]*?window\.location\.assign\(href\);/);
  const pkg = read('packages/markdown/src/template-integration.js');
  assert.match(pkg, /const urlSchemes = linkableSchemes\(Markdown\.urlSchemes\.get\(\)\);\s*syncLinkifySchemes\(urlSchemes\);/);
  assert.match(pkg, /Markdown\.validateLink = function \(url\) \{\s*if \(defaultValidateLink\.call\(this, url\)\) return true;/);
  assert.match(pkg, /linkifiedSchemes\.includes\(match\[1\]\.toLowerCase\(\)\)/);
  // Negative: no scheme list is hardcoded any more, and the setting has no default.
  assert.doesNotMatch(pkg, /var urlschemes = \[/);
  const settings = read('models/settings.js');
  const field = settings.slice(settings.indexOf('automaticLinkedUrlSchemes: {'), settings.indexOf('automaticLinkedUrlSchemes: {') + 120);
  assert.doesNotMatch(field, /defaultValue/);
  console.log('  ok - the Admin Panel setting drives linkify, validateLink and both sanitizers');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
