'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`)));
const english = read('en');
for (const code of ['vi', 'vi-VN', 'bg', 'el', 'el-GR', 'ca', 'ca_ES', 'ca@valencia',
  'ru', 'ru-RU', 'ru-UA', 'ru_RU', 'uk', 'uk-UA', 'pl', 'pl-PL', 'cs', 'cs-CZ',
  'de', 'de_DE', 'de-AT', 'de-CH', 'fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH',
  'es', 'es-AR', 'es-LA', 'es-CL', 'es_CO', 'es-CO', 'es-PY', 'es-PE', 'es-MX', 'it',
  'pt', 'pt-PT', 'pt_PT', 'pt-BR', 'nl', 'nl-NL', 'sv', 'fi', 'et-EE', 'da', 'nb', 'tr', 'id', 'ro', 'ro-RO', 'hu', 'sk', 'ja', 'ja-JP', 'ko', 'ko-KR',
  'zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ar-DZ', 'ar-EG', 'gl', 'gl-ES', 'he', 'he-IL', 'fa', 'fa-IR', 'ms', 'ms-MY', 'sl', 'sl_SI', 'hr', 'sr', 'bs', 'mk', 'be', 'lt', 'lv', 'is', 'af', 'af_ZA', 'hi', 'hi-IN', 'bn', 'ta', 'ne', 'ur', 'th', 'gu-IN', 'kn', 'ga', 'co', 'sc', 'scn', 'nap', 'an', 'ast-ES', 'oc', 'br', 'eu', 'cy', 'cy-GB', 'gd', 'csb']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
  }
  // --list includes pending Transifex keys, unlike the aggregate --missing report.
  const missing = JSON.parse(execFileSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', code],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  assert.deepEqual(missing, {}, `${code}: no untranslated prose, including pending keys`);
  assert.notEqual(locale['blockly-END_KEY'], locale['end-date'], 'keyboard End is not an ending date');
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve todo.txt ${token}`);
  }
}
for (const code of ['vi', 'vi-VN']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /thẻ/);
  assert.match(locale['sync-conflict-heading'], /đồng bộ/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Không thể tiếp tục lại/);
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve executable ${token}`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve filter syntax ${token}`);
  }
  for (const key of ['blockly-CHROME_OS', 'blockly-LINUX', 'blockly-MAC_OS', 'blockly-WINDOWS',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}: product names and mathematical symbols stay intact`);
  }
}
assert.match(read('bg')['r-insert-variable'], /променлива/);
for (const code of ['el', 'el-GR']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /κάρτες/);
  assert.match(locale['sync-conflict-heading'], /συγχρονισμού/);
  assert.match(locale['r-trigger-vars-hint'], /διαδρόμου/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /δύο φορές/);
  assert.ok(locale['r-trigger-vars-hint'].includes('{customField:Name}'));
  assert.ok(locale['advanced-filter-card-dates-hint'].includes('@endAt = none'));
}
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /fitxes/);
  assert.match(locale['sync-conflict-heading'], /sincronització/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dues vegades/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /No s'enviarà mai/);
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], 'dividend');
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
  assert.ok(locale['r-trigger-vars-hint'].includes('{customField:Name}'));
  assert.ok(locale['advanced-filter-card-dates-hint'].includes('@endAt = none'));
}
for (const code of ['ru', 'ru-RU', 'ru-UA', 'ru_RU']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /переменную/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /дважды/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /никогда не будет отправлено/);
  assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
}
for (const code of ['uk', 'uk-UA']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /змінну/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /двічі/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ніколи не буде надіслано/);
  assert.doesNotMatch(locale['r-insert-variable'], /переменную/);
  assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
}
for (const code of ['pl', 'pl-PL']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /zmienną/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dwukrotnie/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nigdy nie zostanie wysłana/);
}
for (const code of ['cs', 'cs-CZ']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /proměnnou/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dvakrát/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikdy nebude odeslán/);
  assert.equal(locale['rule-email-legacy-source'], 'Tablo / karta');
}
for (const [codes, duplicate, never] of [
  [['de', 'de_DE', 'de-AT', 'de-CH'], /doppelt/, /niemals gesendet/],
  [['fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH'], /deux fois/, /jamais envoyé/],
  [['es', 'es-AR', 'es-LA', 'es-CL', 'es_CO', 'es-CO', 'es-PY', 'es-PE', 'es-MX'], /dos veces/, /Nunca se enviará/],
  [['it'], /due volte/, /Non sarà mai inviata/],
  [['pt', 'pt-PT', 'pt_PT', 'pt-BR'], /duas vezes/, /[Nn]unca será enviado/],
  [['nl', 'nl-NL'], /twee keer/, /nooit verzonden/],
  [['sv'], /två gånger/, /aldrig att skickas/],
  [['fi'], /kahdesti/, /ei lähetetä koskaan/],
  [['da'], /to gange/, /aldrig sendt/],
  [['nb'], /to ganger/, /aldri sendt/],
  [['tr'], /iki kez/, /Asla gönderilmeyecek/],
  [['id'], /dua kali/, /tidak akan pernah dikirim/],
  [['ro', 'ro-RO'], /de două ori/, /Nu va fi trimis niciodată/],
  [['hu'], /kétszer/, /Soha nem lesz elküldve/],
  [['sk'], /dvakrát/, /Nikdy nebude odoslaný/],
  [['ja', 'ja-JP'], /2回届きます/, /今後送信されることはありません/],
  [['ko', 'ko-KR'], /두 번 받게 됩니다/, /앞으로 절대 전송되지 않습니다/],
  [['ar', 'ar-DZ', 'ar-EG'], /الرسالة مرتين/, /لن تُرسل أبدًا/],
  [['gl', 'gl-ES'], /dúas veces/, /Non se enviará nunca/],
  [['zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB'], /收到两封相同的邮件/, /永远不会发送/],
  [['zh-Hant', 'zh-TW', 'zh-HK'], /收到兩封相同的郵件/, /永遠不會傳送/],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['rule-email-recovery-resend-confirm'], duplicate);
    assert.match(locale['rule-email-legacy-discard-confirm'], never);
  }
}
assert.equal(read('pt-BR')['rule-email-recovery-recipient-accepted'], 'Aceito');
assert.equal(read('pt-PT')['rule-email-recovery-recipient-accepted'], 'Aceite');
// This batch uses the script declared by ja-Hira; older strings still need review.
const hiragana = read('ja-HI');
const hiraganaBatchKeys = Object.keys(english).filter(key =>
  /^rule-email-(legacy|resolution)-/.test(key) ||
  /^rule-email-recovery-(dropped|review|recipients|recipient-|actions-hint|wait|resends|resend|mark-sent|drop)/.test(key) ||
  key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
assert.equal(hiraganaBatchKeys.length, 45);
for (const key of hiraganaBatchKeys) {
  assert.notEqual(hiragana[key], english[key], `ja-Hira:${key}: untranslated`);
  assert.doesNotMatch(hiragana[key], /[\p{Script=Han}\p{Script=Katakana}]/u, `ja-Hira:${key}: use hiragana`);
  assert.deepEqual(translationTokens(hiragana[key]), translationTokens(english[key]), `ja-Hira:${key}: tokens`);
}
for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
  assert.ok(hiragana['import-board-instruction-todotxt'].includes(token), `ja-Hira: preserve ${token}`);
}
assert.match(hiragana['rule-email-recovery-resend-confirm'], /2かい とどきます/);
assert.match(hiragana['rule-email-legacy-discard-confirm'], /こんご おくられることは ありません/);
for (const code of ['he', 'he-IL']) {
  const locale = read(code);
  assert.equal(locale['blockly-SPACE_KEY'], 'רווח');
  assert.equal(locale['blockly-BACKSPACE_KEY'], 'מחיקה לאחור');
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-CONTROL_KEY',
    'blockly-OPTION_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY',
    'blockly-CHROME_OS', 'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-LOGIC_NULL',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}:${key}: preserve technical notation`);
  }
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /פעמיים/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /לעולם לא תישלח/);
  for (const key of Object.keys(english).filter(key =>
    /^(filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-|auto-archive-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /אינה מאפסת/);
  assert.match(locale['instance-desc'], /לעולם אינו מוצג למי שאינו מחובר/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /אינן הערכות אפס/);
  assert.match(locale['scrum-partial-report'], /רק כרטיסים שמשויכים אליך כעת/);
  assert.match(locale['scrum-daily-observations-help'], /אינן מתעדות כל שינוי/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /דבר אינו נשלח למערכת המקור/);
  assert.match(locale['sync-conflict-detach-hint'], /התוכן שלו נשאר/);
  assert.match(locale['sync-report-partial'], /אינם ממשיכים הרצה ואינם מבטלים אותה/);
  assert.match(locale['sync-estimate-field-hint'], /חסרים.*להתעלמות.*null מפורש מנקה/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /לא ניתן יהיה לחדש אותה/);
  assert.match(locale['email-recovery-confirm-cancel'], /לא ניתן יהיה לשחזרו/);
  assert.match(locale['history-request-hint'], /לעולם אינו יכול לבטל שינוי נוסף/);
}
for (const code of ['fa', 'fa-IR']) {
  const locale = read(code);
  assert.equal(locale['blockly-SPACE_KEY'], 'فاصله');
  assert.equal(locale['blockly-CONTEXT_MENU_KEY'], '≣ منو');
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-OPTION_KEY',
    'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-CHROME_OS', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-MATH_TRIG_ACOS',
    'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}:${key}: preserve technical notation`);
  }
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Arabic}/u, `${code}:${key}: Persian text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /دو بار دریافت خواهد کرد/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /هرگز ارسال نخواهد شد/);
  assert.match(locale['rule-email-legacy-description'], /نویسندهٔ قانون هنوز دسترسی دارد/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.match(locale['filter-column-age-hint'], /صفر نمی‌کند/);
  assert.match(locale['instance-desc'], /هرگز به کسانی که وارد نشده‌اند نمایش داده نمی‌شود/);
  for (const key of Object.keys(english).filter(key =>
    /^(notification-activity-|due-reminder-|filter-preset|filter-card-text|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['due-reminder-days-label'], /مثبت.*پیش.*منفی.*پس/);
  assert.match(locale['notification-activity-description'], /همیشه می‌رسند/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /برآورد صفر نیستند/);
  assert.match(locale['scrum-partial-report'], /فقط کارت‌هایی که اکنون به شما اختصاص دارند/);
  assert.match(locale['scrum-daily-observations-help'], /همهٔ تغییرات را ثبت نمی‌کنند/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /چیزی به سامانهٔ منبع فرستاده نمی‌شود/);
  assert.match(locale['sync-conflict-detach-hint'], /محتوای آن در WeKan باقی می‌ماند/);
  assert.match(locale['sync-report-partial'], /ادامه نمی‌دهند.*برنمی‌گردانند/);
  assert.match(locale['sync-estimate-field-hint'], /نادیده گرفته می‌شوند.*null.*پاک می‌کند/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /امکان ادامهٔ آن وجود نخواهد داشت/);
  assert.match(locale['email-recovery-confirm-cancel'], /قابل بازیابی نیست/);
  assert.match(locale['history-request-hint'], /هرگز نمی‌تواند تغییر دیگری را برگرداند/);
}
for (const code of ['ms', 'ms-MY']) {
  const locale = read(code);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dua kali/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /tidak akan dihantar selama-lamanya/);
  assert.match(locale['r-insert-variable'], /pemboleh ubah/);
  assert.match(locale['rule-email-legacy-access-denied'], /tidak lagi mempunyai akses/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.match(locale['filter-column-age-hint'], /tidak menetapkan semula/);
  assert.match(locale['instance-desc'], /tidak pernah ditunjukkan kepada orang yang belum log masuk/);
  for (const key of Object.keys(english).filter(key =>
    /^(notification-activity-|due-reminder-|filter-preset|filter-card-text|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['due-reminder-days-label'], /positif.*sebelumnya.*negatif.*selepasnya/);
  assert.match(locale['notification-activity-description'], /sentiasa diterima/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /bukan anggaran sifar/);
  assert.match(locale['scrum-partial-report'], /hanya kad yang kini ditugaskan kepada anda/);
  assert.match(locale['scrum-daily-observations-help'], /tidak merekodkan setiap perubahan/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Tiada apa-apa dihantar ke sistem sumber/);
  assert.match(locale['sync-conflict-detach-hint'], /Kandungannya kekal dalam WeKan/);
  assert.match(locale['sync-report-partial'], /tidak menyambung atau membuat asal/);
  assert.match(locale['sync-estimate-field-hint'], /tiada diabaikan.*null.*mengosongkan/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /tidak boleh disambung semula/);
  assert.match(locale['email-recovery-confirm-cancel'], /tidak boleh dipulihkan/);
  assert.match(locale['history-request-hint'], /tidak sekali-kali boleh membuat asal perubahan kedua/);
  for (const key of Object.keys(english).filter(key =>
    /^blockly-(ANNOUNCE_|ARIA_|BLOCK_LABEL_|BUBBLE_LABEL_|FIELD_BITMAP_|FIELD_LABEL_|FIELD_MULTILINEINPUT_|ICON_LABEL_)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /Tidak boleh memadam pemboleh ubah/);
  assert.match(locale['blockly-COLLAPSED_WARNINGS_WARNING'], /mengandungi amaran/);
  for (const key of Object.keys(english).filter(key =>
    /^blockly-(KEYBOARD_NAV_|LOGIC_COMPARE_.*_ARIA|LISTS_SORT_(?!HELPURL))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /kedua-dua input benar/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /sekurang-kurangnya satu input benar/);
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /termasuk kedua-dua had/);
  assert.match(locale['blockly-LISTS_SORT_TOOLTIP'], /salinan senarai/);
  for (const key of Object.keys(english).filter(key =>
    /^(r-blocks-|blockly-(SHORTCUTS_|SCREENREADER_|WORKSPACE_SEARCH_))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['r-blocks-invalid'], /tepat satu pencetus kepada satu tindakan/);
  assert.match(locale['r-blocks-permission'], /pentadbir papan/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Tidak boleh.*dinyahdayakan/);
  assert.notEqual(locale['blockly-END_KEY'], locale['end-date']);
}
for (const code of ['sl', 'sl_SI']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /prejel dvakrat/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikoli ne bo poslano/);
  assert.match(locale['rule-email-legacy-access-denied'], /nima več dostopa/);
  assert.match(locale['r-insert-variable'], /spremenljivko/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /niso ničelne ocene/);
  assert.match(locale['scrum-partial-report'], /le kartice, ki so vam trenutno dodeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne beležijo vsake spremembe/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /V izvorni sistem se nič ne pošlje/);
  assert.match(locale['sync-conflict-detach-hint'], /vsebina ostane v WeKan/);
  assert.match(locale['sync-report-partial'], /ne nadaljujejo ali razveljavijo/);
  assert.match(locale['sync-estimate-field-hint'], /Manjkajoče.*prezrejo.*null počisti/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nadaljevanje ne bo mogoče/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne bo mogoče obnoviti/);
  assert.match(locale['history-request-hint'], /nikoli ne more razveljaviti še druge spremembe/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne ponastavi/);
  assert.match(locale['instance-desc'], /niso prijavljene, ni nikoli prikazana/);
  assert.match(locale['due-reminder-days-label'], /pozitivna.*pred njim.*negativna.*po njem/);
  assert.match(locale['notification-activity-description'], /vedno prejmete/);
}
{
  const locale = read('hr');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'hr: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `hr: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /primit će je dvaput/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikada neće biti poslana/);
  assert.match(locale['rule-email-legacy-access-denied'], /više nema pristup/);
  assert.match(locale['r-insert-variable'], /varijablu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nisu nulte procjene/);
  assert.match(locale['scrum-partial-report'], /samo kartice koje su vam trenutačno dodijeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne bilježe svaku promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ništa se ne šalje izvornom sustavu/);
  assert.match(locale['sync-conflict-detach-hint'], /sadržaj ostaje u WeKanu/);
  assert.match(locale['sync-report-partial'], /ne nastavljaju niti poništavaju/);
  assert.match(locale['sync-estimate-field-hint'], /nedostaju zanemaruju se.*null briše/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nastavak neće biti moguć/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne može se vratiti/);
  assert.match(locale['history-request-hint'], /nikada ne može poništiti još jednu promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `hr: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `hr: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne poništava/);
  assert.match(locale['instance-desc'], /Nikada se ne prikazuje osobama koje nisu prijavljene/);
  assert.match(locale['due-reminder-days-label'], /pozitivni.*prije njega.*negativni.*nakon njega/);
  assert.match(locale['notification-activity-description'], /uvijek stižu/);
}
{
  const locale = read('sr');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'sr: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
    assert.match(locale[key], /[А-Яа-я]/u, `sr:${key}: Serbian Cyrillic prose`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `sr: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /примиће је двапут/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Никада неће бити послата/);
  assert.match(locale['rule-email-legacy-access-denied'], /више нема приступ/);
  assert.match(locale['r-insert-variable'], /променљиву/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /нису нулте процене/);
  assert.match(locale['scrum-partial-report'], /само картице које су вам тренутно додељене/);
  assert.match(locale['scrum-daily-observations-help'], /не бележе сваку промену/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ништа се не шаље изворном систему/);
  assert.match(locale['sync-conflict-detach-hint'], /садржај остаје у WeKan-у/);
  assert.match(locale['sync-report-partial'], /не настављају нити поништавају/);
  assert.match(locale['sync-estimate-field-hint'], /недостају се занемарују.*null брише/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Наставак неће бити могућ/);
  assert.match(locale['email-recovery-confirm-cancel'], /не може се вратити/);
  assert.match(locale['history-request-hint'], /никада не може поништити још једну промену/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `sr: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `sr: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не поништава/);
  assert.match(locale['instance-desc'], /Никада се не приказује особама које нису пријављене/);
  assert.match(locale['due-reminder-days-label'], /позитивни.*пре њега.*негативни.*после њега/);
  assert.match(locale['notification-activity-description'], /увек стижу/);
}
{
  const locale = read('bs');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'bs: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `bs: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /primit će je dvaput/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikada neće biti poslana/);
  assert.match(locale['rule-email-legacy-access-denied'], /više nema pristup/);
  assert.match(locale['r-insert-variable'], /promjenljivu/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nastavak neće biti moguć/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne može se vratiti/);
  assert.match(locale['history-request-hint'], /nikada ne može poništiti još jednu promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ništa se ne šalje izvornom sistemu/);
  assert.match(locale['sync-conflict-detach-hint'], /sadržaj ostaje u WeKanu/);
  assert.match(locale['sync-report-partial'], /ne nastavljaju niti poništavaju/);
  assert.match(locale['sync-estimate-field-hint'], /nedostaju se zanemaruju.*null briše/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nisu nulte procjene/);
  assert.match(locale['scrum-partial-report'], /samo kartice koje su vam trenutno dodijeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne bilježe svaku promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `bs: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `bs: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne poništava/);
  assert.match(locale['instance-desc'], /Nikada se ne prikazuje osobama koje nisu prijavljene/);
  assert.match(locale['due-reminder-days-label'], /pozitivni.*prije njega.*negativni.*nakon njega/);
  assert.match(locale['notification-activity-description'], /uvijek stižu/);
}
{
  const locale = read('mk');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'mk: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
    assert.match(locale[key], /[А-Яа-я]/u, `mk:${key}: Cyrillic prose`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `mk: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ќе ја добие двапати/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Никогаш нема да биде испратена/);
  assert.match(locale['rule-email-legacy-access-denied'], /повеќе нема пристап/);
  assert.match(locale['r-insert-variable'], /променлива/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Продолжувањето нема да биде можно/);
  assert.match(locale['email-recovery-confirm-cancel'], /не може да се врати/);
  assert.match(locale['history-request-hint'], /никогаш не може да поништи уште една промена/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ништо не се испраќа до изворниот систем/);
  assert.match(locale['sync-conflict-detach-hint'], /содржина останува во WeKan/);
  assert.match(locale['sync-report-partial'], /не го продолжуваат ниту го поништуваат/);
  assert.match(locale['sync-estimate-field-hint'], /недостигаат се игнорираат.*null ја брише/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /не се нулти процени/);
  assert.match(locale['scrum-partial-report'], /само картичките што моментално ви се доделени/);
  assert.match(locale['scrum-daily-observations-help'], /не ја бележат секоја промена/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `mk: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `mk: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не го ресетира/);
  assert.match(locale['instance-desc'], /Никогаш не им се прикажува на лица што не се најавени/);
  assert.match(locale['due-reminder-days-label'], /позитивните.*пред него.*негативните.*по него/);
  assert.match(locale['notification-activity-description'], /секогаш пристигнуваат/);
}
{
  const locale = read('be');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'be: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `be: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /атрымае яго двойчы/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ніколі не будзе адпраўлены/);
  assert.match(locale['rule-email-legacy-access-denied'], /больш не мае доступу/);
  assert.match(locale['r-insert-variable'], /зменную/);
  assert.match(locale['email-recovery-confirm-cancel'], /без магчымасці аднаўлення/);
  assert.match(locale['activity-recovery-cancel-confirm'], /нельга будзе аднавіць/);
  assert.match(locale['activity-recovery-description'], /ніколі не стварае дзеянне нанова/);
  assert.match(locale['history-request-hint'], /ніколі не можа адмяніць другую змену/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Нічога не адпраўляецца ў зыходную сістэму/);
  assert.match(locale['sync-report-partial'], /не аднаўляюць і не адмяняюць/);
  assert.match(locale['sync-estimate-field-hint'], /null ачышчае/);
  assert.match(locale['sync-time-estimate-hint'], /роўна адно адпаведнае поле/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `be: ${key} must be translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]));
  }
  assert.match(locale['scrum-report-help'], /не з’яўляюцца нулявымі ацэнкамі/);
  assert.match(locale['scrum-partial-report'], /толькі карткі, якія зараз прызначаны вам/);
  assert.match(locale['scrum-daily-observations-help'], /не фіксуюць кожную змену/);
  assert.match(locale['scrum-daily-observations-export-help'], /не роўныя нулю/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `be: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `be: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не скідае/);
  assert.match(locale['instance-desc'], /ніколі не паказваецца тым, хто не ўвайшоў/);
  assert.match(locale['due-reminder-days-label'], /дадатныя.*да яго.*адмоўныя.*пасля яго/);
  assert.match(locale['notification-activity-description'], /заўсёды прыходзяць/);
}
{
  const locale = read('lt');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'lt: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `lt: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /gaus jį du kartus/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /niekada nebus išsiųstas/);
  assert.match(locale['rule-email-legacy-access-denied'], /nebeturi prieigos/);
  assert.match(locale['r-insert-variable'], /kintamąjį/);
  assert.match(locale['email-recovery-confirm-cancel'], /atkurti nebus galima/);
  assert.match(locale['activity-recovery-cancel-confirm'], /pratęsti nebus galima/);
  assert.match(locale['activity-recovery-description'], /niekada nesukuriamas iš naujo/);
  assert.match(locale['history-request-hint'], /niekada negali atšaukti antro pakeitimo/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Į šaltinio sistemą nieko nesiunčiama/);
  assert.match(locale['sync-report-partial'], /nepratęsia ir neatšaukia/);
  assert.match(locale['sync-estimate-field-hint'], /null reikšmė išvalo/);
  assert.match(locale['sync-time-estimate-hint'], /lygiai vienas atitinkamas laukas/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nėra nuliniai įverčiai/);
  assert.match(locale['scrum-partial-report'], /tik šiuo metu jums priskirtos kortelės/);
  assert.match(locale['scrum-daily-observations-help'], /nefiksuoja kiekvieno pakeitimo/);
  assert.match(locale['scrum-daily-observations-export-help'], /nėra nuliai/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `lt: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `lt: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nepradeda iš naujo/);
  assert.match(locale['instance-desc'], /niekada nerodoma neprisijungusiems/);
  assert.match(locale['due-reminder-days-label'], /teigiami.*prieš ją.*neigiami.*po jos/);
  assert.match(locale['notification-activity-description'], /visada gaunami/);
}
{
  const locale = read('lv');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'lv: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `lv: preserve ${token}`);
  }
  assert.equal(locale.board, 'Dēlis');
  assert.equal(locale.list, 'Saraksts');
  assert.match(locale['rule-email-recovery-resend-confirm'], /saņems to divreiz/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /nekad netiks nosūtīts/);
  assert.match(locale['rule-email-legacy-access-denied'], /vairs nav piekļuves/);
  assert.match(locale['r-insert-variable'], /mainīgo/);
  assert.match(locale['email-recovery-confirm-cancel'], /nevarēs atjaunot/);
  assert.match(locale['activity-recovery-cancel-confirm'], /nevarēs atsākt/);
  assert.match(locale['activity-recovery-description'], /nekad neizveido darbību no jauna/);
  assert.match(locale['history-request-hint'], /nekad nevar atsaukt otru izmaiņu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Uz avota sistēmu nekas netiek sūtīts/);
  assert.match(locale['sync-report-partial'], /neturpina un neatsauc/);
  assert.match(locale['sync-estimate-field-hint'], /null vērtība notīra/);
  assert.match(locale['sync-time-estimate-hint'], /tieši vienam atbilstošam laukam/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nav nulles novērtējumi/);
  assert.match(locale['scrum-partial-report'], /tikai jums pašlaik piešķirtās kartiņas/);
  assert.match(locale['scrum-daily-observations-help'], /nereģistrē katru izmaiņu/);
  assert.match(locale['scrum-daily-observations-export-help'], /nav nulle/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `lv: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `lv: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /neatsāk/);
  assert.match(locale['instance-desc'], /nekad netiek rādīts cilvēkiem, kas nav pierakstījušies/);
  assert.match(locale['due-reminder-days-label'], /pozitīvi.*pirms tās.*negatīvi.*pēc tās/);
  assert.match(locale['notification-activity-description'], /vienmēr tiek saņemti/);
}
{
  const locale = read('is');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'is: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `is: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /fá hann tvisvar/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /verður aldrei sendur/);
  assert.match(locale['rule-email-legacy-access-denied'], /ekki lengur aðgang/);
  assert.match(locale['r-insert-variable'], /breytu/);
  assert.match(locale['email-recovery-confirm-cancel'], /ekki verður hægt að endurheimta/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ekki verður hægt að halda henni áfram/);
  assert.match(locale['activity-recovery-description'], /býr aldrei til aðgerðina aftur/);
  assert.match(locale['history-request-hint'], /aldrei afturkallað aðra breytingu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ekkert er sent til upprunakerfisins/);
  assert.match(locale['sync-report-partial'], /halda ekki áfram keyrslu eða afturkalla/);
  assert.match(locale['sync-estimate-field-hint'], /null hreinsar/);
  assert.match(locale['sync-time-estimate-hint'], /Nákvæmlega einn samsvarandi reitur/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ekki núllmat/);
  assert.match(locale['scrum-partial-report'], /aðeins spjöld sem þér eru nú úthlutuð/);
  assert.match(locale['scrum-daily-observations-help'], /skrá ekki hverja breytingu/);
  assert.match(locale['scrum-daily-observations-export-help'], /ekki núll/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `is: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `is: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /endurstillir ekki/);
  assert.match(locale['instance-desc'], /aldrei sýnd fólki sem er ekki innskráð/);
  assert.match(locale['due-reminder-days-label'], /jákvæðar.*fyrir hann.*neikvæðar.*eftir hann/);
  assert.match(locale['notification-activity-description'], /berast alltaf/);
}
for (const code of ['af', 'af_ZA']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /twee keer ontvang/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /nooit gestuur word nie/);
  assert.match(locale['rule-email-legacy-access-denied'], /nie meer toegang/);
  assert.match(locale['r-insert-variable'], /veranderlike/);
  assert.match(locale['email-recovery-confirm-cancel'], /kan nie herstel word nie/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kan nie hervat word nie/);
  assert.match(locale['activity-recovery-description'], /skep nooit.*opnuut nie/);
  assert.match(locale['history-request-hint'], /nooit.*tweede verandering ongedaan maak nie/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Niks word na die bronstelsel gestuur nie/);
  assert.match(locale['sync-report-partial'], /hervat nie.*ongedaan nie/);
  assert.match(locale['sync-estimate-field-hint'], /null maak die gekoppelde waarde leeg/);
  assert.match(locale['sync-time-estimate-hint'], /Presies een ooreenstemmende veld/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nie nulramings nie/);
  assert.match(locale['scrum-partial-report'], /slegs kaarte wat tans aan jou toegewys is/);
  assert.match(locale['scrum-daily-observations-help'], /teken nie elke verandering aan/);
  assert.match(locale['scrum-daily-observations-export-help'], /nie nul nie/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /stel nie sy tyd in die lys terug nie/);
  assert.match(locale['instance-desc'], /nooit aan mense gewys wat nie aangemeld is nie/);
  assert.match(locale['due-reminder-days-label'], /positiewe.*daarvoor.*negatiewe.*daarna/);
  assert.match(locale['notification-activity-description'], /kom altyd aan/);
}
for (const code of ['hi', 'hi-IN']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /दो बार मिलेगा/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /कभी नहीं भेजा जाएगा/);
  assert.match(locale['rule-email-legacy-access-denied'], /अब इस कार्ड की पहुँच नहीं है/);
  assert.match(locale['r-insert-variable'], /चर/);
  assert.match(locale['email-recovery-confirm-cancel'], /वापस नहीं लाई जा सकेगी/);
  assert.match(locale['activity-recovery-cancel-confirm'], /फिर शुरू नहीं किया जा सकता/);
  assert.match(locale['activity-recovery-description'], /कभी गतिविधि को दोबारा नहीं बनाता/);
  assert.match(locale['history-request-hint'], /कभी दूसरे बदलाव को वापस नहीं ले सकता/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /स्रोत सिस्टम को कुछ भी नहीं भेजा जाता/);
  assert.match(locale['sync-report-partial'], /फिर शुरू नहीं करतीं.*बदलाव वापस/);
  assert.match(locale['sync-estimate-field-hint'], /null.*मान को साफ़/);
  assert.match(locale['sync-time-estimate-hint'], /ठीक एक मेल खाता फ़ील्ड/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /शून्य अनुमान नहीं हैं/);
  assert.match(locale['scrum-partial-report'], /केवल वे कार्ड.*अभी आपको नियुक्त/);
  assert.match(locale['scrum-daily-observations-help'], /हर बदलाव दर्ज नहीं करते/);
  assert.match(locale['scrum-daily-observations-export-help'], /शून्य नहीं हैं/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /फिर से शुरू नहीं होती/);
  assert.match(locale['instance-desc'], /कभी नहीं दिखाया जाता/);
  assert.match(locale['due-reminder-days-label'], /धनात्मक.*पहले.*ऋणात्मक.*बाद/);
  assert.match(locale['notification-activity-description'], /हमेशा मिलते हैं/);
}
{
  const locale = read('bn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'bn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `bn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /দুবার পাবেন/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /কখনো পাঠানো হবে না/);
  assert.match(locale['rule-email-legacy-access-denied'], /আর প্রবেশাধিকার নেই/);
  assert.match(locale['r-insert-variable'], /ভেরিয়েবল/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /পুনরুদ্ধার করা যাবে না.*নতুন বার্তাগুলো রাখা হবে/);
  assert.match(locale['activity-recovery-cancel-confirm'], /আবার চালু করা যাবে না.*ফিরিয়ে আনা হবে না/);
  assert.match(locale['activity-recovery-description'], /কখনো কার্যকলাপ পুনরায় তৈরি হয় না/);
  assert.match(locale['history-request-hint'], /দ্বিতীয় কোনো পরিবর্তন ফিরিয়ে নিতে পারে না/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /উৎস সিস্টেমে কিছুই পাঠানো হয় না/);
  assert.match(locale['sync-report-partial'], /আবার শুরু করে না.*পরিবর্তন ফিরিয়ে নেয় না/);
  assert.match(locale['sync-estimate-field-hint'], /null সংযুক্ত মান মুছে দেয়/);
  assert.match(locale['sync-time-estimate-hint'], /ঠিক একটি মিলে যাওয়া ঘর/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /শূন্য প্রাক্কলন নয়/);
  assert.match(locale['scrum-partial-report'], /কেবল বর্তমানে আপনাকে বরাদ্দ/);
  assert.match(locale['scrum-daily-observations-help'], /প্রতিটি পরিবর্তন নথিভুক্ত করে না/);
  assert.match(locale['scrum-daily-observations-export-help'], /অজানা প্রাক্কলন শূন্য নয়/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `bn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `bn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /নতুন করে শুরু হয় না/);
  assert.match(locale['instance-desc'], /কখনো দেখানো হয় না/);
  assert.match(locale['due-reminder-days-label'], /ধনাত্মক.*আগের.*ঋণাত্মক.*পরের/);
  assert.match(locale['notification-activity-description'], /সবসময় আসে/);
}
{
  const locale = read('ta');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ta: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ta: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /இருமுறை கிடைக்கும்/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ஒருபோதும் அனுப்பப்படாது/);
  assert.match(locale['rule-email-legacy-access-denied'], /உரிமை இனி இல்லை/);
  assert.match(locale['r-insert-variable'], /மாறியை/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /மீட்டெடுக்க முடியாது.*புதிய செய்திகள் வைத்திருக்கப்படும்/);
  assert.match(locale['activity-recovery-cancel-confirm'], /மீண்டும் தொடர முடியாது.*திரும்பப் பெறப்படாது/);
  assert.match(locale['activity-recovery-description'], /ஒருபோதும் செயல்பாட்டை மீண்டும் உருவாக்காது/);
  assert.match(locale['history-request-hint'], /இரண்டாவது மாற்றத்தை ஒருபோதும் திரும்பப் பெறாது/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /மூல அமைப்பிற்கு எதுவும் அனுப்பப்படாது/);
  assert.match(locale['sync-report-partial'], /தொடரவோ மாற்றங்களைத் திரும்பப் பெறவோ முடியாது/);
  assert.match(locale['sync-estimate-field-hint'], /null இணைக்கப்பட்ட மதிப்பை அழிக்கும்/);
  assert.match(locale['sync-time-estimate-hint'], /பொருந்தும் புலம் சரியாக ஒன்று/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /பூஜ்ஜிய மதிப்பீடுகள் அல்ல/);
  assert.match(locale['scrum-partial-report'], /உங்களுக்கு ஒதுக்கப்பட்ட அட்டைகள் மட்டுமே/);
  assert.match(locale['scrum-daily-observations-help'], /ஒவ்வொரு மாற்றத்தையும் பதிவு செய்வதில்லை/);
  assert.match(locale['scrum-daily-observations-export-help'], /தெரியாத மதிப்பீடுகள் பூஜ்ஜியம் அல்ல/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ta: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ta: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /மீண்டும் தொடங்காது/);
  assert.match(locale['instance-desc'], /ஒருபோதும் காட்டப்படாது/);
  assert.match(locale['due-reminder-days-label'], /நேர்மறை.*முந்தைய.*எதிர்மறை.*பிந்தைய/);
  assert.match(locale['notification-activity-description'], /எப்போதும் வரும்/);
}
{
  const locale = read('ne');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ne: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ne: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /दुई पटक पाउनेछन्/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /कहिल्यै पठाइने छैन/);
  assert.match(locale['rule-email-legacy-access-denied'], /पहुँच छैन/);
  assert.match(locale['r-insert-variable'], /चर राख्नुहोस्/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /पुनर्स्थापित गर्न सकिने छैन.*नयाँ सन्देशहरू राखिन्छन्/);
  assert.match(locale['activity-recovery-cancel-confirm'], /फेरि सुरु गर्न सकिँदैन.*फिर्ता लिइँदैनन्/);
  assert.match(locale['activity-recovery-description'], /गतिविधि कहिल्यै पुनः सिर्जना हुँदैन/);
  assert.match(locale['history-request-hint'], /दोस्रो परिवर्तन कहिल्यै उल्टाउन सक्दैन/);
  assert.equal(locale['blockly-LOGIC_NULL'], 'मान छैन');
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /स्रोत प्रणालीमा केही पनि पठाइँदैन/);
  assert.match(locale['sync-report-partial'], /फेरि सुरु गर्दैनन्.*परिवर्तन उल्टाउँदैनन्/);
  assert.match(locale['sync-estimate-field-hint'], /null ले सम्बन्धित मान खाली गर्छ/);
  assert.match(locale['sync-time-estimate-hint'], /ठ्याक्कै एउटा मिल्दो फिल्ड/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /शून्य अनुमान होइनन्/);
  assert.match(locale['scrum-partial-report'], /तपाईंलाई तोकिएका कार्डहरू मात्र/);
  assert.match(locale['scrum-daily-observations-help'], /हरेक परिवर्तन अभिलेख गर्दैनन्/);
  assert.match(locale['scrum-daily-observations-export-help'], /अज्ञात अनुमानहरू शून्य होइनन्/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ne: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ne: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /फेरि सुरु हुँदैन/);
  assert.match(locale['instance-desc'], /कहिल्यै देखाइँदैन/);
  assert.match(locale['due-reminder-days-label'], /धनात्मक.*अघिका.*ऋणात्मक.*पछिका/);
  assert.match(locale['notification-activity-description'], /सधैँ आउँछन्/);
}
{
  const locale = read('ur');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ur: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ur: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /دو بار ملے گی/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /کبھی نہیں بھیجی جائے گی/);
  assert.match(locale['rule-email-legacy-access-denied'], /رسائی نہیں ہے/);
  assert.match(locale['r-insert-variable'], /متغیر داخل کریں/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /بحال نہیں کیا جا سکے گا.*نئے پیغامات برقرار رہیں گے/);
  assert.match(locale['activity-recovery-cancel-confirm'], /دوبارہ جاری نہیں کیا جا سکتا.*واپس نہیں لی جائیں گی/);
  assert.match(locale['activity-recovery-description'], /کبھی سرگرمی کو دوبارہ نہیں بناتی/);
  assert.match(locale['history-request-hint'], /کبھی دوسری تبدیلی واپس نہیں لے سکتی/);
  assert.equal(locale['blockly-LOGIC_NULL'], 'کوئی قدر نہیں');
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ماخذ نظام کو کچھ بھی نہیں بھیجا جاتا/);
  assert.match(locale['sync-report-partial'], /دوبارہ شروع نہیں کرتیں.*تبدیلیاں واپس/);
  assert.match(locale['sync-estimate-field-hint'], /null منسلک قدر کو صاف/);
  assert.match(locale['sync-time-estimate-hint'], /بالکل ایک مماثل خانہ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /صفر تخمینے نہیں ہیں/);
  assert.match(locale['scrum-partial-report'], /صرف وہ کارڈز.*آپ کو تفویض/);
  assert.match(locale['scrum-daily-observations-help'], /ہر تبدیلی درج نہیں کرتے/);
  assert.match(locale['scrum-daily-observations-export-help'], /نامعلوم تخمینے صفر نہیں ہیں/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ur: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ur: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /دوبارہ شروع نہیں ہوتی/);
  assert.match(locale['instance-desc'], /کبھی نہیں دکھایا جاتا/);
  assert.match(locale['due-reminder-days-label'], /مثبت.*پہلے.*منفی.*بعد/);
  assert.match(locale['notification-activity-description'], /ہمیشہ آتے ہیں/);
}
{
  const locale = read('th');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'th: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `th: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /จะได้รับสองครั้ง/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /จะไม่ถูกส่งอีกเลย/);
  assert.match(locale['rule-email-legacy-access-denied'], /ไม่มีสิทธิ์เข้าถึง/);
  assert.match(locale['r-insert-variable'], /แทรกตัวแปร/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /ไม่สามารถกู้คืนได้.*ข้อความใหม่.*จะยังคงอยู่/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ไม่สามารถดำเนินการต่อได้.*จะไม่ถูกเรียกคืน/);
  assert.match(locale['activity-recovery-description'], /จะไม่สร้างกิจกรรมขึ้นมาอีก/);
  assert.match(locale['history-request-hint'], /ไม่สามารถย้อนกลับการเปลี่ยนแปลงที่สองได้/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ไม่มีข้อมูลใดส่งไปยังระบบต้นทาง/);
  assert.match(locale['sync-report-partial'], /ไม่ดำเนินงานต่อหรือย้อนกลับ/);
  assert.match(locale['sync-estimate-field-hint'], /null ที่ระบุชัดเจนจะล้างค่า/);
  assert.match(locale['sync-time-estimate-hint'], /ช่องที่ตรงกันเพียงหนึ่งช่อง/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ไม่ใช่ค่าประมาณศูนย์/);
  assert.match(locale['scrum-partial-report'], /เฉพาะการ์ดที่มอบหมายให้คุณ/);
  assert.match(locale['scrum-daily-observations-help'], /ไม่ได้บันทึกทุกการเปลี่ยนแปลง/);
  assert.match(locale['scrum-daily-observations-export-help'], /ค่าประมาณที่ไม่ทราบไม่ใช่ศูนย์/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `th: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `th: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /จะไม่เริ่มนับ/);
  assert.match(locale['instance-desc'], /จะไม่แสดงให้ผู้ที่ไม่ได้เข้าสู่ระบบเห็น/);
  assert.match(locale['due-reminder-days-label'], /จำนวนบวก.*ก่อนหน้า.*จำนวนลบ.*หลัง/);
  assert.match(locale['notification-activity-description'], /จะยังส่งเสมอ/);
}
{
  const locale = read('gu-IN');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'gu-IN: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `gu-IN: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /બે વાર મળશે/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ક્યારેય મોકલાશે નહીં/);
  assert.match(locale['rule-email-legacy-access-denied'], /પ્રવેશ નથી/);
  assert.match(locale['r-insert-variable'], /ચલ ઉમેરો/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /પુનઃસ્થાપિત કરી શકાશે નહીં.*નવા સંદેશો રાખવામાં આવશે/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ફરી ચાલુ કરી શકાશે નહીં.*પાછાં ખેંચાશે નહીં/);
  assert.match(locale['activity-recovery-description'], /પ્રવૃત્તિ ક્યારેય ફરી બનતી નથી/);
  assert.match(locale['history-request-hint'], /બીજા ફેરફારને ક્યારેય પાછો લઈ શકતું નથી/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /સ્રોત સિસ્ટમને કંઈ મોકલાતું નથી/);
  assert.match(locale['sync-report-partial'], /ફરી શરૂ કરતા નથી.*ફેરફારો પાછા લેતા નથી/);
  assert.match(locale['sync-estimate-field-hint'], /null જોડાયેલું મૂલ્ય સાફ/);
  assert.match(locale['sync-time-estimate-hint'], /બરાબર એક મેળ ખાતું ક્ષેત્ર/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /શૂન્ય અંદાજ નથી/);
  assert.match(locale['scrum-partial-report'], /તમને સોંપેલા કાર્ડ જ/);
  assert.match(locale['scrum-daily-observations-help'], /દરેક ફેરફાર નોંધતાં નથી/);
  assert.match(locale['scrum-daily-observations-export-help'], /અજ્ઞાત અંદાજ શૂન્ય નથી/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `gu-IN: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `gu-IN: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ફરી શરૂ થતી નથી/);
  assert.match(locale['instance-desc'], /ક્યારેય દેખાડવામાં આવતું નથી/);
  assert.match(locale['due-reminder-days-label'], /ધન.*પહેલાંના.*ઋણ.*પછીના/);
  assert.match(locale['notification-activity-description'], /હંમેશાં આવે છે/);
}
{
  const locale = read('kn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'kn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `kn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ಎರಡು ಬಾರಿ ತಲುಪುತ್ತದೆ/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ಎಂದಿಗೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['rule-email-legacy-access-denied'], /ಇನ್ನು ಪ್ರವೇಶವಿಲ್ಲ/);
  assert.match(locale['r-insert-variable'], /ಚರವನ್ನು ಸೇರಿಸಿ/);
  assert.match(locale['email-recovery-confirm-cancel'], /ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ/);
  assert.match(locale['email-recovery-description'], /ಮತ್ತೆ ಆಗಬಹುದು/);
  assert.match(locale['activity-recovery-description'], /ಎಂದಿಗೂ ಮರುಸೃಷ್ಟಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ಮುಂದುವರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ/);
  assert.match(locale['history-request-hint'], /ಎರಡನೇ ಬದಲಾವಣೆಯನ್ನು ಎಂದಿಗೂ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ಏನನ್ನೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['sync-report-partial'], /ಮುಂದುವರಿಸುವುದಿಲ್ಲ.*ರದ್ದುಗೊಳಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['sync-estimate-field-hint'], /null.*ತೆರವುಗೊಳಿಸುತ್ತದೆ/);
  assert.match(locale['sync-time-estimate-hint'], /ನಿಖರವಾಗಿ ಒಂದೇ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ಶೂನ್ಯ ಅಂದಾಜುಗಳಲ್ಲ/);
  assert.match(locale['scrum-partial-report'], /ನಿಮಗೆ ನಿಯೋಜಿಸಿದ ಕಾರ್ಡ್‌ಗಳು ಮಾತ್ರ/);
  assert.match(locale['scrum-daily-observations-help'], /ಪ್ರತಿಯೊಂದು ಬದಲಾವಣೆಯನ್ನು ದಾಖಲಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['scrum-daily-observations-export-help'], /ತಿಳಿಯದ ಅಂದಾಜುಗಳು ಶೂನ್ಯವಲ್ಲ/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `kn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `kn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ಮತ್ತೆ ಪ್ರಾರಂಭವಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['instance-desc'], /ಎಂದಿಗೂ ತೋರಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['due-reminder-days-label'], /ಧನಾತ್ಮಕ.*ಹಿಂದಿನ.*ಋಣಾತ್ಮಕ.*ನಂತರದ/);
  assert.match(locale['notification-activity-description'], /ಯಾವಾಗಲೂ ಬರುತ್ತವೆ/);
}
{
  const locale = read('ga');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ga: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ga: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /faoi dhó/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ní sheolfar é riamh/);
  assert.match(locale['rule-email-legacy-access-denied'], /Níl rochtain.*a thuilleadh/);
  assert.match(locale['r-insert-variable'], /Cuir athróg isteach/);
  assert.match(locale['email-recovery-confirm-cancel'], /ní féidir é a athchóiriú/);
  assert.match(locale['email-recovery-description'], /seachadadh neamhchinnte a dhéanamh arís/);
  assert.match(locale['activity-recovery-description'], /Ní athchruthaíonn.*riamh/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ní féidir leanúint leis seo/);
  assert.match(locale['history-request-hint'], /ní féidir.*an dara hathrú a chealú riamh/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ga: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ga: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Ní athshocraíonn/);
  assert.match(locale['instance-desc'], /Ní thaispeántar riamh/);
  assert.match(locale['due-reminder-days-label'], /deimhneacha.*roimhe.*diúltacha.*ina dhiaidh/);
  assert.match(locale['notification-activity-description'], /i gcónaí/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ní meastacháin nialasacha iad/);
  assert.match(locale['scrum-partial-report'], /ach cártaí atá sannta duit/);
  assert.match(locale['scrum-daily-observations-help'], /Ní thaifeadann.*gach athrú/);
  assert.match(locale['scrum-daily-observations-export-help'], /Ní hionann meastacháin anaithnide agus nialas/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ní sheoltar aon rud/);
  assert.match(locale['sync-report-partial'], /Ní atosaíonn.*ní chealaíonn/);
  assert.match(locale['sync-estimate-field-hint'], /glanann null follasach/);
  assert.match(locale['sync-time-estimate-hint'], /amháin go díreach/);
}
{
  const locale = read('co');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'co: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `co: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /duie volte/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ùn serà mai mandatu/);
  assert.match(locale['rule-email-legacy-access-denied'], /ùn hà più accessu/);
  assert.match(locale['r-insert-variable'], /Inserisce una variabile/);
  assert.match(locale['email-recovery-confirm-cancel'], /ùn puderà esse ristabilitu/);
  assert.match(locale['email-recovery-description'], /mandata incerta pò esse ripetuta/);
  assert.match(locale['activity-recovery-description'], /ùn ricrea mai/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ùn si puderà ripiglialla/);
  assert.match(locale['history-request-hint'], /ùn pò mai annullà un secondu cambiamentu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `co: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `co: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ùn rimette micca à zeru/);
  assert.match(locale['instance-desc'], /Ùn hè mai mustrata/);
  assert.match(locale['due-reminder-days-label'], /pusitivi.*nanzu.*negativi.*dopu/);
  assert.match(locale['notification-activity-description'], /ghjunghjenu sempre/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ùn sò micca stime à zeru/);
  assert.match(locale['scrum-partial-report'], /solu e carte attualmente assignate à voi/);
  assert.match(locale['scrum-daily-observations-help'], /ùn arregistranu micca ogni cambiamentu/);
  assert.match(locale['scrum-daily-observations-export-help'], /E stime scunnisciute ùn sò micca zeru/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nunda hè mandatu/);
  assert.match(locale['sync-report-partial'], /ùn ripiglianu micca.*ùn annullanu micca/);
  assert.match(locale['sync-estimate-field-hint'], /null esplicitu sguassa/);
  assert.match(locale['sync-time-estimate-hint'], /esattamente un campu/);
}
{
  const locale = read('sc');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'sc: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `sc: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /duas bortas/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Non at a èssere imbiadu mai/);
  assert.match(locale['rule-email-legacy-access-denied'], /non tenet prus atzessu/);
  assert.match(locale['r-insert-variable'], /Inserta una variàbile/);
  assert.match(locale['email-recovery-confirm-cancel'], /non podet èssere ripristinadu/);
  assert.match(locale['email-recovery-description'], /imbiu incertu podet èssere repetidu/);
  assert.match(locale['activity-recovery-description'], /non torrat mai a creare/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Non si podet sighire a pustis/);
  assert.match(locale['history-request-hint'], /non podet mai annullare unu segundu càmbiu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `sc: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `sc: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /non torrat a zero/);
  assert.match(locale['instance-desc'], /Non est ammustrada mai/);
  assert.match(locale['due-reminder-days-label'], /positivos.*in antis.*negativos.*a pustis/);
  assert.match(locale['notification-activity-description'], /arribant semper/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /non sunt istimas a zero/);
  assert.match(locale['scrum-partial-report'], /isceti is cartas assignadas a tie/);
  assert.match(locale['scrum-daily-observations-help'], /non registrant cada càmbiu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Is istimas disconnotas non sunt zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nudda est imbiadu/);
  assert.match(locale['sync-report-partial'], /non torrant a aviare.*non annullant/);
  assert.match(locale['sync-estimate-field-hint'], /null esplìtzitu cantzellat/);
  assert.match(locale['sync-time-estimate-hint'], /esatamente unu campu/);
}
{
  const locale = read('scn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'scn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `scn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /du' voti/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nun veni mannatu mai/);
  assert.match(locale['rule-email-legacy-access-denied'], /nun avi cchiù accessu/);
  assert.match(locale['r-insert-variable'], /Nserisci na variàbbili/);
  assert.match(locale['email-recovery-confirm-cancel'], /nun si pò ripristinari/);
  assert.match(locale['email-recovery-description'], /nviu ncertu pò èssiri ripitutu/);
  assert.match(locale['activity-recovery-description'], /nun ricrea mai/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun si pò ripigghiari/);
  assert.match(locale['history-request-hint'], /nun pò mai annullari un secunnu canciamentu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `scn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `scn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun azzera/);
  assert.match(locale['instance-desc'], /Nun veni ammustrata mai/);
  assert.match(locale['due-reminder-days-label'], /pusitivi.*prima.*nigativi.*doppu/);
  assert.match(locale['notification-activity-description'], /arrìvanu sempri/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun sunnu stimi a zeru/);
  assert.match(locale['scrum-partial-report'], /sulu li carti assignati a tia/);
  assert.match(locale['scrum-daily-observations-help'], /nun riggìstranu ogni canciamentu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Li stimi scunusciuti nun sunnu zeru/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nenti veni mannatu/);
  assert.match(locale['sync-report-partial'], /nun ripìgghianu.*nun annùllanu/);
  assert.match(locale['sync-estimate-field-hint'], /null esplìcitu cancella/);
  assert.match(locale['sync-time-estimate-hint'], /esattamenti un campu/);
}
{
  const locale = read('nap');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'nap: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `nap: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ddoje vote/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nun vene mannato maje/);
  assert.match(locale['rule-email-legacy-access-denied'], /nun tene cchiù accesso/);
  assert.match(locale['r-insert-variable'], /Miette na variabbile/);
  assert.match(locale['email-recovery-confirm-cancel'], /nun se pò ripristinà/);
  assert.match(locale['email-recovery-description'], /mannata ncerta pò essere ripetuta/);
  assert.match(locale['activity-recovery-description'], /nun ricrea maje/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun se pò ripiglià/);
  assert.match(locale['history-request-hint'], /nun pò maje annullà nu secunno cagnamento/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `nap: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `nap: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun azzera/);
  assert.match(locale['instance-desc'], /Nun vene mustrata maje/);
  assert.match(locale['due-reminder-days-label'], /positive.*primma.*negative.*doppo/);
  assert.match(locale['notification-activity-description'], /arrivano sempe/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun songo stime a zero/);
  assert.match(locale['scrum-partial-report'], /carte assignate a te mo/);
  assert.match(locale['scrum-daily-observations-help'], /nun registrano ogni cagnamento/);
  assert.match(locale['scrum-daily-observations-export-help'], /stime scanusciute nun songo zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Niente vene mannato/);
  assert.match(locale['sync-report-partial'], /nun ripigliano.*nun annullano/);
  assert.match(locale['sync-estimate-field-hint'], /null esplicito scancella/);
  assert.match(locale['sync-time-estimate-hint'], /esattamente nu campo/);
}
{
  const locale = read('an');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'an: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `an: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos vegadas/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nunca no se ninviará/);
  assert.match(locale['rule-email-legacy-access-denied'], /ya no tiene acceso/);
  assert.match(locale['r-insert-variable'], /Fica una variable/);
  for (const key of ['r-when', 'r-when-due', 'r-when-card-in-list',
    'r-when-a-card', 'r-when-a-label-is', 'r-when-the-label',
    'r-when-a-member', 'r-when-the-member', 'r-when-a-assignee']) {
    assert.match(locale[key], /^Quan/);
    assert.doesNotMatch(locale[key], /^Cuando/);
  }
  assert.match(locale['last-admin-desc'], /a lo menos un administrador/);
  assert.match(locale['fixed-list-width-note'], /nomás ta tu/);
  assert.match(locale['personal-list-width-description'], /se comparten con totz/);
  for (const token of ['== != <= >= && || ( )', 'Field1 == Value1',
    "'Field 1' == 'Value 1'", 'F1 == V1 || F1 == V2',
    'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
    assert.ok(locale['advanced-filter-description'].includes(token), `an: filter example ${token}`);
  }
  const escapedExample = english['advanced-filter-description'].match(/Field1 == I[^.]+/)[0];
  assert.ok(locale['advanced-filter-description'].includes(escapedExample));
  assert.match(locale['enable-permanent-delete-description'], /no borra cosa por sí mesmo/);
  assert.match(locale['remove-member-pop'], /Rezibirá un aviso/);
  assert.doesNotMatch(locale['remove-member-pop'], /En ellas se mostrará/);
  assert.match(locale['swimlane-delete-pop'], /No se puede desfer/);
  assert.match(locale['roles-status-desc'], /Nomás lectura/);
  assert.match(locale['api-no-calls'], /WITH_API=true/);
  for (const key of ['above-selected-card', 'above-selected-swimlane']) {
    assert.match(locale[key], /^Dencima /);
  }
  for (const key of ['below-selected-card', 'below-selected-swimlane']) {
    assert.match(locale[key], /^Debaixo /);
  }
  for (const key of ['activity-delete-attach', 'activity-delete-attach-card']) {
    assert.match(locale[key], /ha borrau un adchunto/);
  }
  for (const key of ['act-addAttachment', 'act-addSubtask', 'act-addLabel',
    'act-addedLabel', 'act-addChecklist', 'act-addChecklistItem', 'act-createList',
    'act-joinMember', 'activity-checklist-item-added']) {
    assert.match(locale[key], /[Hh]a adhibiu/);
    assert.doesNotMatch(locale[key], /añadid[oa]/);
  }
  assert.match(locale['act-editComment'], /ha editau o comentario/);
  assert.match(locale['act-completeChecklist'], /ha rematau/);
  assert.match(locale['act-uncompleteChecklist'], /como sin rematar/);
  assert.match(locale['act-moveCard'], /dende a lista __oldList__.*ta la lista __list__/);
  assert.match(locale['act-moveCardToOtherBoard'], /d'o tablero __oldBoard__.*d'o tablero __board__/);
  assert.match(locale['activity-checklist-item-removed'], /ha sacau.*comprebación/);
  for (const key of ['multi-selection-active', 'click-to-enable-fixed-list-width',
    'click-to-disable-fixed-list-width', 'keyboard-shortcuts-enabled',
    'keyboard-shortcuts-disabled', 'board-open-and-move-between-remaining-and-workspaces',
    'click-to-star', 'click-to-unstar', 'click-to-star-page', 'click-to-unstar-page',
    'click-to-enable-auto-width', 'click-to-disable-auto-width', 'filter-on-desc',
    'star-board-title', 'set-default-board-title', 'unset-default-board-title',
    'accounts-lockout-click-to-unlock']) {
    assert.match(locale[key], /Fe clic/);
    assert.doesNotMatch(locale[key], /Haz clic|deshabilitado|habilitado/);
  }
  assert.match(locale['map-to-existing-user-desc'], /nunca no puede atorgar más permisos/);
  assert.match(locale['sandstorm-delete-raw-mongodb-confirm'], /no se puede desfer/);
  assert.match(locale['cloud-secret-set'], /deixa-lo vuedo ta conservar-lo/);
  assert.match(locale['push-invite-text'], /vinclo de debaixo/);
  assert.match(locale['push-invite-text'], /Grazias/);
  assert.match(locale['user-can-not-export-card-to-pdf'], /no puede exportar a tarcheta a PDF/);
  for (const key of ['email-enrollAccount-text', 'email-invite-text',
    'email-resetPassword-text', 'email-verifyEmail-text', 'email-invite-register-text']) {
    assert.match(locale[key], /vinclo de debaixo/);
    assert.match(locale[key], /Grazias/);
    assert.doesNotMatch(locale[key], /haz clic|siguiente enlace|Gracias|Querido|Estimado/);
  }
  for (const key of ['kanboard', 'deck', 'openproject', 'issues', 'asana', 'zenkit', 'jira']) {
    assert.match(locale[`import-board-instruction-${key}`], /^Apega /);
    assert.doesNotMatch(locale[`import-board-instruction-${key}`], /se convierten|objeto|tareas/);
  }
  for (const token of ['columns', 'column_name', 'tasks', 'title', 'description',
    'swimlane_name', 'date_due', 'owner', 'tags']) {
    assert.ok(locale['import-board-instruction-kanboard'].includes(token));
  }
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-asana'].includes('GET /tasks'));
  assert.ok(locale['import-board-instruction-asana'].includes('memberships'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  assert.ok(locale['import-board-instruction-jira'].includes('automationRules'));
  for (const token of ['## ', '- [ ]', '- [x]']) {
    assert.ok(locale['import-board-instruction-markdown'].includes(token));
  }
  assert.match(locale['email-smtp-test-text'], /Has ninviau un correu/);
  assert.match(locale['email-recovery-confirm-cancel'], /no se podrán restaurar/);
  assert.match(locale['email-recovery-description'], /ninvío incerto puede repetir-se/);
  assert.match(locale['activity-recovery-description'], /nunca no recrea/);
  assert.match(locale['activity-recovery-cancel-confirm'], /No se puede reprener/);
  assert.match(locale['history-request-hint'], /nunca no puede desfer un segundo cambio/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `an: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `an: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /no reinicia/);
  assert.match(locale['instance-desc'], /Nunca no s\'amuestra/);
  assert.match(locale['due-reminder-days-label'], /positivos.*antes.*negativos.*dimpués/);
  assert.match(locale['notification-activity-description'], /siempre plegan/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /no son estimacions de zero/);
  assert.match(locale['scrum-partial-report'], /tarchetas que tiens asignadas agora/);
  assert.match(locale['scrum-daily-observations-help'], /no rechistran cada cambio/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimacions desconoixidas no son zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /No se ninvía cosa/);
  assert.match(locale['sync-report-partial'], /no reprenen ni desfan/);
  assert.match(locale['sync-estimate-field-hint'], /null explicito borra/);
  assert.match(locale['sync-time-estimate-hint'], /exactament un campo/);
}
{
  const locale = read('ast-ES');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ast-ES: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ast-ES: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos vegaes/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nunca se va unviar/);
  assert.match(locale['rule-email-legacy-access-denied'], /yá nun tien accesu/);
  assert.match(locale['r-insert-variable'], /Inxertar una variable/);
  assert.match(locale['close-board-pop'], /Archivu.*Tolos tableros/);
  assert.doesNotMatch(locale['close-board-pop'], /páxina d'aniciu/);
  assert.match(locale['normal-desc'], /Nun pue camudar los axustes/);
  assert.match(locale['comment-only-desc'], /Namás pue comentar/);
  assert.match(locale['delete-linked-cards-before-this-list'], /ensin desaniciar primero/);
  assert.match(locale['card-archived'], /movióse al archivu/);
  for (const key of ['cards', 'cards-count']) assert.equal(locale[key], 'Tarxetes');
  for (const key of ['cards-count-one', 'cardType-card']) assert.equal(locale[key], 'Tarxeta');
  assert.match(locale['move-card-up'], /p'arriba/);
  assert.match(locale['move-card-down'], /p'abaxo/);
  for (const key of ['add', 'add-attachment', 'add-template',
    'add-card-to-top-of-list', 'add-card-to-bottom-of-list', 'addListPopup-title',
    'add-swimlane', 'add-subtask', 'add-checklist', 'add-checklist-item',
    'add-cover', 'add-label', 'add-list', 'add-after-list', 'add-members',
    'addMemberPopup-title', 'add-template-container', 'add-background-image']) {
    assert.match(locale[key], /^Amestar/);
    assert.doesNotMatch(locale[key], /Añadir/);
  }
  assert.match(locale['card-delete-suggest-archive'], /caltener l'actividá/);
  assert.match(locale['card-archive-suggest-cancel'], /restaurar la tarxeta/);
  assert.match(locale['board-view-timeline-showing'], /na fecha/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /dende/);
  assert.match(locale['activity-archived'], /movióse al archivu/);
  assert.match(locale['cardDeletePopup-title'], /Desaniciar la tarxeta/);
  assert.match(locale['home-board-empty'], /namás un tableru/);
  assert.match(locale['home-board-remove-confirm'], /nun se desanicia/);
  assert.match(locale['add-card'], /Amestar una tarxeta/);
  assert.match(locale['archive-card'], /Mover la tarxeta al archivu/);
  assert.match(locale['and-n-other-card_plural'], /otres __count__ tarxetes/);
  assert.match(locale['restrict-comment-editing'], /Torgar.*comentarios d'otros usuarios/);
  for (const key of ['act-deleteCard', 'act-removeBoard', 'act-removeList',
    'act-removeSwimlane', 'act-createBoard', 'act-importBoard']) {
    assert.match(locale[key], /tableru/);
    assert.doesNotMatch(locale[key], /tarjeta|tablero/);
  }
  assert.equal(locale.save, 'Guardar');
  assert.equal(locale.card, 'Tarxeta');
  assert.equal(locale.board, 'Tableru');
  assert.match(locale['email-sent'], /Corréu unviáu/);
  for (const key of ['kanboard', 'deck', 'openproject', 'issues', 'asana', 'zenkit', 'jira']) {
    assert.match(locale[`import-board-instruction-${key}`], /^Apega/);
    assert.doesNotMatch(locale[`import-board-instruction-${key}`], /tarjetes|tablero/);
  }
  for (const token of ['columns', 'column_name', 'tasks', 'title', 'description',
    'swimlane_name', 'date_due', 'owner', 'tags']) {
    assert.ok(locale['import-board-instruction-kanboard'].includes(token));
  }
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-asana'].includes('GET /tasks'));
  assert.ok(locale['import-board-instruction-asana'].includes('memberships'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  assert.ok(locale['import-board-instruction-jira'].includes('automationRules'));
  assert.match(locale['email-recovery-confirm-cancel'], /nun se puen restaurar/);
  assert.match(locale['email-recovery-description'], /unvíu inciertu pue repetise/);
  assert.match(locale['activity-recovery-description'], /nunca recrea/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun se pue reanudar/);
  assert.match(locale['history-request-hint'], /nunca pue desfacer un segundu cambéu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ast-ES: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ast-ES: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun reinicia/);
  assert.match(locale['instance-desc'], /Nunca s'amuesa/);
  assert.match(locale['due-reminder-days-label'], /positivos.*enantes.*negativos.*dempués/);
  assert.match(locale['notification-activity-description'], /lleguen siempre/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun son estimaciones de cero/);
  assert.match(locale['scrum-partial-report'], /tarxetes que tienes asignaes agora/);
  assert.match(locale['scrum-daily-observations-help'], /nun rexistren cada cambéu/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimaciones desconocíes nun son cero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nun s'unvía nada/);
  assert.match(locale['sync-report-partial'], /nun reanuden nin desfán/);
  assert.match(locale['sync-estimate-field-hint'], /null esplícitu borra/);
  assert.match(locale['sync-time-estimate-hint'], /esautamente un campu/);
}
{
  const locale = read('oc');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'oc: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `oc: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos còps/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Serà pas jamai mandat/);
  assert.match(locale['rule-email-legacy-access-denied'], /a pas pus accès/);
  assert.match(locale['r-insert-variable'], /Inserir una variabla/);
  for (const key of ['cancel', 'move-progress-cancel', 'twoFactorCode-cancel']) {
    assert.equal(locale[key], 'Anullar', `oc:${key}: cancel, not return`);
  }
  assert.match(locale['close-board-pop'], /Archius.*Totes los tablèus/);
  assert.doesNotMatch(locale['close-board-pop'], /acuèlh/i);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /a partir de/);
  assert.match(locale['board-view-timeline-showing'], /estat al/);
  assert.match(locale['card-delete-notice'], /totas las accions/);
  assert.match(locale['card-delete-pop'], /se pòt pas anullar/);
  assert.equal(locale['remove-member-from-card'], 'Levar de la carta');
  assert.equal(locale['deleteVotePopup-title'], 'Suprimir lo vòte ?');
  assert.match(locale['import-map-members'], /^Associar/);
  assert.match(locale['import-members-map'], /que volètz importar/);
  assert.equal(locale['anonymize-account'], 'Anonimizar lo compte');
  for (const phrase of ['definitivament', 'adreça de corrièl', 'suprimís l’avatar',
    'desactiva la connexion', 'consèrvan lor istoric', 'se pòt pas anullar']) {
    assert.ok(locale['anonymize-account-confirm-popup'].includes(phrase), `oc: anonymization ${phrase}`);
  }
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /exportacion|user1|desactivat/);
  assert.match(locale['email-enrollAccount-subject'], /compte es estat creat/);
  assert.doesNotMatch(locale['email-enrollAccount-subject'], /activat/);
  assert.equal(locale['email-addresses'], 'Adreças de corrièl');
  for (const key of ['email-templates-invite-subject', 'email-templates-activity-subject']) {
    assert.match(locale[key], /^Subjècte del corrièl/);
    assert.doesNotMatch(locale[key], /Sujet/);
  }
  for (const key of ['email-templates-invite-body', 'email-templates-activity-body']) {
    assert.match(locale[key], /^Còrs del corrièl/);
  }
  assert.match(locale['import-board-instruction-openproject'], /paquets de trabalh/);
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  for (const token of ['"issues"', '"automationRules"']) {
    assert.ok(locale['import-board-instruction-jira'].includes(token));
  }
  assert.match(locale['import-board-instruction-trello'], /Imprimir e exportar/);
  assert.match(locale['email-recovery-confirm-cancel'], /poiràn pas èsser restaurats/);
  assert.match(locale['email-recovery-description'], /mandadís incert pòt èsser repetit/);
  assert.match(locale['activity-recovery-description'], /torna pas jamai crear/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Se poirà pas reprendre/);
  assert.match(locale['history-request-hint'], /pòt pas jamai anullar un segond cambiament/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `oc: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `oc: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /torna pas metre a zèro/);
  assert.match(locale['instance-desc'], /Es pas jamai afichat/);
  assert.match(locale['due-reminder-days-label'], /positius.*abans.*negatius.*aprèp/);
  assert.match(locale['notification-activity-description'], /arriban totjorn/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /son pas d'estimacions a zèro/);
  assert.match(locale['scrum-partial-report'], /cartas que vos son assignadas ara/);
  assert.match(locale['scrum-daily-observations-help'], /enregistran pas cada cambiament/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimacions desconegudas son pas zèro/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Res es pas mandat/);
  assert.match(locale['sync-report-partial'], /reprenon pas e anullan pas/);
  assert.match(locale['sync-estimate-field-hint'], /null explicit escafa/);
  assert.match(locale['sync-time-estimate-hint'], /exactament un camp/);
}
console.log('Completed translation batches: completeness, tokens, syntax and native vocabulary passed');

{
  const locale = read('br');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'br: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `br: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Enlakaat ur varienn/);
  assert.equal(locale['anonymize-account'], 'Dizanviñ ar gont');
  for (const phrase of ['da vat', 'chomlec’h postel', 'skeudennig',
    'diweredekaet e vo ar c’hevreañ', 'o istor', 'N’haller ket dizober']) {
    assert.ok(locale['anonymize-account-confirm-popup'].includes(phrase), `br: anonymization ${phrase}`);
  }
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /ezporzhiañ|user1|dre ziouer/);
  assert.match(locale['close-board-pop'], /Dielloù.*An holl daolennoù/);
  assert.doesNotMatch(locale['close-board-pop'], /degemer/);
  assert.match(locale['board-view-timeline-showing'], /d’ar mare-mañ/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /adalek/);
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Danvez ar postel/);
    assert.match(locale[`email-templates-${kind}-body`], /^Korf ar postel/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /Sujet|Inviter/);
  }
  assert.equal(locale['email-templates-title'], 'Patromoù postel');
  assert.equal(locale['email-smtp-test-subject'], 'Postel amprouiñ SMTP');
  assert.match(locale['email-recovery-confirm-cancel'], /ne vo ket tu d'e adsevel/);
  assert.match(locale['email-recovery-description'], /c'has diasur bezañ graet div wech/);
  assert.match(locale['activity-recovery-description'], /Ne vez adkrouet obererezh ebet morse/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ne vo ket tu da adkregiñ/);
  assert.match(locale['history-request-hint'], /ne c'hall morse dizober un eil cheñchamant/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `br: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `br: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne adderaou ket/);
  assert.match(locale['instance-desc'], /Ne vez diskouezet morse/);
  assert.match(locale['due-reminder-days-label'], /pozitivel.*a-raok.*negativel.*goude/);
  assert.match(locale['notification-activity-description'], /Degouezhout a ra atav/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /n'int ket istimadennoù zero/);
  assert.match(locale['scrum-report-help'], /reolennoù heñvel hepken/);
  assert.match(locale['scrum-partial-report'], /roet deoc'h bremañ hepken/);
  assert.match(locale['scrum-daily-observations-help'], /Ne enroll ket.*pep cheñchamant/);
  assert.match(locale['scrum-daily-observations-help'], /varrenn ostilhoù.*disoc'hoù ar sprint/);
  assert.match(locale['scrum-daily-observations-export-help'], /istimadennoù dianav n'int ket zero/);
  assert.match(locale['scrum-import-pending'], /N'haller ket kemmañ Scrum nag ezporzhiañ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /N'eus netra kaset/);
  assert.match(locale['sync-report-partial'], /ne zizober ket/);
  assert.match(locale['sync-conflict-review-complete'], /N'eo ket bet kenamzeriet ar roll a-bezh/);
  assert.match(locale['sync-conflict-detach-hint'], /Chom a ra e endalc'had/);
  assert.match(locale['sync-estimate-field-hint'], /null splann a ziverk/);
  assert.match(locale['sync-time-estimate-hint'], /ur vaezienn kenglotus hepken/);
  assert.match(locale['sync-recovery-description'], /ne c'hall ket.*adloc'hañ na dizober/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /div wech/);
  assert.match(locale['rule-email-recovery-actions-hint'], /ne adkas morse/);
  assert.match(locale['rule-email-recovery-actions-hint'], /nann-kadarnaet hepken/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ne vo kaset morse/);
  assert.match(locale['rule-email-legacy-access-denied'], /N'en deus ket mui/);
  assert.match(locale['rule-email-legacy-description'], /ne gaso ket WeKan anezho e-unan/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /erruet pe get/);
  assert.doesNotMatch(locale['rule-email-resolution-resend-uncertain'], /kaset gant berzh/);
}

{
  const locale = read('eu');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'eu: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `eu: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Txertatu aldagaia/);
  assert.match(locale['board-view-timeline-showing'], /Une honetako egoera/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /honetatik/);
  assert.equal(locale['import-map-members'], 'Lotu kideak');
  assert.match(locale['import-members-map'], /Lotu.*zure erabiltzaileekin/);
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /mezuaren gaia/);
    assert.match(locale[`email-templates-${kind}-body`], /mezuaren gorputza/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /Asunto|Gonbidatu/);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /ezin izango dira leheneratu/);
  assert.match(locale['email-recovery-description'], /bidalketa zalantzagarria errepika daiteke/);
  assert.match(locale['activity-recovery-description'], /ez du inoiz jarduera bat birsortzen/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ezin zaio berriro ekin/);
  assert.match(locale['history-request-hint'], /ezin du inoiz bigarren aldaketa bat desegin/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `eu: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `eu: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ez du.*berrabiarazten/);
  assert.match(locale['instance-desc'], /Ez zaie inoiz erakusten/);
  assert.match(locale['due-reminder-days-label'], /positiboak aurreko.*negatiboak ondorengo/);
  assert.match(locale['notification-activity-description'], /beti iristen dira/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ez dira zero estimazioak/);
  assert.match(locale['scrum-report-help'], /irizpide berdinak/);
  assert.match(locale['scrum-partial-report'], /une honetan esleituta dituzun txartelak soilik/);
  assert.match(locale['scrum-daily-observations-help'], /ez dituzte aldaketa guztiak erregistratzen/);
  assert.match(locale['scrum-daily-observations-help'], /tresna-barrako.*sprintaren emaitzak/);
  assert.match(locale['scrum-daily-observations-export-help'], /ezezagunak ez dira zero/);
  assert.match(locale['scrum-import-pending'], /Ezin da Scrum editatu edo txostenik esportatu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ez da ezer bidaltzen/);
  assert.match(locale['sync-report-partial'], /ez dute.*berrekin edo desegiten/);
  assert.match(locale['sync-conflict-review-complete'], /Ez da zerrenda osoaren/);
  assert.match(locale['sync-conflict-detach-hint'], /Edukia WeKanen geratuko da/);
  assert.match(locale['sync-estimate-field-hint'], /null esplizitu batek.*garbitzen/);
  assert.match(locale['sync-time-estimate-hint'], /eremu bakarra/);
  assert.match(locale['sync-recovery-description'], /ezin dituzte.*berrekin edo desegin/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /bi aldiz/);
  assert.match(locale['rule-email-recovery-actions-hint'], /berretsi gabeko hartzaileei soilik/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ez da inoiz bidaliko/);
  assert.match(locale['rule-email-legacy-access-denied'], /ez du jada.*sarbiderik/);
  assert.match(locale['rule-email-legacy-description'], /ez ditu bere kabuz bidaliko/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /iritsi izana edo ez/);
}

for (const code of ['cy', 'cy-GB']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Mewnosod newidyn/);
  assert.equal(locale['import-map-members'], 'Mapio aelodau');
  assert.equal(locale['email-templates-title'], 'Templedi ebost');
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Pwnc yr ebost/);
    assert.match(locale[`email-templates-${kind}-body`], /^Corff yr ebost/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /^Gwahodd|Ebost Pwnc/);
  }
  assert.match(locale['email-templates-activity-subject'], /hysbysu gweithgaredd/);
  assert.match(locale['anonymize-account-confirm-popup'], /gwerthoedd amnewid dienw/);
  assert.match(locale['anonymize-account-confirm-popup'], /yn barhaol/);
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /dros dro/);
  assert.match(locale['email-recovery-confirm-cancel'], /ni ellir ei adfer/);
  assert.match(locale['email-recovery-description'], /dosbarthiad ansicr gael ei ailadrodd/);
  assert.match(locale['activity-recovery-description'], /Nid yw ailgeisio byth yn ail-greu/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ni ellir ei ailddechrau/);
  assert.match(locale['history-request-hint'], /ni all byth ddadwneud ail newid/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Nid yw.*ailosod/);
  assert.match(locale['instance-desc'], /Ni chaiff byth ei ddangos/);
  assert.match(locale['due-reminder-days-label'], /positif.*cyn.*negatif.*ar ôl/);
  assert.match(locale['notification-activity-description'], /bob amser yn cyrraedd/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nid amcangyfrifon sero ydynt/);
  assert.match(locale['scrum-report-help'], /pholisïau cyfatebol/);
  assert.match(locale['scrum-partial-report'], /neilltuo i chi ar hyn o bryd/);
  assert.match(locale['scrum-daily-observations-help'], /Nid yw.*cofnodi pob newid/);
  assert.match(locale['scrum-daily-observations-help'], /bar offer.*canlyniadau'r sbrint/);
  assert.match(locale['scrum-daily-observations-export-help'], /Nid sero yw amcangyfrifon anhysbys/);
  assert.match(locale['scrum-import-pending'], /Nid yw golygu Scrum nac allforio adroddiadau ar gael/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ni anfonir dim/);
  assert.match(locale['sync-report-partial'], /Nid yw.*ailddechrau nac yn dadwneud/);
  assert.match(locale['sync-conflict-review-complete'], /Ni redwyd.*rhestr gyfan/);
  assert.match(locale['sync-conflict-detach-hint'], /ei gynnwys yn aros yn WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /null penodol yn clirio/);
  assert.match(locale['sync-time-estimate-hint'], /union un maes/);
  assert.match(locale['sync-recovery-description'], /ni all.*ailddechrau na dadwneud/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /ddwywaith/);
  assert.match(locale['rule-email-recovery-actions-hint'], /Dim ond at y derbynwyr heb eu cadarnhau/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ni chaiff byth ei anfon/);
  assert.match(locale['rule-email-legacy-access-denied'], /Nid oes.*fynediad.*mwyach/);
  assert.match(locale['rule-email-legacy-description'], /ni fydd WeKan yn eu hanfon ar ei ben ei hun/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /wedi cyrraedd neu beidio/);
}

{
  const locale = read('gd');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'gd: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `gd: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Cuir caochladair/);
  assert.equal(locale['email-templates-title'], 'Teamplaidean puist-d');
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Cuspair puist-d/);
    assert.match(locale[`email-templates-${kind}-body`], /^Bodhaig puist-d/);
  }
  assert.match(locale['email-templates-activity-subject'], /fios gnìomhachd/);
  assert.equal(locale['anonymize-account'], 'Dèan an cunntas gun urra');
  assert.match(locale['anonymize-account-confirm-popup'], /gu buan/);
  assert.match(locale['anonymize-account-confirm-popup'], /clàradh a-steach à comas/);
  assert.match(locale['anonymize-account-confirm-popup'], /cumaidh bùird, cairtean agus beachdan an eachdraidh/);
  assert.match(locale['anonymize-account-confirm-popup'], /Cha ghabh an gnìomh seo a neo-dhèanamh/);
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /às-phortadh|iom-phortadh/);
  assert.match(locale['email-recovery-confirm-cancel'], /cha ghabh a h-aiseag/);
  assert.match(locale['email-recovery-description'], /lìbhrigeadh neo-chinnteach tachairt a-rithist/);
  assert.match(locale['activity-recovery-description'], /Cha chruthaich ath-fheuchainn.*às ùr gu bràth/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Cha ghabh leantainn air a-rithist/);
  assert.match(locale['history-request-hint'], /chan urrainn dha dàrna atharrachadh.*gu bràth/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `gd: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `gd: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Cha chuir deasachadh.*air ais gu neoni/);
  assert.match(locale['instance-desc'], /Cha tèid a shealltainn gu bràth/);
  assert.match(locale['due-reminder-days-label'], /dearbhach.*roimhe.*àicheil.*às a dhèidh/);
  assert.match(locale['notification-activity-description'], /Thig.*an-còmhnaidh/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /chan e tuairmsean neoni/);
  assert.match(locale['scrum-report-help'], /poileasaidhean a tha a' freagairt ri chèile/);
  assert.match(locale['scrum-partial-report'], /air an sònrachadh dhut an-dràsta/);
  assert.match(locale['scrum-daily-observations-help'], /Cha chlàraich.*gach atharrachadh/);
  assert.match(locale['scrum-daily-observations-help'], /bhàr-inneal toraidhean an sprint/);
  assert.match(locale['scrum-daily-observations-export-help'], /Chan eil tuairmsean neo-aithnichte co-ionann ri neoni/);
  assert.match(locale['scrum-import-pending'], /Chan eil deasachadh Scrum no às-phortadh aithisgean ri fhaighinn/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Cha tèid càil a chur/);
  assert.match(locale['sync-report-partial'], /Cha lean.*cha dèan.*neo-dhèanamh/);
  assert.match(locale['sync-conflict-review-complete'], /Cha deach an liosta air fad/);
  assert.match(locale['sync-conflict-detach-hint'], /Fanaidh an susbaint ann an WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /glanaidh null soilleir/);
  assert.match(locale['sync-time-estimate-hint'], /dìreach aon raon/);
  assert.match(locale['sync-recovery-description'], /chan urrainn.*leantainn.*neo-dhèanamh/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dà thuras/);
  assert.match(locale['rule-email-recovery-actions-hint'], /ach dha na faightearan gun dearbhadh/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Cha tèid a chur gu bràth/);
  assert.match(locale['rule-email-legacy-access-denied'], /Chan eil cothrom inntrigidh.*tuilleadh/);
  assert.match(locale['rule-email-legacy-description'], /cha chuir WeKan iad leis fhèin/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /ràinig.*no nach do ràinig/);
}

{
  const locale = read('csb');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'csb: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: no language-label substitute`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `csb: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /slédnégò tekstowégò pòla/);
  const correctedImportKeys = [
    "export-ical-feed",
    "export-card-excel-fields",
    "export-card-subtasks",
    "export-card-field-dates",
    "export-card-attachment-size",
    "export-card-attachment-type",
    "export-card-attachment-uploaded-by",
    "export-card-attachment-uploaded-at",
    "export-card-excel-free",
    "export-card-excel-needed",
    "sorted",
    "list-label-modifiedAt",
    "list-label-short-modifiedAt",
    "list-label-short-title",
    "list-label-short-sort",
    "filter",
    "filter-dates-label",
    "filter-no-due-date",
    "filter-overdue",
    "filter-labels-label",
    "filter-no-label",
    "filter-assignee-label",
    "filter-no-assignee",
    "filter-on",
    "other-filters-label",
    "advanced-filter-label",
    "show-activities",
    "hide-activities",
    "import-board-instruction-asana",
    "import-board-instruction-csv",
    "import-excel-file",
    "import-json-placeholder",
    "import-csv-placeholder",
    "import-json-file",
    "import-trello-json-file",
    "import-trello-zip-file",
    "trello-api-import",
    "trello-api-key",
    "trello-parent-workspace-top",
    "trello-import-results",
    "select-all",
    "unselect-all",
    "trello-import-progress",
    "trello-clear-job",
    "trello-import-errors",
    "copy-to-clipboard",
    "running",
    "paused",
    "info",
    "check-version",
    "initials",
    "invalid-date",
    "invalid-time",
    "joined",
    "label-default"
  ];
  for (const key of correctedImportKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['list-label-short-modifiedAt', 'list-label-short-title', 'list-label-short-sort']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve compact label`);
  }
  for (const token of ['{ "data": [...] }', 'GET /tasks', 'memberships']) {
    assert.ok(locale['import-board-instruction-asana'].includes(token), `csb: preserve Asana ${token}`);
  }
  assert.ok(locale['trello-api-key'].includes('https://trello.com/app-key'));
  assert.match(locale['filter-no-assignee'], /Bez przëpisóny òsobë/);
  assert.match(locale['export-card-field-dates'], /ùsôdzeniô, dostaniô, zaczãcô, terminu, skùńczeniô/);
  const correctedFieldKeys = [
    "font-size-largest",
    "changeAvatarPopup-title",
    "delete-avatar-confirm",
    "deleteAvatarPopup-title",
    "changePermissionsPopup-title",
    "subtasks",
    "click-to-star-page",
    "click-to-unstar-page",
    "clipboard",
    "close-popup",
    "close-card",
    "color-black",
    "color-blue",
    "color-darkgreen",
    "color-gold",
    "color-gray",
    "color-green",
    "color-indigo",
    "color-red",
    "color-silver",
    "color-sky",
    "color-slateblue",
    "color-white",
    "unset-color",
    "comment-placeholder",
    "comment-assigned-only",
    "no-comments",
    "read-only",
    "read-assigned-only",
    "worker",
    "computer",
    "confirm-checklist-delete-popup",
    "confirm-checklist-item-delete-popup",
    "checklistDeletePopup-title",
    "checklistItemDeletePopup-title",
    "copy-link-to-clipboard",
    "copy-text-to-clipboard",
    "custom-field-checkbox",
    "custom-field-currency",
    "custom-field-currency-option",
    "custom-field-dropdown-none",
    "custom-field-dropdown-options-placeholder",
    "custom-field-dropdown-unknown",
    "custom-field-number",
    "custom-field-text",
    "date-format",
    "date-format-yyyy-mm-dd",
    "date-format-dd-mm-yyyy",
    "date-format-mm-dd-yyyy",
    "decline",
    "default-avatar",
    "deleteLabelPopup-title",
    "discard",
    "download",
    "edit-profile",
    "editCardStartDatePopup-title",
    "editCardDueDatePopup-title",
    "editCustomFieldPopup-title",
    "editCardSpentTimePopup-title",
    "editLabelPopup-title",
    "editNotificationPopup-title",
    "editProfilePopup-title",
    "email-enrollAccount-subject",
    "email-enrollAccount-text",
    "email-sent"
  ];
  for (const key of correctedFieldKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['comment-placeholder', 'date-format-yyyy-mm-dd', 'date-format-dd-mm-yyyy', 'date-format-mm-dd-yyyy']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve empty placeholder or format code`);
  }
  assert.equal(locale['color-blue'], 'mòdri');
  assert.equal(locale['color-black'], 'czôrny');
  assert.match(locale['comment-assigned-only'], /Kòmentowanié blós przëpisónëch kôrtów/);
  assert.match(locale['read-assigned-only'], /Òdczët blós przëpisónëch kôrtów/);
  assert.ok(locale['email-enrollAccount-text'].includes('\n\n__url__\n\n'));
  const correctedCardControlKeys = [
    "board-view-table",
    "board-view-stats",
    "calendar-previous-month-label",
    "calendar-next-month-label",
    "card-delete-notice",
    "card-due",
    "card-due-on",
    "card-spent",
    "card-edit-labels",
    "card-start-on",
    "cardCustomField-datePopup-title",
    "positiveVoteMembersPopup-title",
    "negativeVoteMembersPopup-title",
    "editVoteEndDatePopup-title",
    "vote-for-it",
    "vote-against",
    "deleteVotePopup-title",
    "vote-delete-pop",
    "cardStartPlanningPokerPopup-title",
    "card-edit-planning-poker",
    "editPokerEndDatePopup-title",
    "poker-question",
    "poker-one",
    "poker-two",
    "poker-three",
    "poker-five",
    "poker-eight",
    "poker-thirteen",
    "poker-twenty",
    "poker-forty",
    "poker-oneHundred",
    "poker-unsure",
    "poker-finish",
    "poker-result-votes",
    "poker-result-who",
    "set-estimation",
    "deletePokerPopup-title",
    "poker-delete-pop",
    "cardDetailsActionsPopup-title",
    "cardDependencyIconPopup-title",
    "dependencyLinePopup-title",
    "importDependenciesPopup-title",
    "adminChangeAvatarPopup-title",
    "importSwimlanePopup-title",
    "cardStickersPopup-title",
    "invitePeoplePopup-title",
    "rulesImportExportPopup-title",
    "casSignIn",
    "samlSignIn",
    "change",
    "change-avatar",
    "change-permissions",
    "theme-default",
    "theme-category",
    "theme-category-flat",
    "theme-category-clear",
    "theme-category-dark",
    "theme-category-special",
    "font-default",
    "font-size",
    "font-size-default",
    "font-size-smaller",
    "font-size-small",
    "font-size-large",
    "font-size-larger"
  ];
  for (const key of correctedCardControlKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['poker-one', 'poker-two', 'poker-three', 'poker-five', 'poker-eight',
    'poker-thirteen', 'poker-twenty', 'poker-forty', 'poker-oneHundred', 'poker-unsure']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve vote value`);
  }
  for (const key of ['card-delete-notice', 'vote-delete-pop', 'poker-delete-pop']) {
    assert.match(locale[key], /na wiedno.*Stracysz wszëtczé dzejbë/);
  }
  assert.equal(locale['vote-against'], 'procëm');
  assert.match(locale['samlSignIn'], /przez SAML/);
  const correctedActionKeys = [
    "activity-changedTitle",
    "comment-in-reply-to",
    "comment-reply",
    "due-date-changes",
    "due-date-changed-times",
    "actions",
    "activity-added",
    "activity-archived",
    "activity-created",
    "activity-excluded",
    "activity-imported",
    "activity-imported-board",
    "activity-joined",
    "activity-on",
    "activity-sent",
    "activity-unjoined",
    "activity-checked-item",
    "activity-unchecked-item",
    "activity-checklist-added",
    "activity-checklist-completed",
    "activity-checklist-item-added",
    "activity-checked-item-card",
    "activity-unchecked-item-card",
    "activity-receivedDate",
    "activity-startDate",
    "allboards.starred",
    "allboards.remaining",
    "allboards.edit-workspace",
    "allboards.edit-workspace-icon",
    "allboards.workspace-menu",
    "allboards.delete-workspace-confirm",
    "allboards.delete-workspace-confirm-check",
    "selected-label",
    "activity-dueDate",
    "activity-endDate",
    "setListWidthPopup-title",
    "set-list-width",
    "list-width-personal-note",
    "setSwimlaneHeightPopup-title",
    "set-swimlane-height",
    "set-swimlane-height-value",
    "swimlane-height-error-message",
    "close-add-checklist-item",
    "close-edit-checklist-item",
    "added",
    "admin",
    "public-boards",
    "apply",
    "archived-items",
    "archived-boards",
    "archives",
    "attachment-delete-pop",
    "board-change-background-image",
    "board-background-image-url",
    "board-nb-stars",
    "boardChangeBackgroundImagePopup-title",
    "allBoardsChangeBackgroundImagePopup-title",
    "mobile-mode",
    "mobile-desktop-toggle",
    "zoom-level",
    "enter-zoom-level",
    "board-view-cal",
    "board-view-multiboard-cal",
    "board-view-collapse",
    "board-view-gantt"
  ];
  for (const key of correctedActionKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.equal(locale.actions, 'Dzejbë');
  assert.equal(locale['activity-sent'], 'wësłôł %s do %s');
  assert.match(locale['board-view-multiboard-cal'], /wielu tôflów/);
  assert.match(locale['swimlane-height-error-message'], /dodatną całkòwitą lëczbą/);
  assert.match(locale['attachment-delete-pop'], /na wiedno.*Nie mòżna tegò cofnąc/);
  assert.match(locale['email-recovery-confirm-cancel'], /nie mòże bëc przëwróconô/);
  assert.match(locale['email-recovery-description'], /niepewnô wësëłka mòże bëc pòwtórzonô/);
  assert.match(locale['activity-recovery-description'], /nigdë nie ùsôdzô aktiwnoscë znowa/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nie mòżna ji wznowic/);
  assert.match(locale['history-request-hint'], /nigdë nie mòże cofnąc drëdżi zmianë/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `csb: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `csb: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Edycjô kôrtë nie zerëje/);
  assert.match(locale['instance-desc'], /Nigdë nie je pòkôzëwónô/);
  assert.match(locale['due-reminder-days-label'], /dodatné.*przed.*ùjemné.*pò nim/);
  assert.match(locale['notification-activity-description'], /dochòdzą wiedno/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  assert.match(locale['scrum-report-help'], /nie są òszacowaniama zerowima/);
  assert.match(locale['scrum-report-help'], /zgódnëch jednoskach òszacowaniô i zasadach/);
  assert.match(locale['scrum-partial-report'], /terô przëpisóné Tobie/);
  assert.match(locale['scrum-daily-observations-help'], /nie zapisëją kòżdi zmianë/);
  assert.match(locale['scrum-daily-observations-help'], /listwie nôrzãdzów ekspòrtëje rezultatë sprintu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Nieznóné òszacowania nie są zerã/);
  assert.match(locale['scrum-import-pending'], /Edycjô Scrum i ekspòrt rapòrtów nie są przistãpné/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  assert.match(locale['sync-conflict-hint'], /Nic nie je wësëłóné/);
  assert.match(locale['sync-report-partial'], /nie wznôwiają ani nie cofają/);
  assert.match(locale['sync-conflict-review-complete'], /całi lëstë nie bëła ùruchòmionô/);
  assert.match(locale['sync-conflict-detach-hint'], /zamkłosc òstaje w WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /jawnô wôrtnota null czëszczi/);
  assert.match(locale['sync-time-estimate-hint'], /dokładno jedno/);
  assert.match(locale['sync-recovery-description'], /nie mògą wznowic ani cofnąc/);
  assert.equal(locale['rule-email-recovery-recipients'], 'Òdbiérôcze');
  assert.match(locale['rule-email-recovery-resend-confirm'], /dwa razë/);
  assert.match(locale['rule-email-recovery-actions-hint'], /blós do òdbiérôczów bez pòcwierdzeniô/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nigdë nie bãdze wësłóny/);
  assert.match(locale['rule-email-legacy-access-denied'], /ni mô ju przistãpù/);
  assert.match(locale['rule-email-legacy-description'], /WeKan nie wëslë jich sóm/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /mògła dojsc abò nie dojsc/);
}
