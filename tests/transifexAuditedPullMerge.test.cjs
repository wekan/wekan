'use strict';

// Replay every rejected value through the actual pull merge, not a copy of its
// logic. New human values must win; bad/missing snapshots must never revive a
// rejected value. Run: node tests/transifexAuditedPullMerge.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const locale = lang => read(path.join(root, `imports/i18n/data/${lang}.i18n.json`));
const rejected = read(path.join(root, 'releases/translations/rejected-pull-values.json'));
const english = locale('en');
const tokens = value => (value.match(/__[A-Za-z0-9_-]+?__|%(?:\d+\$)?[A-Za-z]/g) || []).sort();
const tempRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tempRoot, { recursive: true });
const fixture = fs.mkdtempSync(path.join(tempRoot, 'audited-pull-'));
const data = path.join(fixture, 'imports/i18n/data');
const before = path.join(fixture, 'before');
fs.mkdirSync(data, { recursive: true });
fs.mkdirSync(before);
const write = (dir, lang, value) => fs.writeFileSync(path.join(dir, `${lang}.i18n.json`), JSON.stringify(value));
write(data, 'en', english);
const pullScript = fs.readFileSync(path.join(root, 'releases/translations/pull-translations.sh'), 'utf8');
assert.match(pullScript, /merge-translations\.mjs --before-dir[\s\S]*repair-audited-translations\.mjs --apply/,
  'normal pulls must reapply existing exact-value audit corrections too');
let cases = 0;
try {
  for (const [lang, bad] of Object.entries(rejected)) {
    const good = locale(lang);
    for (const [key, value] of Object.entries(bad)) {
      assert.notEqual(good[key], value, `${lang}:${key}: rejected text survived repair`);
      // A rejected foreign value may leave an English placeholder while a
      // correct-language translation is still pending.
      assert.deepEqual(tokens(good[key]), tokens(english[key]), `${lang}:${key}: placeholders`);
      cases++;
    }
    write(before, lang, good);
    write(data, lang, { ...good, ...bad });
  }
  // New correct-language text for a rejected key must still win. These also
  // guard against equating shared Latin/Arabic scripts with the wrong language.
  const newer = {
    ay: { 'set-list-width-value': 'Qhanqha (pixels)' },
    've-PP': { 'add-list': 'Ližada uz’ lugetiž' },
    zgh: { 'board-not-found': 'ⵜⴰⴼⵍⵡⵉⵜ ⵓⵔ ⵜⵜⵓⴼⴰ' },
    'fa-IR': { confirm: 'تأیید کنید' },
    pt_PT: { 'due-today': 'Termina hoje' },
    sr: { 'set-list-width': 'Подеси ширину' },
  };
  const run = () => {
    const result = spawnSync(process.execPath,
      [path.join(root, 'releases/translations/merge-translations.mjs'), '--before-dir', before],
      { cwd: fixture, encoding: 'utf8', env: { ...process.env, TMPDIR: tempRoot } });
    assert.equal(result.status, 0, result.stderr);
    return result;
  };
  run();
  for (const [lang, bad] of Object.entries(rejected)) {
    const good = locale(lang);
    const merged = read(path.join(data, `${lang}.i18n.json`));
    for (const key of Object.keys(bad)) assert.equal(merged[key], good[key], `${lang}:${key}: fallback`);
  }
  for (const [lang, values] of Object.entries(newer)) {
    write(before, lang, locale(lang));
    write(data, lang, { ...locale(lang), ...values });
  }
  run();
  for (const [lang, values] of Object.entries(newer)) {
    const merged = read(path.join(data, `${lang}.i18n.json`));
    for (const [key, value] of Object.entries(values)) assert.equal(merged[key], value, `${lang}:${key}: newer human`);
  }
  const lang = 've-PP';
  const bad = rejected[lang];
  // Missing, already-corrupt, malformed-placeholder, and valid fallbacks.
  write(before, lang, {
    'add-card': bad['add-card'],
    'add-board': bad['add-board'],
    'and-n-other-card': 'Da toiž kart',
    'and-n-other-card_plural': locale(lang)['and-n-other-card_plural'],
  });
  write(data, lang, {
    'add-list': bad['add-list'],
    'add-card': bad['add-card'],
    'add-board': english['add-board'],
    'and-n-other-card': bad['and-n-other-card'],
    'and-n-other-card_plural': 'Da __wrong__ kartad',
  });
  const result = run();
  const merged = read(path.join(data, `${lang}.i18n.json`));
  for (const key of ['add-list', 'add-card', 'add-board', 'and-n-other-card']) {
    assert.equal(merged[key], english[key], `${key}: invalid fallback must become an explicit placeholder`);
  }
  assert.equal(merged['and-n-other-card_plural'], locale(lang)['and-n-other-card_plural']);
  assert.match(result.stderr, /3 need translation because no valid local fallback exists/);
  // Locale/key matching does not prohibit the same text in its actual language.
  write(data, 'fi', { 'add-list': 'Lisää lista' });
  write(before, 'fi', { 'add-list': 'Lisää uusi lista' });
  run();
  assert.equal(read(path.join(data, 'fi.i18n.json'))['add-list'], 'Lisää lista');
  // Russian and Mongolian share these established loanwords. Preserve a
  // reviewed Mongolian value even when the Russian resource uses it too.
  write(data, 'ru', { archives: 'Архив', 'text-note-text': 'Текст',
    'custom-field-text': 'Текст', pomodoro: 'Помодоро', 'add-board': 'Добавить доску' });
  write(before, 'mn', { archives: 'Архив', 'text-note-text': 'Текст',
    'custom-field-text': 'Текст', pomodoro: 'Помодоро', 'add-board': 'Добавить доску' });
  write(data, 'mn', { archives: english.archives, 'text-note-text': english['text-note-text'],
    'custom-field-text': english['custom-field-text'], pomodoro: english.pomodoro,
    'add-board': english['add-board'] });
  run();
  const mongolian = read(path.join(data, 'mn.i18n.json'));
  for (const key of ['archives', 'text-note-text', 'custom-field-text', 'pomodoro']) {
    assert.equal(mongolian[key], read(path.join(before, 'mn.i18n.json'))[key], `${key}: Mongolian loanword`);
  }
  assert.equal(mongolian['add-board'], english['add-board'], 'unreviewed Russian seed stays rejected');
  write(before, 'mn', { archives: english.archives });
  write(data, 'mn', { archives: 'Архив' });
  run();
  assert.equal(read(path.join(data, 'mn.i18n.json')).archives, 'Архив',
    'reviewed Mongolian word pulled from Transifex also survives');
  write(data, 'fr', { settings: 'Paramètres', 'add-board': 'Ajouter un tableau' });
  write(before, 'oc', { settings: 'Paramètres', 'add-board': 'Ajouter un tableau' });
  write(data, 'oc', { settings: english.settings, 'add-board': english['add-board'] });
  run();
  const occitan = read(path.join(data, 'oc.i18n.json'));
  assert.equal(occitan.settings, 'Paramètres', 'reviewed shared Occitan word survives');
  assert.equal(occitan['add-board'], english['add-board'], 'unreviewed French seed stays rejected');
  console.log(`Audited pull: ${cases} rejected values restored; newer humans, tokens and invalid/missing fallbacks pass.`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
