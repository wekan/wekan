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
  'pt', 'pt-PT', 'pt_PT', 'pt-BR', 'nl', 'nl-NL', 'sv', 'fi', 'da', 'nb', 'tr', 'id', 'ro', 'hu', 'sk', 'ja', 'ko',
  'zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ar-DZ', 'ar-EG', 'gl', 'gl-ES']) {
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
  [['ro'], /de două ori/, /Nu va fi trimis niciodată/],
  [['hu'], /kétszer/, /Soha nem lesz elküldve/],
  [['sk'], /dvakrát/, /Nikdy nebude odoslaný/],
  [['ja'], /2回届きます/, /今後送信されることはありません/],
  [['ko'], /두 번 받게 됩니다/, /앞으로 절대 전송되지 않습니다/],
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
console.log('Completed translation batches: completeness, tokens, syntax and native vocabulary passed');
