'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../imports/i18n/data');

test('localized help URLs validate without mistaking percent octets for placeholders', async () => {
  const { validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json'))) {
    const content = fs.readFileSync(path.join(directory, file), 'utf8');
    assert.doesNotThrow(() => validateTranslation(content, en, { allowMissingKeys: file !== 'en.i18n.json' }), file);
  }
});

test('real interpolation tokens remain checked in URL fields and surrounding prose', async () => {
  const { translationTokens: tokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  assert.deepEqual(tokens('https://ar.wikipedia.org/wiki/%D8%B9%D8%AF%D8%AF'), []);
  assert.deepEqual(tokens('https://example.org/%e2%82%ac%20x?literal=%25'), []);
  assert.deepEqual(tokens('Text %D8 __card__ %1 %2 %1$s %{BKY_HELP} %%'),
    ['%%', '%1', '%1$s', '%2', '%D', '%{BKY_HELP}', '__card__'].sort());
  const source = { help: 'Read https://example.org/Number?name=%s&id=__card__ then %1 %{BKY_HELP}' };
  const translated = 'اقرأ https://example.org/%D8%B9?name=%s&id=__card__ ثم %1 %{BKY_HELP}';
  assert.doesNotThrow(() => validateTranslation(JSON.stringify({ help: translated }), source));
  for (const damaged of [translated.replace('%s', ''), translated.replace('__card__', '__wrong__'),
    translated.replace('%1', '%2'), translated.replace('%{BKY_HELP}', '%{BKY_OTHER}'),
    translated.replace('%1', '%1 %1')]) {
    assert.throws(() => validateTranslation(JSON.stringify({ help: damaged }), source), /Broken source placeholders/);
  }
  assert.throws(() => validateTranslation(JSON.stringify({ help: 'https://example.org/%D8%B9' }),
    { help: 'https://example.org/?value=%s' }), /Broken source placeholders/);
});

test('completed locale batches preserve URL schemes and rule variable syntax in translated help', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const codes = ['fi', 'ar', 'ar-DZ', 'ar-EG', 'tr', 'es', 'es-AR', 'es-CL',
    'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'it', 'pt', 'pt-PT',
    'pt_PT', 'pt-BR', 'gl', 'gl-ES', 'ko', 'ko-KR', 'ja', 'ja-JP', 'ja-HI',
    'zh-Hant', 'zh-TW', 'zh-HK', 'zh', 'zh-CN', 'zh-Hans', 'zh-GB', 'zh_SG',
    'cmn', 'fr', 'fr-FR', 'fr-BE', 'fr-CH', 'fr-CA', 'de', 'de-AT', 'de_DE',
    'de-CH', 'sv', 'da', 'nb', 'nl', 'nl-NL', 'ro', 'ro-RO', 'id'];
  const key = 'automatic-linked-url-schemes-hint';
  const english = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')))[key];
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    const value = locale[key];
    const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
    for (const visibilityKey of ['instance', 'instance-desc', 'board-instance-info']) {
      assert.ok(locale[visibilityKey]?.trim(), code + ':' + visibilityKey);
      assert.notEqual(locale[visibilityKey], source[visibilityKey], code + ':' + visibilityKey);
      assert.deepEqual(translationTokens(locale[visibilityKey]),
        translationTokens(source[visibilityKey]), code + ':' + visibilityKey);
    }
    assert.deepEqual(locale['board-instance-info'].match(/<\/?strong>/g),
      ['<strong>', '</strong>'], code + ': visibility emphasis');
    const ruleHelp = locale['r-trigger-vars-hint'];
    assert.ok(ruleHelp?.trim(), code);
    assert.notEqual(ruleHelp, source['r-trigger-vars-hint'], code);
    assert.deepEqual(ruleHelp.match(/\{[^{}]+\}/g),
      source['r-trigger-vars-hint'].match(/\{[^{}]+\}/g), code);
    for (const helpKey of [key, 'r-trigger-vars-hint']) {
      assert.deepEqual(translationTokens(locale[helpKey]), translationTokens(source[helpKey]), code);
    }
    assert.ok(value?.trim(), code);
    assert.notEqual(value, english, code);
    for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
      assert.equal(value.split(scheme).length - 1, 1, code + ':' + scheme);
    }
  }
});


test('notification preferences are translated in audited locales without losing source tokens', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const codes = ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk"];
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  const keys = Object.keys(source).filter(key => key.startsWith('notification-activity-'));
  assert.ok(keys.length >= 13);
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.equal((locale['notification-activity-description'].match(/@/g) || []).length, 1, code);
    assert.notEqual(locale['notification-activity-members'], locale['notification-activity-assignees'], code);
    assert.notEqual(locale['notification-activity-archive'], locale['notification-activity-created'], code);
  }
});


