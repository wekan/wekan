// Cover the full current Urdu fill list, including pending feature strings.
// An empty inventory does not certify every existing sentence.
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
const urdu = readLocale('ur');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'ur',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Urdu value stays translated');

for (const [key, value] of Object.entries(urdu)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(urdu.accept, 'قبول کریں');
assert.equal(urdu['select-none'], 'کچھ بھی منتخب نہ کریں');
assert.match(urdu['enable-permanent-delete'], /مستقل حذف/);
assert.deepEqual(tokens(urdu['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(urdu['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('urduTranslationProgress: current inventory and structural checks passed');

assert.match(urdu['custom-field-links-hint'], /ایک ہی نام اور قسم/);
assert.match(urdu['custom-field-links-hint'], /صرف ایک کارڈ پر موجود خانے نہیں بدلے جاتے/);
assert.match(urdu['custom-field-link-send'], /اس کارڈ کی تبدیلیاں مرکزی کارڈ پر/);
assert.match(urdu['custom-field-link-receives'], /اُس کارڈ کی تبدیلیاں اس کارڈ پر/);
assert.match(urdu['field-link-not-allowed'], /دونوں کارڈوں میں ترمیم کی اجازت/);
assert.match(urdu['read-only-field'], /ہر رکن.*صرف بورڈ کے منتظمین/);
assert.match(urdu['notification-delivery-quiet'], /ختم ہونے تک انتظار/);
assert.match(urdu['webhook-payload-description'], /وراثت میں ملی ترتیب برقرار/);
assert.match(urdu['stuck-sync-operation-discard-confirm'], /پہلے سے لاگو تبدیلیاں برقرار رہیں گی/);
assert.match(urdu['stuck-sync-operation-discard-confirm'], /باقی کبھی نہیں لکھی جائیں گی/);
assert.match(urdu['stuck-sync-operation-not-stuck'], /ترک نہیں کیا جا سکتا/);
assert.match(urdu['stuck-sync-operation-replayable'], /خود مکمل ہو جائے گی.*ترک نہیں کیا گیا/);
assert.match(urdu['interrupted-import-description'], /جاری نہیں رکھی جا سکتی کیونکہ اصل فائل محفوظ نہیں رکھی جاتی/);
assert.match(urdu['interrupted-import-description'], /بعد میں شامل کی گئیں/);
assert.match(urdu['interrupted-import-keep-confirm'], /کچھ بھی نہیں ہٹایا جائے گا/);
assert.match(urdu['interrupted-import-discard-confirm'], /سب کچھ مستقل طور پر ہٹا دیا جائے گا/);
assert.match(urdu['interrupted-import-foreign-board'], /نہیں بنایا.*نہیں بدلا گیا/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(urdu[key], /سب سے پرانی 50/);
for (const format of ['taiga', 'vikunja', 'notion']) assert.match(urdu['import-board-instruction-' + format], /منسلکات درآمد نہیں ہوتے/);
assert.match(urdu['import-board-instruction-quire'], /تبصرے اور منسلکات نہیں ہوتے/);
assert.match(urdu['import-board-instruction-plane'], /وضاحتیں یا منسلکات نہیں ہوتے.*درآمد نہیں ہوتے/);
for (const format of ['nullboard', 'kanri']) assert.match(urdu['import-board-instruction-' + format], /پہلا بورڈ درآمد/);
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(urdu['import-board-instruction-orgmode'].includes(literal));
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) {
  assert.ok(urdu['import-board-instruction-teamwork'].includes(literal));
}
assert.match(urdu['import-board-instruction-businessmap'], /عنوانات والی قطار انگریزی میں بدلیں/);
assert.match(urdu['import-board-instruction-redmine'], /My account میں زبان English/);
assert.match(urdu['import-many-boards-hint'], /اراکین کی مطابقت کے بغیر/);
assert.match(urdu['import-many-boards-hint'], /اوپر کے خانے کی بجائے/);
assert.match(urdu['r-wrike-workflow-note'], /Completed یا Cancelled.*مکمل.*Active یا Deferred.*نامکمل/);
for (const literal of ['GET /workflows', 'JSON']) assert.ok(urdu['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(urdu['ldap-sync-now-nothing'].includes(literal));
assert.ok(urdu['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(urdu['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(urdu['login-setting-env-only'], /صرف سرور کے ماحول.*صرف پڑھنے/);
assert.ok(urdu['trello-export-desc'].includes('Swimlane: …'));
assert.match(urdu['trello-export-desc'], /دوبارہ لین میں بدل دیتی ہے/);
assert.match(urdu['trello-export-warnings'], /سب کچھ برآمد نہیں ہو سکا/);
assert.match(urdu['sandstorm-trello-access-needed'], /رسائی حاصل نہیں ہوتی.*پہلے.*اجازت/);
assert.match(urdu['sandstorm-trello-access-granted'], /رسائی حاصل کر سکتا ہے/);
assert.notEqual(urdu['sandstorm-trello-access-needed'], urdu['sandstorm-trello-access-granted']);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepEqual(Object.keys(urdu), Object.keys(english));
  for (const key of Object.keys(english)) assert.deepEqual(translationTokens(urdu[key]), translationTokens(english[key]), key);
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'ur', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { en: { translation: english }, ur: { translation: urdu } } });
  assert.equal(i18n.t('notification-group-card', { count: 3, card: 'آزمائش' }), 'کارڈ آزمائش پر 3 اطلاعات');
  assert.equal(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2 میں سے 0 تبدیلیاں لاگو ہوئیں');
  assert.equal(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }), 'createCards پر E_TEST کے ساتھ ناکام ہوئی');
  console.log('Urdu: full fill list, exact tokens, selected meanings and mixed-direction runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
