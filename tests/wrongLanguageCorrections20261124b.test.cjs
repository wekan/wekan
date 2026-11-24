'use strict';

// 2026-11-24, second pass: the wrong-language and wrong-meaning words the help
// text and compliance translators reported (TODO.md), corrected in the
// language each locale tag names (CLAUDE.md: "A locale file must contain its
// declared language"). Each line below is one reported fault that must not
// come back. Search operator words (operator-*, predicate-*) and date formats
// were deliberately left as they were: people type them, and changing them
// would change what a search or a date means.
// Run: node --test tests/wrongLanguageCorrections20261124b.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = tag => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data', `${tag}.i18n.json`), 'utf8'));
const en = read('en');
const values = (tag, filter = () => true) => Object.entries(read(tag)).filter(([k]) => filter(k) && !/^(operator|predicate)-/.test(k));
const none = (tag, re, filter) => values(tag, filter).filter(([, v]) => re.test(v)).map(([k]) => k);

test('each reported fault is gone', () => {
  assert.deepEqual(none('lv', /[ąęėįų]/), [], 'Latvian has no Lithuanian letters');
  assert.deepEqual(none('et-EE', /(?<!sisse)juhatus/i), [], 'Estonian: a board is not a management board');
  assert.deepEqual(none('sr', /(?<!\p{L})(списи|Управа|предмет)(?!\p{L})/iu), [], 'Serbian: board, card and Admin Panel');
  assert.deepEqual(none('mk', /(^|\s)(Хора|Наблюдавай|Имейл|Разпределена от|Поискан от)(\s|$)/), [], 'Macedonian is not Bulgarian');
  assert.deepEqual(none('lb', /(?<!\p{L})(importieren|exportieren|aktivieren|deaktivieren|kopieren|markieren|archivieren)(?!\p{L})|ß/iu), [], 'Luxembourgish is not German');
  assert.notEqual(read('nb')['impersonate-user'], 'Anonymiser Bruker');
  assert.doesNotMatch(read('ka').impersonationReportTitle, /impersonation/i);
  assert.doesNotMatch(read('lg').impersonationReportTitle, /Impersonation/);
  for (const tag of ['scn', 'nap']) assert.deepEqual(none(tag, /^(Accedi|Esporta)$/), [], `${tag} is not Italian`);
  assert.deepEqual(none('ve-CC', /Thumela|Ngena/), [], 'Venetian is not Zulu');
  // ve-PP's 'Ve' (export) and 'To' (import) are the native MediaWiki Veps
  // words (tests/vepsMediaWikiTerms.test.cjs), not a fault: kept.
  assert.deepEqual(none('mt', /Bord Ara/), [], 'Maltese board view');
  assert.deepEqual(none('pt-BR', /Administrador/, k => /assign/.test(k)), [], 'an assignee is not an administrator');
  assert.deepEqual(none('tl', /Talaan Sa/), []);
  assert.deepEqual(none('wa-RR', /Sum_od/), []);
  assert.deepEqual(none('vi-VN', /Sejarah/), [], 'Vietnamese is not Malay');
  assert.deepEqual(none('pa', /ਤੈਰਾਕ/), [], 'Punjabi: a swimlane is not swimming');
  assert.deepEqual(none('or_IN', /ସନ୍ତରଣ|ପହଁରିବା/), [], 'Odia: a swimlane is not swimming');
  assert.doesNotMatch(read('or_IN')['admin-panel'], /\|/);
  assert.deepEqual(none('yo', /(^|\s)[Ọọ]kọ(\s|$)/, k => /board/.test(k)), [], 'Yoruba: a board is not a vehicle');
  assert.deepEqual(none('yo', /ọkọ oju-omi|[Oo]ko odo/), [], 'Yoruba: a swimlane is not a boat');
  assert.doesNotMatch(read('so')['recurring'] || read('so')['card-recurrence'] || '', /Dib-u-dejin otomaatig/);
});

// Third pass, 2026-11-24 (TODO.md wrong-language list): Shona and Maltese
// help texts that were word-by-word half English, Odia values garbled by a
// machine translation (English words inside split Odia words, "|" for the
// danda), Luxembourgish whiteboard named two ways, Serbian All Boards named
// three ways, and Spanish search help in Venetian.
const prose = v => v.replace(/`[^`]*`|'[^']*'|"[^"]*"|«[^»]*»|„[^“”]*[“”]|https?:\S+|<[^>]+>/g, ' ');
const englishProse = /(?<!\p{L})(the|when|will|you|your|which|there|are|only|been)(?!\p{L})/u;
test('third pass: each reported fault is gone', () => {
  for (const tag of ['sn', 'mt']) {
    assert.deepEqual(values(tag).filter(([, v]) => englishProse.test(prose(v))).map(([k]) => k), [], `${tag} has no half-English prose`);
  }
  assert.deepEqual(none('mt', /(?<!\p{L})[Kk]ards?(?!\p{L})/u), [], 'Maltese: a card is karta, not kard');
  assert.deepEqual(none('sn', /mukoto/i), [], 'Shona: a swimlane is mugwagwa everywhere');
  assert.deepEqual(none('or_IN', /[଀-୿] [A-Za-z]+ [଼ା-୍୕-ୗ]|କ [A-Za-z]+ ଣସି/u), [], 'Odia: no English word inside a split Odia word');
  assert.deepEqual(none('or_IN', /(^|[^|\s])\s+\|(?!\|)(\s|$)|\u200B/u), [], 'Odia: the danda is ।, not |, and no stray zero-width spaces');
  assert.equal(read('lb').whiteboard, 'Wäisstafel');
  assert.deepEqual(none('lb', /whiteboard|(?<!\p{L})Tafel(?!\p{L})/iu, k => /^whiteboard/.test(k)), [], 'Luxembourgish: one whiteboard word, distinct from the board (Tafel)');
  assert.equal(read('sr')['all-boards'], 'Све табле');
  assert.deepEqual(none('sr', /Полиц[аеиу] са таблама|пословне књиге/u), [], 'Serbian: All Boards is Све табле everywhere');
  assert.deepEqual(none('ve-CC', /tarjeta|tablero|(?<!\p{L})(las|los|todas|vencen)(?!\p{L})/iu), [], 'Venetian is not Spanish');
});

test('every corrected locale keeps English\'s placeholders in every value', () => {
  const tok = v => (String(v).match(/__[A-Za-z0-9_]+__|%(?:\d+\$)?[sd]/g) || []).sort().join(',');
  for (const tag of ['lv', 'et-EE', 'se', 'sr', 'mk', 'lb', 'nb', 'ka', 'rup', 've-CC', 've-PP', 'mt', 'pt-BR', 'tl', 'wa-RR', 'vi-VN', 'scn', 'nap', 'sn', 'so', 'ps', 'sd', 'pa', 'or_IN', 'yo', 'lg']) {
    const data = read(tag);
    const bad = Object.keys(en).filter(k => typeof data[k] === 'string' && tok(data[k]) !== tok(en[k]));
    assert.deepEqual(bad, [], tag);
  }
});

test('search keywords and date formats were left as they were', () => {
  for (const tag of ['lv', 'lb', 'sr', 'mk', 'scn', 'nap', 'rup', 've-CC', 'pt-BR']) {
    const data = read(tag);
    for (const k of Object.keys(en).filter(key => /YYYY|MM|DD/.test(en[key]))) {
      if (data[k]) assert.doesNotMatch(data[k], /GGGG/, `${tag} ${k}`);
    }
  }
});