test('automatic archiving preferences are translated in audited locales', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const code of ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk", "hu"]) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    for (const key of ['auto-archive-days', 'auto-archive-off', 'auto-archive-hint']) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.notEqual(locale['auto-archive-days'], locale['auto-archive-off'], code);
  }
});


test('import warning messages are translated in all non-English locales', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  const codes = fs.readdirSync(directory)
    .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file))
    .map(file => file.slice(0, -10));
  assert.equal(codes.length, 234);
  const pending = JSON.parse(fs.readFileSync(path.join(__dirname, '../releases/translations/pending-transifex.json')));
  for (const key of ['import-report-heading', 'import-report-description', 'import-report-open-board']) {
    assert.ok(!pending.keys.some(entry => entry.key === key), key + ': filled group leaves pending inventory');
  }
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    assert.deepEqual(Object.keys(locale), Object.keys(source), code + ': source order');
    for (const key of ['import-report-heading', 'import-report-description', 'import-report-open-board']) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.equal((locale['import-report-description'].match(/[→←]/g) || []).length, 2, code);
    assert.notEqual(locale['import-report-heading'], locale['import-report-open-board'], code);
  }
  for (const [code, problems, recovery] of [
    ['bi', 'Ol problem', 'Putumbak'], ['tpi', 'Ol hevi', 'Putim bek'],
    ['haw', 'Nā pilikia', 'Hoʻihoʻi'],
  ]) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    assert.equal(locale.problems, problems, code);
    assert.equal(locale.recoveryReportTitle, recovery, code);
    assert.ok(locale['import-report-description'].includes(`${problems} → ${recovery}`), code);
    for (const key of ['problems', 'recoveryReportTitle', 'import-report-description']) {
      assert.doesNotMatch(locale[key], /Tok blong sistem:|Toksave: Recovery|palopalemaka|lekolelawa/, code);
    }
  }
  for (const code of ['ak', 'lg', 'wo', 'ss', 'ts', 've', 'wa-RR', 've-CC']) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    assert.ok(locale['import-report-description'].includes(
      `${locale['admin-panel']} → ${locale.problems} → ${locale.recoveryReportTitle}`), code);
    assert.notEqual(locale.problems, locale.recoveryReportTitle, code + ': distinct menus');
    for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) {
      assert.doesNotMatch(locale[key], /Nsɛm a ɛfa dwumadi yi ho|Hi Xitsonga:|Panneau d'administration|Problinmes|Ricweraedje|Iphaneli yokuphatha|U wanululwa/, code);
      if (code === 've-CC') assert.doesNotMatch(locale[key], /Vhuleme/, code);
    }
  }
  const to = JSON.parse(fs.readFileSync(path.join(directory, 'to.i18n.json')));
  assert.equal(to.problems, 'Ngaahi palopalema');
  assert.equal(to.recoveryReportTitle, 'Fakafoki');
  assert.ok(to['import-report-description'].includes(`${to.problems} → ${to.recoveryReportTitle}`));
  for (const key of ['problems', 'recoveryReportTitle', 'import-report-description']) {
    assert.doesNotMatch(to[key], /Faka-Tonga:|Problems|Recovery/, key);
  }
  for (const code of ['qu', 'ay']) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    assert.ok(locale['import-report-description'].includes(
      `${locale['admin-panel']} → ${locale.problems} → ${locale.recoveryReportTitle}`), code);
    assert.notEqual(locale.problems, locale.recoveryReportTitle, code);
    for (const key of ['problems', 'recoveryReportTitle', 'import-report-description']) {
      assert.doesNotMatch(locale[key], /Kay willaymi:|Aymar aruna:|Problems|Recovery/, code);
    }
  }
  const vep = JSON.parse(fs.readFileSync(path.join(directory, 've-PP.i18n.json')));
  assert.equal(vep.recoveryReportTitle, 'Endištand');
  assert.ok(vep['import-report-description'].includes(
    `${vep['admin-panel']} → ${vep.problems} → ${vep.recoveryReportTitle}`));
  assert.doesNotMatch(vep.recoveryReportTitle, /U wanululwa/);
  const wal = JSON.parse(fs.readFileSync(path.join(directory, 'wal.i18n.json')));
  assert.equal(wal.problems, 'Metota');
  assert.equal(wal.recoveryReportTitle, 'Zaaruwaa');
  assert.ok(wal['import-report-description'].includes(
    `${wal['admin-panel']} → ${wal.problems} → ${wal.recoveryReportTitle}`));
  for (const key of ['problems', 'recoveryReportTitle', 'import-report-heading', 'import-report-description', 'import-report-open-board']) {
    assert.doesNotMatch(wal[key], /Wolayttatto:|Problems|Recovery|Open/, key);
  }
  const zgh = JSON.parse(fs.readFileSync(path.join(directory, 'zgh.i18n.json')));
  assert.equal(zgh['admin-panel'], 'ⵜⴰⴼⵍⵡⵉⵜ ⵏ ⵓⵎⵙⵙⵓⴳⵓⵔ');
  assert.ok(zgh['import-report-description'].includes(
    `${zgh['admin-panel']} → ${zgh.problems} → ${zgh.recoveryReportTitle}`));
  for (const key of ['admin-panel', 'import-report-heading', 'import-report-description', 'import-report-open-board']) {
    assert.match(zgh[key], /[\u2d30-\u2d7f]/, key);
    assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/, key);
  }
  const tig = JSON.parse(fs.readFileSync(path.join(directory, 'tig.i18n.json')));
  assert.equal(tig['admin-panel'], 'ምዱድ ለሓክም');
  assert.ok(tig['import-report-description'].includes(
    `${tig['admin-panel']} → ${tig.problems} → ${tig.recoveryReportTitle}`));
  assert.doesNotMatch(tig['admin-panel'], /መምሕዳር ሰሌዳ/);
  const tt = JSON.parse(fs.readFileSync(path.join(directory, 'tt.i18n.json')));
  assert.equal(tt.problems, 'Проблемалар');
  assert.equal(tt.recoveryReportTitle, 'Торгызу');
  assert.ok(tt['import-report-description'].includes(`${tt.problems} → ${tt.recoveryReportTitle}`));
  assert.doesNotMatch(tt['import-report-description'], /Сорунлар|Куртарма/);
});


