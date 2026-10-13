// Cover the full current Thai fill list, including pending feature strings.
// An empty fill list is not proof that every existing sentence is correct.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const remaining = JSON.parse(childProcess.execFileSync(node,
  [fill, '--list', 'th'], { cwd: ROOT, encoding: 'utf8' }));
assert.deepStrictEqual(remaining, {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/th.i18n.json'), 'utf8'));
for (const key of ['no-boards-selected', 'office-report-desc', 'api-report-desc']) {
  assert.match(translated[key], /[\u0e00-\u0e7f]/u);
  assert.doesNotMatch(translated[key], /You did not|Where people|Which REST/);
}
assert.match(translated['api-no-calls'], /WITH_API=true/);
console.log('upcomingThaiTranslationFill: 8 tests passed');

const english = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
assert.strictEqual(translated['attachment-limit-unit-bytes'], 'ไบต์');
assert.match(translated['custom-field-links-hint'], /ชื่อและชนิดเดียวกัน/);
assert.match(translated['custom-field-links-hint'], /การ์ดเพียงใบเดียวจะไม่เปลี่ยนแปลง/);
assert.match(translated['custom-field-link-send'], /การ์ดนี้จะส่งไปยังการ์ดหลัก/);
assert.match(translated['custom-field-link-receives'], /การ์ดนั้นจะส่งมายังการ์ดนี้/);
assert.match(translated['field-link-not-allowed'], /สิทธิ์แก้ไขการ์ดทั้งสองใบ/);
assert.match(translated['custom-field-link-inactive'], /ไม่มีสิทธิ์แก้ไข.*หรือ.*เก็บเข้าคลัง/);
assert.match(translated['read-only-field'], /สมาชิกทุกคนเห็นค่าได้.*เฉพาะผู้ดูแลบอร์ดเท่านั้น/);
assert.match(translated['notification-delivery-quiet'], /รอจนกว่าจะสิ้นสุด/);
assert.match(translated['webhook-payload-description'], /คงการตั้งค่าที่สืบทอดมาไว้/);
assert.match(translated['stuck-sync-operation-discard-confirm'], /การเปลี่ยนแปลงที่ใช้ไปแล้วจะยังอยู่/);
assert.match(translated['stuck-sync-operation-discard-confirm'], /ส่วนที่เหลือจะไม่ถูกเขียนอีกเลย/);
assert.match(translated['stuck-sync-operation-not-stuck'], /ไม่พบ.*ติดขัด.*ไม่สามารถละทิ้งได้/);
assert.match(translated['stuck-sync-operation-replayable'], /จะเสร็จเอง.*ไม่ได้ละทิ้ง/);
assert.match(translated['interrupted-import-description'], /ไม่สามารถนำเข้าต่อได้เพราะไม่ได้เก็บไฟล์ต้นฉบับไว้/);
assert.match(translated['interrupted-import-description'], /รวมถึงสิ่งที่เพิ่มเข้ามาภายหลังด้วย/);
assert.match(translated['interrupted-import-keep-confirm'], /ไม่มีการลบสิ่งใด/);
assert.match(translated['interrupted-import-discard-confirm'], /ทุกอย่างบนบอร์ดจะถูกลบอย่างถาวร/);
assert.match(translated['interrupted-import-foreign-board'], /ไม่ได้สร้างโดยการนำเข้านี้.*ไม่ได้แก้ไข/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) {
  assert.match(translated[key], /50 รายการที่เก่าที่สุด/);
}
for (const format of ['taiga', 'vikunja']) assert.match(translated['import-board-instruction-' + format], /ไม่นำเข้าสิ่งที่แนบมา/);
assert.match(translated['import-board-instruction-notion'], /ไม่นำเข้าความสัมพันธ์ รูปภาพ และสิ่งที่แนบมา/);
assert.match(translated['import-board-instruction-quire'], /ไม่มีความคิดเห็นและสิ่งที่แนบมา/);
assert.match(translated['import-board-instruction-plane'], /ไม่มีคำอธิบายหรือสิ่งที่แนบมา.*ไม่นำเข้า/);
for (const format of ['nullboard', 'kanri']) assert.match(translated['import-board-instruction-' + format], /นำเข้าบอร์ดแรก/);
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(translated['import-board-instruction-orgmode'].includes(literal));
}
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date',
  'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) {
  assert.ok(translated['import-board-instruction-teamwork'].includes(literal));
}
assert.match(translated['import-board-instruction-businessmap'], /แถวหัวตารางเป็นภาษาอังกฤษก่อน/);
assert.match(translated['import-board-instruction-redmine'], /ภาษาเป็น English ใน My account ก่อนส่งออก/);
assert.match(translated['import-many-boards-hint'], /โดยไม่จับคู่สมาชิก/);
assert.match(translated['import-many-boards-hint'], /แทนช่องด้านบน/);
assert.match(translated['r-wrike-workflow-note'], /เสร็จแล้ว.*Completed หรือ Cancelled.*ยังไม่เสร็จ.*Active หรือ Deferred/);
for (const literal of ['GET /workflows', 'JSON']) assert.ok(translated['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(translated['ldap-sync-now-nothing'].includes(literal));
}
assert.ok(translated['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(translated['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(translated['login-setting-env-only'], /เซิร์ฟเวอร์เท่านั้น.*อ่านอย่างเดียว/);
assert.ok(translated['trello-export-desc'].includes('Swimlane: …'));
assert.match(translated['trello-export-desc'], /เปลี่ยนกลับเป็นสวิมเลน/);
assert.match(translated['trello-export-warnings'], /ไม่สามารถส่งออกได้ทั้งหมด/);
assert.match(translated['sandstorm-trello-access-needed'], /ไม่สามารถเข้าถึงอินเทอร์เน็ต.*อนุญาต.*ก่อน/);
assert.match(translated['sandstorm-trello-access-granted'], /สามารถเข้าถึง Trello ได้/);
assert.notStrictEqual(translated['sandstorm-trello-access-needed'], translated['sandstorm-trello-access-granted']);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepStrictEqual(Object.keys(translated), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(english[key]), key);
  }
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'th', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { en: { translation: english }, th: { translation: translated } } });
  assert.strictEqual(i18n.t('notification-group-card', { count: 3, card: 'ทดสอบ' }), 'การแจ้งเตือน 3 รายการบนการ์ด ทดสอบ');
  assert.strictEqual(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), 'ใช้การเปลี่ยนแปลงแล้ว 0 จาก 2 รายการ');
  assert.strictEqual(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }),
    'ล้มเหลวด้วย E_TEST ที่ createCards');
  console.log('Thai: full fill list, exact tokens, selected semantic meanings and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
