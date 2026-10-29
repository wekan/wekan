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

  // Operating-system handlers with a code-execution history are never linked,
  // even when an administrator lists them (Follina's ms-msdt:, search-ms:,
  // the 2026 Edge full chain's telnet: ...).
  const { OS_HANDLERS, handlerLinkSchemes } = allowlist;
  assert.deepEqual([...OS_HANDLERS].sort(), ['ms-appinstaller', 'ms-cxh', 'ms-cxh-full', 'ms-msdt', 'ms-officecmd',
    'search', 'search-ms', 'telnet']);
  for (const name of OS_HANDLERS) assert.ok(NEVER_LINKED.has(name), name);
  assert.deepEqual(parseAllowedUrlSchemes(OS_HANDLERS.join('\n') + '\nMS-MSDT:\ntelnet://\nthunderlink'), ['thunderlink']);
  assert.deepEqual(linkableSchemes([...NEVER_LINKED]), [], 'the package copy refuses every scheme the app refuses');
  const packageList = read('packages/markdown/src/secureDOMPurify.js').match(/const NEVER_LINKED = \[([\s\S]*?)\];/)[1]
    .match(/'([^']+)'/g).map(name => name.slice(1, -1)).sort();
  assert.deepEqual(packageList, [...NEVER_LINKED].sort(), 'the two NEVER_LINKED lists are identical');
  const handlerHtml = OS_HANDLERS.map(name => `<a href="${name}:x">${name}</a>`).join('') + '<a href="thunderlink://m">t</a>';
  const everything = [...OS_HANDLERS, 'thunderlink'];
  assert.deepEqual(hrefs(secureSanitize(purifier, handlerHtml, getSecureDOMPurifyConfig(everything))), ['thunderlink://m'],
    'listing them changes nothing');
  for (const build of [allowedUriRegExp, packageRegExp]) {
    const rule = build(everything);
    for (const name of OS_HANDLERS) assert.ok(!rule.test(`${name}:x`) && !rule.test(`${name.toUpperCase()}:x`), name);
  }
  console.log('  ok - OS handlers with a code-execution history are never linked, listed or not');

  // The detector behind Admin Panel -> Problems: a LINK to one is an attempt.
  assert.deepEqual(handlerLinkSchemes('[open](ms-msdt:/id PCWDiagnostic /skip force)'), ['ms-msdt']);
  assert.deepEqual(handlerLinkSchemes('[x]( <ms-appinstaller:?source=https://e/x.appx>)'), ['ms-appinstaller']);
  assert.deepEqual(handlerLinkSchemes('see <search-ms:query=x&crumb=location:\\\\e\\s>'), ['search-ms']);
  assert.deepEqual(handlerLinkSchemes('<a href="TELNET://host">t</a> <img src=\'ms-officecmd:{}\'>'), ['ms-officecmd', 'telnet']);
  assert.deepEqual(handlerLinkSchemes('[r]: search:query=x\n\n[go][r]'), ['search']);
  // Negative: prose, a URL that only contains the word, and ordinary links.
  for (const text of ['ms-msdt: Follina was CVE-2022-30190', 'search: the box at the top', '[x](https://e/ms-msdt:)',
    '[x](mailto:a@b.c) [y](thunderlink://m)', '', null, 42]) {
    assert.deepEqual(handlerLinkSchemes(text), [], String(text));
  }
  assert.deepEqual(handlerLinkSchemes('a'.repeat(250000) + '[x](ms-msdt:y)'), [], 'only the first 200000 characters');
  console.log('  ok - a link to one is detected; the word in prose is not');

  // Wiring of the detector: four kinds of card text, only what a write adds,
  // silent, and never able to break the write.
  const canary = read('server/lib/handlerLinkCanary.js');
  for (const [where, field] of [['card', "'title', 'description'"], ['comment', "'text'"], ['checklist', "'title'"],
    ['checklist item', "'title'"]]) {
    assert.ok(canary.includes(`['${where}', `) && canary.includes(`[${field}]`), where);
  }
  assert.match(canary, /collection\.before\.insert\(/);
  assert.match(canary, /collection\.before\.update\(/);
  assert.match(canary, /tripCanary\('sanitize\.handler-link'/);
  assert.match(canary, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.doesNotMatch(canary, /throw |doc\[[^\]]+\]\s*=[^=]|modifier\.\$set\[[^\]]+\]\s*=[^=]/, 'it changes nothing it is given');
  assert.match(read('server/imports.js'), /^import '\/server\/lib\/handlerLinkCanary';$/m);
  const added = (before, after) => {
    const had = new Set(handlerLinkSchemes(before));
    return handlerLinkSchemes(after).filter(scheme => !had.has(scheme));
  };
  assert.match(canary, /const had = new Set\(handlerLinkSchemes\(before\)\);\n  return handlerLinkSchemes\(after\)\.filter\(scheme => !had\.has\(scheme\)\);/);
  assert.deepEqual(added('', '[x](telnet://h)'), ['telnet']);
  assert.deepEqual(added('[x](telnet://h)', '[x](telnet://h) and more text'), [], 'editing an old card records nothing');
  assert.deepEqual(added('[x](telnet://h)', '[x](telnet://h) [y](ms-msdt:z)'), ['ms-msdt']);
  console.log('  ok - Problems sees a link a write adds, in cards, comments and checklists');

  // Wiring: the setting reaches both passes and the link filter.
  const editor = read('client/components/main/editor.js');
  assert.match(editor, /parseAllowedUrlSchemes\(setting && setting\.automaticLinkedUrlSchemes\)/);
  assert.equal((editor.match(/sanitizeHTML\(content, \{ stripLinks, urlSchemes \}\)/g) || []).length, 2);
  assert.match(editor, /else if \(scheme && !BUILT_IN\.includes\(scheme\)\) \{[\s\S]*?window\.location\.assign\(href\);/);
  // Negative: a never-linked scheme is refused at the click too, BEFORE the
  // branch that hands a custom scheme to its application.
  assert.ok(editor.indexOf('} else if (NEVER_LINKED.has(scheme)) {') > 0);
  assert.ok(editor.indexOf('} else if (NEVER_LINKED.has(scheme)) {') < editor.indexOf('window.location.assign(href)'));
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
