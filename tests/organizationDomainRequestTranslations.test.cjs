'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, `${code}.i18n.json`), 'utf8'));
const english = read('en');
const keys = ['org-domains-requested', 'org-domains-request-saved',
  'error-org-domain-reserved', 'act-editCard'];
const codes = fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json'))
  .map(file => file.replace('.i18n.json', ''));

for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    const value = locale[key];
    assert.ok(value?.trim(), `${code}:${key}: nonempty`);
    assert.deepEqual(translationTokens(value), translationTokens(english[key]), `${code}:${key}: tokens`);
    if (/^en(?:[-_]|$)/.test(code)) {
      assert.equal(value, english[key], `${code}:${key}: English regional source`);
    } else {
      assert.notEqual(value, english[key], `${code}:${key}: translated`);
      assert.doesNotMatch(value, /Requested by|waiting for a site|edited card|Faka-Tonga:|Wolayttatto:|Kay willaymi:/,
        `${code}:${key}: no English prose behind a language label`);
    }
  }
  assert.notEqual(locale[keys[0]], locale[keys[1]], `${code}: request status and saved notice differ`);
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: saved notice and reserved-domain refusal differ`);
  assert.match(locale[keys[2]], /WeKan/, `${code}: reserved domain belongs to this installation`);
}

// Preserve the organization/site administrator distinction and pending state.
assert.match(read('fi')[keys[0]], /organisaation ylläpitäjän.*odottavat sivuston ylläpitäjän/);
assert.match(read('de')[keys[0]], /Organisation.*Website-Administrator.*steht noch aus/);
assert.match(read('fr')[keys[0]], /organisation.*en attente.*site/);
assert.match(read('ja')[keys[0]], /組織.*サイト管理者.*待/);
assert.match(read('pt-BR')[keys[1]], /salvos.*solicitação/);
assert.match(read('pt-PT')[keys[1]], /guardados.*pedido/);

// Technical terminology in these composed translations needs native review.
// Prevent the known wrong-language seeds from being copied into this batch.
for (const code of ['chr', 'zgh', 'iu']) {
  const script = { chr: /\p{Script=Cherokee}/u, zgh: /\p{Script=Tifinagh}/u,
    iu: /\p{Script=Canadian_Aboriginal}/u }[code];
  for (const key of keys) {
    const value = read(code)[key].replace(/__card__|WeKan/g, '');
    assert.match(value, script, `${code}:${key}: declared script`);
    assert.doesNotMatch(value, /[A-Za-z]/, `${code}:${key}: no unrelated Latin prose`);
  }
}
assert.match(read('ve-CC')[keys[1]], /i xe stà salvài/, 'Venetian, not the legacy Venda seed');
assert.match(read('ve-PP')[keys[1]], /oma kaičetud/, 'Veps, not the legacy Venda seed');
assert.match(read('wa-RR')[keys[1]], /gintipigan/, 'Waray, not the legacy Walloon seed');
assert.match(read('tig')[keys[2]], /ኢቀድር/, 'Tigre negation, not a copied Tigrinya sentence');
assert.match(read('wal')[keys[3]], /laammiis/, 'Wolaytta change verb');
assert.match(read('tlh')[keys[0]], /tlhobta'.*loS/, 'Klingon request and waiting clauses');
console.log(`Organization domain requests and card-edit activity: ${codes.length} locale catalogs passed`);
