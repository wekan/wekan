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
  'zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ar-DZ', 'ar-EG', 'gl', 'gl-ES', 'he', 'he-IL', 'fa', 'fa-IR', 'ms', 'ms-MY', 'sl', 'sl_SI', 'hr', 'sr']) {
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
console.log('Completed translation batches: completeness, tokens, syntax and native vocabulary passed');
