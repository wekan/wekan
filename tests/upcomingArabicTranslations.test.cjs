// Guard full current Arabic placeholder coverage; older wrong-language values still need review.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const arabic = ['ar', 'ar-DZ', 'ar-EG', 'ary'];
const reportKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Arabic tags translate every report placeholder', () => {
  for (const code of arabic) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('all translated report values contain Arabic script', () => {
  for (const code of arabic) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.match(lang[key], /[؀-ۿ]/, code + ' has no Arabic script in ' + key);
    }
  }
});

test('technical tokens remain recognizable in translated descriptions', () => {
  for (const code of arabic) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of arabic) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingArabicTranslations: ' + passed + ' tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  test('completed Arabic locales preserve every key and interpolation token', () => {
    for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
      const lang = read(code);
      assert.deepStrictEqual(Object.keys(lang), Object.keys(en), code);
      for (const key of Object.keys(en)) {
        assert.deepStrictEqual(translationTokens(lang[key]), translationTokens(en[key]), `${code}:${key}`);
      }
    }
  });
  test('new planning and recovery prose is Arabic, with no English placeholders left', () => {
    const { execFileSync } = require('node:child_process');
    const root = path.resolve(DATA, '../../..');
    for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
      const lang = read(code);
      for (const key of ['filter-column-age-hint', 'scrum-total',
        'sync-preview-saved', 'email-recovery-description',
        'activity-recovery-busy', 'rule-email-recovery-description',
        'saml-login-not-started']) {
        assert.notStrictEqual(lang[key], en[key], `${code}:${key}`);
        assert.match(lang[key], /\p{Script=Arabic}/u, `${code}:${key}`);
      }
      const missing = JSON.parse(execFileSync(process.execPath,
        ['releases/translations/fill-translations.mjs', '--list', code],
        { cwd: root, encoding: 'utf8' }));
      assert.deepStrictEqual(missing, {}, code);
      assert.strictEqual(lang['blockly-MATH_TRIG_ACOS'], 'acos');
    }
  });
})().catch(error => { console.error(error); process.exitCode = 1; });