test('history recovery messages are translated without conflating undo and redo', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const code of ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk", "hu", "uk", "ru", "bg", "ku", "ckb", "tt", "tk_TM", "yi", "ary", "bho", "mai", "or_IN", "kok", "so", "om", "rw", "rn", "ny"]) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    for (const key of ["history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"]) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.notEqual(locale['history-request-pending-undo'], locale['history-request-pending-redo'], code);
    assert.notEqual(locale['history-request-retry'], locale['history-request-forget'], code);
  }
});


test('map view instructions and controls are translated in reviewed locales', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const code of ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk", "hu", "uk", "ru", "bg"]) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    for (const key of ["board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed"]) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.notEqual(locale['map-view-upload'], locale['map-view-remove-image'], code);
    assert.notEqual(locale['map-view-unplaced'], locale['map-view-all-placed'], code);
  }
  const fi = JSON.parse(fs.readFileSync(path.join(directory, 'fi.i18n.json')));
  assert.match(fi['map-view-empty'], /Taulun ylläpitäjä.*pohjapiirroksen, aluekartan tai piirroksen/);
  assert.match(fi['map-view-place-hint'], /Vedä.*tai valitse.*napsauta/);
});


test('multiple-parent card controls are translated in reviewed locales', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const code of ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk", "hu", "uk", "ru", "bg"]) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')));
    for (const key of ["other-parent-cards", "add-parent-card", "remove-parent-card"]) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], source[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ':' + key);
    }
    assert.notEqual(locale['add-parent-card'], locale['remove-parent-card'], code);
  }
  const fi = JSON.parse(fs.readFileSync(path.join(directory, 'fi.i18n.json')));
  assert.match(fi['add-parent-card'], /toinen yläkortti/);
  assert.match(fi['remove-parent-card'], /Ei enää tämän kortin alitehtävä/);
  assert.doesNotMatch(fi['remove-parent-card'], /poista|tuhoa/i);
});

test('Leo outline import instructions are translated in reviewed locales', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const codes = ["fi", "ar", "ar-DZ", "ar-EG", "tr", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "it", "pt", "pt-PT", "pt_PT", "pt-BR", "gl", "gl-ES", "ko", "ko-KR", "ja", "ja-JP", "ja-HI", "zh-Hant", "zh-TW", "zh-HK", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "cmn", "fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "de", "de-AT", "de_DE", "de-CH", "sv", "da", "nb", "nl", "nl-NL", "ro", "ro-RO", "id", "pl", "cs", "sk", "hu", "uk", "ru", "bg"];
  const key = 'import-board-instruction-leo';
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')))[key];
  for (const code of codes) {
    const value = JSON.parse(fs.readFileSync(path.join(directory, code + '.i18n.json')))[key];
    assert.ok(value?.trim(), code);
    assert.notEqual(value, source, code);
    assert.deepEqual(translationTokens(value), translationTokens(source), code);
    assert.ok(value.includes('Leo'), code);
    assert.ok(value.includes('.leo'), code);
  }
  const fi = JSON.parse(fs.readFileSync(path.join(directory, 'fi.i18n.json')))[key];
  assert.match(fi, /Ylimm.*listoja/);
  assert.match(fi, /lapsista kortteja/);
  assert.match(fi, /syvemm.*tarkistuslistoja/);
  assert.match(fi, /Merkityt solmut tuodaan valmiina/);
});
