// Current Bengali fills include the pending feature keys. Language quality
// beyond the explicitly reviewed behaviors still needs contextual review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'bn'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const bengali = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/bn.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();
for (const [key, value] of Object.entries(bengali)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}
assert.equal(bengali.accept, 'গ্রহণ করুন');
assert.match(bengali['act-addChecklistItem'], /যাচাইতালিকা আইটেম.*যোগ করেছেন/);
for (const token of ['__checklistItem__', '__checklist__', '__card__', '__list__', '__swimlane__', '__board__']) {
  assert.match(bengali['act-addChecklistItem'], new RegExp(token));
}

// Permissions, directions and loss warnings must survive translation; a string
// that merely differs from English is not enough to protect these decisions.
assert.match(bengali['field-link-not-allowed'], /দুই কার্ডই সম্পাদনা করার অনুমতি/);
assert.match(bengali['custom-field-links-hint'], /একই নাম ও ধরনের/);
assert.match(bengali['custom-field-links-hint'], /শুধু একটি কার্ডে.*অপরিবর্তিত/);
assert.match(bengali['custom-field-link-send'], /এই কার্ডের পরিবর্তন মূল কার্ডে যায়/);
assert.match(bengali['custom-field-link-receives'], /ওই কার্ডের পরিবর্তন এই কার্ডে আসে/);
assert.match(bengali['read-only-field'], /সব সদস্য.*শুধু বোর্ডের প্রশাসকেরা/);
assert.match(bengali['webhook-payload-description'], /ওপরের স্তর থেকে পাওয়া সেটিং/);
assert.match(bengali['notification-delivery-quiet'], /শেষ হওয়া পর্যন্ত অপেক্ষা/);
assert.match(bengali['stuck-sync-operation-discard-confirm'], /প্রয়োগ করা পরিবর্তন থাকবে/);
assert.match(bengali['stuck-sync-operation-discard-confirm'], /বাকিগুলো কখনো লেখা হবে না/);
assert.match(bengali['stuck-sync-operation-not-stuck'], /বাতিল করা যাবে না/);
assert.match(bengali['stuck-sync-operation-replayable'], /নিজে থেকেই শেষ হবে.*বাতিল করা হয়নি/);
assert.match(bengali['interrupted-import-description'], /উৎস ফাইল রাখা হয় না/);
assert.match(bengali['interrupted-import-description'], /পরে যোগ করা সবকিছুসহ/);
assert.match(bengali['interrupted-import-keep-confirm'], /কিছুই মুছে যাবে না/);
assert.match(bengali['interrupted-import-discard-confirm'], /স্থায়ীভাবে মুছে যাবে/);
assert.match(bengali['interrupted-import-foreign-board'], /অপরিবর্তিত/);
for (const key of ['interrupted-import-truncated', 'stuck-sync-operation-truncated']) {
  assert.match(bengali[key], /সবচেয়ে পুরোনো 50টি/);
}
for (const key of ['taiga', 'vikunja', 'notion']) {
  assert.match(bengali['import-board-instruction-' + key], /সংযুক্তি আমদানি হয় না/);
}
assert.match(bengali['import-board-instruction-quire'], /মন্তব্য ও সংযুক্তি থাকে না/);
assert.match(bengali['import-board-instruction-plane'], /বিবরণ বা সংযুক্তি নেই/);
for (const key of ['nullboard', 'kanri']) {
  assert.match(bengali['import-board-instruction-' + key], /প্রথম বোর্ডটি আমদানি/);
}
for (const token of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(bengali['import-board-instruction-orgmode'].includes(token));
}
for (const token of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date',
  'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) {
  assert.ok(bengali['import-board-instruction-teamwork'].includes(token));
}
assert.match(bengali['import-board-instruction-businessmap'], /শিরোনামের সারি ইংরেজিতে/);
assert.match(bengali['import-board-instruction-redmine'], /ভাষা English/);
assert.match(bengali['import-many-boards-hint'], /সদস্য মিলকরণ ছাড়াই/);
assert.match(bengali['import-many-boards-hint'], /ওপরের ক্ষেত্রের বদলে/);
assert.match(bengali['r-wrike-workflow-note'], /Completed বা Cancelled.*সম্পন্ন.*Active বা Deferred.*অসম্পূর্ণ/);
for (const token of ['GET /workflows', 'JSON']) assert.ok(bengali['r-wrike-workflow-note'].includes(token));
for (const token of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(bengali['ldap-sync-now-nothing'].includes(token));
}
for (const token of ['{number}', '{identifier}', ' = ', 'https://tracker.example.com/{identifier}/{number}']) {
  assert.ok(bengali['external-link-rules-description'].includes(token));
}
assert.ok(bengali['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(bengali['login-setting-env-only'], /শুধু সার্ভারের পরিবেশ.*শুধু পড়ার/);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepEqual(Object.keys(bengali), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(bengali[key]), translationTokens(english[key]), key);
  }
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'bn', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { en: { translation: english }, bn: { translation: bengali } } });
  assert.equal(i18n.t('notification-group-card', { count: 3, card: 'পরীক্ষা' }), 'পরীক্ষা কার্ডে 3টি বিজ্ঞপ্তি');
  assert.equal(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2টি পরিবর্তনের মধ্যে 0টি প্রয়োগ হয়েছে');
  assert.equal(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }), 'createCards ধাপে E_TEST ত্রুটিতে ব্যর্থ হয়েছে');
  console.log('Bengali current fills: complete inventory, exact tokens, decision meanings and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });

// Preserve export direction and permission-state meaning in the new API dialog.
assert.ok(bengali['trello-export-desc'].includes('Swimlane: …'));
assert.match(bengali['trello-export-desc'], /API কী ও টোকেন/);
assert.match(bengali['trello-export-desc'], /আবার সাঁতারপথে রূপান্তর করে/);
assert.match(bengali['trello-export-warnings'], /সবকিছু রপ্তানি করা যায়নি/);
assert.match(bengali['sandstorm-trello-access-needed'], /নিজস্ব কোনো ইন্টারনেট প্রবেশাধিকার নেই/);
assert.match(bengali['sandstorm-trello-access-needed'], /প্রথমে.*অনুমতি দিন/);
assert.match(bengali['sandstorm-trello-access-granted'], /পৌঁছাতে পারে/);
