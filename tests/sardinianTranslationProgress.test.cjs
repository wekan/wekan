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
const sardinian = readLocale('sc');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'sc',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
// The earlier magenta uncertainty was resolved with attested Sardinian
// "fùcsia" in commit 04711b646. No English-valued gaps remain.
assert.deepEqual(JSON.parse(fillResult.stdout), {},
  'Sardinian now has no remaining English-valued gaps');
assert.equal(sardinian['color-magenta'], 'fùcsia');

for (const [key, value] of Object.entries(sardinian)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

// Agiunghe is the newer local Sardinian add form (also used by sc.wiktionary.org).
// Preserve valid wording alongside the repaired colour term.
assert.equal(sardinian.add, 'Agiunghe');
assert.equal(sardinian.board, 'Tàula');
assert.equal(sardinian.card, 'Carta');
assert.equal(sardinian.save, 'Sarvare');
assert.match(sardinian['board-members-same-org-only'], /organizatzione/i);
assert.deepEqual(tokens(sardinian['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(sardinian['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tags(sardinian['board-private-info']), ['</strong>', '<strong>']);

// Sardinian (sc) must be Sardinian, not Italian. Many values were Italian or
// Italian/Sardinian mixtures ("Il monitoraggio ... è disattivadu dall'..."),
// which are not translations for this locale. Pin the repaired values and
// scan every value for words that exist in Italian but not in Sardinian.
assert.equal(sardinian.cancel, 'Annulla'); // annullare is Sardinian (LSC) too
assert.equal(sardinian['error-username-taken'],
  'Custu nùmene de utente est giai impreadu');
assert.match(sardinian['error-watch-disabled'], /^S'amministradore at disativadu/);
assert.equal(sardinian['account-creation-failed'],
  'Impossìbile creare su contu');
assert.equal(sardinian['r-when-a-card'], 'Cando una carta');

const italianOnly = /(?<![\p{L}'’])(il|gli|della|delle|dei|degli|dello|dall|dalla|nel|nella|nelle|è|già|sono|questo|questa|questi|queste|perché|può|puoi|nessun|nessuna|più|sei|sicuro|verranno|saranno|quando|dopo|impostazioni|scheda|bacheca|elimina|aggiungi|nascondi|chiudi|caricamento)(?![\p{L}'’])/iu;
const italianLeft = Object.entries(sardinian)
  .filter(([key, value]) => value !== english[key] && italianOnly.test(value))
  .map(([key, value]) => `${key}: ${value}`);
assert.deepEqual(italianLeft, [], 'no Italian-only words remain in sc');

// Negative: the detector really finds the Italian that used to be here.
assert.ok(italianOnly.test("Il monitoraggio di tàulas e cartas è disattivadu dall'amministradore"));
assert.ok(italianOnly.test('Custu username è già utilizzadu'));
assert.ok(!italianOnly.test(sardinian['error-watch-disabled']));
console.log('Sardinian: placeholders, tags and no Italian-only words pass');