for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
  const locale = read(code);
  const corrected = { board: 'لوحة', swimlane: 'مسار', 'custom-fields': 'الحقول المخصصة', assignee: 'المكلّف', 'cardAssigneePopup-title': 'المكلّف', 'add-swimlane': 'إضافة مسار' };
  for (const [key, value] of Object.entries(corrected)) {
    assert.equal(locale[key], value, `${code}:${key}`);
    assert.doesNotMatch(locale[key], /[پچژگکی]/, `${code}:${key} contains Persian-only letters`);
  }
  assert.match(locale['custom-field-links-hint'], /الاسم والنوع نفسيهما في البطاقتين/);
  assert.match(locale['custom-field-links-hint'], /بطاقة واحدة فقط دون تغيير/);
  assert.match(locale['custom-field-link-inactive'], /لم يعد قادرًا على تعديل البطاقتين.*أُرشفت/);
  assert.match(locale['custom-field-link-both'], /في الاتجاهين.*أي من البطاقتين/);
  assert.match(locale['custom-field-link-send'], /في اتجاه واحد.*البطاقة الرئيسية/);
  assert.match(locale['field-link-not-allowed'], /قادرًا على تعديل البطاقتين/);
  assert.equal(locale['import-members-mode-me'], 'استبدال الجميع بحسابي');
  assert.match(locale['import-many-boards-hint'], /دون ربط الأعضاء/);
  assert.match(locale['import-many-boards-hint'], /بحد ذاته عملية تصدير واحدة.*هو لوحة واحدة/);
  assert.match(locale['export-all-boards-hint'], /يُسمح لك بتصديرها.*كمصنف واحد.*\.zip/);
  assert.match(locale['webhook-payload-description'], /على الإعداد الموروث/);
  assert.match(locale['notification-delivery-quiet'], /الانتظار حتى انتهائها/);
  assert.match(locale['r-wrike-workflow-note'], /علامة الاكتمال.*Completed.*Cancelled.*علامة عدم الاكتمال.*Active.*Deferred/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /علامة مكتملة/);
  assert.match(locale['subtask-mark-not-done'], /علامة غير مكتملة/);
  assert.equal(locale['notification-delivery-part-list'], 'قائمة');
  assert.equal(locale['notification-delivery-part-swimlane'], 'مسار');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /لا تُستورد المرفقات/);
  assert.match(locale['import-board-instruction-redmine'], /اضبط لغتك على الإنجليزية في My account قبل التصدير/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /لا يتضمن تصدير Plane أوصافًا أو مرفقات.*لا تُستورد/);
  assert.match(locale['import-board-instruction-kanri'], /تُستورد اللوحة الأولى/);
  assert.match(locale['import-board-instruction-teamwork'], /-- أو ## أو >> لمستوى أعمق واحد/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['sync-planning-hint'], /لا تزيل المزامنة الأولى أي تخطيط مطلقًا/);
  assert.match(locale['stuck-sync-operation-description'], /تبقى التغييرات المطبقة/);
  assert.match(locale['stuck-sync-operation-description'], /لا تُكتب بقية التغييرات المحفوظة مطلقًا/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /صلاحية الكتابة في القائمة بأكملها/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /لا يمكن التخلص منها/);
  assert.match(locale['stuck-sync-operation-replayable'], /لم يُتخلص منها/);
  assert.match(locale['stuck-sync-operation-busy'], /تجري مزامنة هذه القائمة الآن/);
  assert.match(locale['interrupted-import-description'], /لا يمكن متابعة الاستيراد.*ملف المصدر لا يُحتفظ به/);
  assert.match(locale['interrupted-import-description'], /أي شيء أُضيف إليها منذ ذلك الحين/);
  assert.match(locale['interrupted-import-keep-confirm'], /لن يُزال أي شيء/);
  assert.match(locale['interrupted-import-discard-confirm'], /كل محتوياتها نهائيًا/);
  assert.match(locale['interrupted-import-foreign-board'], /لم تُنشأ.*لذلك لم تُعدّل/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(locale[key], /أقدم 50/);
  assert.match(locale['scrum-import-into-board-hint'], /لا تُكرر مطلقًا/);
  assert.match(locale['scrum-import-into-board-hint'], /البطاقات غير المطابقة وتُترك دون تغيير/);
  assert.match(locale['scrum-history-checkpoint-hint'], /إذا لم يغيّر أي شخص آخر/);
  assert.match(locale['scrum-history-checkpoint-hint'], /دون تغيير أي سجلات/);
  assert.match(locale['interrupted-import-scrum-busy'], /قيد الكتابة أو الاستعادة/);
}
console.log('Arabic native core labels and import/recovery/notification meanings pass');

// The legacy Persian seed uses this script too; assert vocabulary and meaning,
// not merely membership of the broad Arabic Unicode script.
for (const code of ['ar', 'ar-DZ', 'ar-EG']) {
  const locale = read(code);
  for (const [key, value] of Object.entries(locale)) assert.doesNotMatch(value, /[پچژگکی]/, `${code}:${key} contains Persian-specific letters`);
  assert.equal(locale['activity-imported'], 'استورد %s إلى %s من %s');
  assert.equal(locale['activity-imported-board'], 'استورد %s من %s');
  assert.match(locale['vote-delete-pop'], /الحذف نهائي.*جميع الإجراءات/);
  assert.match(locale['delete-user-confirm-popup'], /لا يمكن التراجع/);
  assert.equal(locale['disable-webhook'], 'تعطيل خطاف الويب هذا');
  assert.doesNotMatch(locale['disable-webhook'], /حذف/);
  assert.match(locale['import-members-map-note'], /الأعضاء غير المرتبطين.*المستخدم الحالي/);
  assert.match(locale['muted-info'], /لن تتلقى أي إشعار/);
  assert.match(locale['watching-info'], /ستتلقى إشعارًا بأي تغيير/);
  assert.match(locale['swimlaneAddPopup-title'], /أدناه$/);
  assert.equal(locale['color-red'], 'أحمر');
  assert.equal(locale['color-green'], 'أخضر');
  assert.equal(locale['color-blue'], 'أزرق');
  assert.equal(locale['r-check'], 'تحديد');
  assert.equal(locale['r-uncheck'], 'إلغاء التحديد');
  assert.equal(locale['r-checked'], 'محدد');
  assert.equal(locale['r-unchecked'], 'غير محدد');
  assert.equal(locale['r-items-list'], 'عنصر1,عنصر2,عنصر3');
  assert.match(locale['r-when-a-end-date-changed'], /تعيين تاريخ الانتهاء أو تغييره/);
  assert.match(locale['r-when-a-received-date-changed'], /تعيين تاريخ الاستلام أو تغييره/);
  assert.match(locale['email-enrollAccount-text'], /لبدء استخدام الخدمة/);
  assert.match(locale['email-resetPassword-text'], /لإعادة تعيين كلمة مرورك/);
  assert.match(locale['email-verifyEmail-text'], /لتأكيد البريد الإلكتروني لحسابك/);
  assert.match(locale['email-invite-register-text'], /يدعوك __inviter__.*رمز دعوتك هو: __icode__/s);
  assert.match(locale['act-a-dueAt'], /متى: __timeValue__.*أين: __card__.*الموعد السابق __timeOldValue__/s);
  assert.equal(locale['excel-font'], 'Arial');
  assert.equal(locale['convert-to-markdown'], 'تحويل إلى Markdown');
  assert.equal(locale['uncollapse'], 'توسيع');
  assert.equal(locale['status'], 'الحالة');
  assert.equal(locale['operator-swimlane'], 'مسار');
  assert.equal(locale['operator-assignee'], 'المكلّف');
  assert.equal(locale['predicate-open'], 'مفتوح');
  assert.equal(locale['predicate-archived'], 'مؤرشف');
  assert.match(locale['globalSearch-instructions-notes-4'], /لا تميّز بين الأحرف الكبيرة والصغيرة/);
  assert.match(locale['flow-note-blockerAnalysis'], /أوقات بدء العوائق وانتهائها لكل مرحلة/);
  assert.match(locale['flow-note-blockerAnalysis'], /الروابط القديمة غير معروفة/);
  assert.match(locale['flow-note-blockerAnalysis'], /البطاقات المحذوفة لقطات محفوظة/);
  assert.match(locale['flow-note-blockerAnalysis'], /الأسباب المتداخلة كلٌّ على حدة/);
  // Valid Arabic shared with Persian must not be replaced solely for matching.
  assert.equal(locale['userPopup-title'], 'عضو');
  assert.equal(locale['text-note-title'], 'عنوان');
  assert.equal(locale['queue'], 'صف');
  assert.equal(locale['blockly-TEXT_LENGTH_TITLE'], 'طول %1');
}
console.log('Arabic legacy vocabulary, destructive actions, email roles, rule directions and retained shared words pass');
