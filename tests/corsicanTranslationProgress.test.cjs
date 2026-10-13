// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const corsican = readLocale('co');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'co',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Corsican value stays translated');

assert.deepEqual(Object.keys(corsican), Object.keys(english),
  'Corsican key inventory and order match English');
for (const [key, value] of Object.entries(corsican)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(corsican.add, 'Aghjunghje');
assert.equal(corsican.board, 'Tavula');
assert.equal(corsican.card, 'Carta');
assert.equal(corsican.delete, 'Squassà');
assert.equal(corsican.save, 'Arregistrà');
assert.match(corsican['board-members-same-org-only'], /urganizazione/i);
assert.deepEqual(tokens(corsican['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(corsican['activity-changedTitle']), ['%s', '%s']);



// Newer linked-card features are outside the historical completed-catalog gate.
const cardLinkKeys = Object.keys(english).filter(key => /^(?:attach-card(?:-|$)|attachCardPopup-title$|attached-card-unavailable$|detach-card$|custom-field-link|custom-field-unlink$|field-link-|cardCustomFieldLinksPopup-title$)/.test(key));
assert.equal(cardLinkKeys.length, 30);
for (const key of cardLinkKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: no English fallback`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['custom-field-links-hint'], /listessu nome è tippu/);
assert.match(corsican['custom-field-links-hint'], /una sola carta fermanu senza cambiamentu/);
assert.match(corsican['custom-field-link-both'], /duie direzzioni/);
assert.match(corsican['custom-field-link-send'], /una sola direzzione.*carta principale/);
assert.match(corsican['custom-field-link-sends'], /sta carta.*quella carta/);
assert.match(corsican['custom-field-link-receives'], /quella carta.*sta carta/);
assert.match(corsican['field-link-not-allowed'], /mudificà e duie carte/);
assert.doesNotMatch(corsican['field-link-not-allowed'], /vede e duie carte/);
assert.match(corsican['custom-field-link-inactive'], /ùn pò più mudificà.*archiviata/);
assert.match(corsican['attach-card-not-found'], /nisuna carta chì pudete vede/);
assert.match(corsican['field-link-self'], /ùn pò micca.*ella stessa/);
assert.match(corsican['field-link-archived'], /archiviata ùn pò micca/);



const recoveryKeys = Object.keys(english).filter(key => /^(stuck-sync-operation-|interrupted-import-)/.test(key));
assert.equal(recoveryKeys.length, 48);
for (const key of recoveryKeys) {
  assert.notEqual(corsican[key], english[key], `${key}: recovery message translated`);
  assert.deepEqual(tokens(corsican[key]), tokens(english[key]), key);
}
assert.match(corsican['stuck-sync-operation-description'], /cambiamenti digià appiicati fermanu/);
assert.match(corsican['stuck-sync-operation-description'], /ùn seranu mai scritti/);
assert.match(corsican['stuck-sync-operation-description'], /paragunerà torna a lista cù a so fonte/);
assert.match(corsican['stuck-sync-operation-replayable'], /ùn hè micca stata abbandunata/);
assert.match(corsican['stuck-sync-operation-not-stuck'], /ùn pò micca esse abbandunata/);
assert.match(corsican['interrupted-import-description'], /schedariu fonte ùn hè micca cunservatu/);
assert.match(corsican['interrupted-import-description'], /ancu ciò chì ci hè statu aghjuntu dopu/);
assert.match(corsican['interrupted-import-keep-confirm'], /Nunda hè squassatu/);
assert.doesNotMatch(corsican['interrupted-import-keep-confirm'], /squassati definitivamente/);
assert.match(corsican['interrupted-import-discard-confirm'], /tuttu ciò ch'ella cuntene sò squassati definitivamente/);
assert.match(corsican['interrupted-import-foreign-board'], /ùn hè micca stata mudificata/);

console.log('corsicanTranslationProgress: historical catalog, card-link and recovery checks passed');
