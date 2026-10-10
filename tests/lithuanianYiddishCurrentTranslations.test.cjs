'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const en = read('en');
const lt = read('lt');
const yi = read('yi');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();
for (const [code, locale] of [['lt', lt], ['yi', yi]]) {
  // Include pending keys; the historical shared br/lt/yi gate is narrower.
  const result = spawnSync(process.execPath, ['releases/translations/fill-translations.mjs', '--list', code], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {}, `${code}: current placeholders`);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: key order`);
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}/${key}: exact placeholders`);
    assert.deepEqual(tags(locale[key]), tags(en[key]), `${code}/${key}: markup`);
  }
  for (const key of Object.keys(en).filter(key => /^(attach-card|attached-card-|detach-card|custom-field-link|field-link-|import-members-mode-|csv-mapping-|import-many-|import-one-board-per-project|export-all-boards|export-selected-boards|webhook-payload-|webhook-hide-identity|webhook-someone|notification-delivery-|notification-group-|r-.*wrike-workflow|import-file-label|subtask-mark-|subtask-done-no-permission)/.test(key))) {
    assert.notEqual(locale[key], en[key], `${code}/${key}: translated prose`);
    if (code === 'yi') assert.match(locale[key], /[\u05d0-\u05ea]/, `${key}: Yiddish script`);
  }
  for (const term of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) {
    assert.ok(locale['r-wrike-workflow-note'].includes(term), `${code}: Wrike API names stay literal`);
  }
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  for (const key of ['custom-field-link-sends', 'custom-field-link-receives', 'custom-field-link-both']) {
    assert.notEqual(locale[key], locale['custom-field-link-send'], `${code}: distinct directions`);
  }
  assert.notEqual(locale['subtask-mark-done'], locale['subtask-mark-not-done']);
}
assert.match(lt['custom-field-links-hint'], /pavadinimas ir tipas sutampa/);
assert.match(lt['custom-field-links-hint'], /tik viena kortelė, paliekami nepakeisti/);
assert.match(lt['custom-field-link-sends'], /Šios kortelės.*kitai kortelei/);
assert.match(lt['custom-field-link-receives'], /Kitos kortelės.*šiai kortelei/);
assert.match(lt['field-link-not-allowed'], /redaguoti abi korteles/);
assert.match(lt['custom-field-link-inactive'], /nebegali redaguoti abiejų kortelių arba viena kortelė yra archyvuota/);
assert.match(lt['import-many-boards-hint'], /nesusiejant narių/);
assert.match(lt['import-many-boards-hint'], /vienas eksportas.*tampa viena lenta/);
assert.match(lt['subtask-mark-not-done'], /nebaigta/);
assert.match(lt['subtask-done-no-permission'], /^Negalite/);
assert.match(lt['webhook-hide-identity'], /^Nesiųsti mano vardo/);
for (const key of ['card', 'cardType-card', 'cards-count-one']) assert.equal(lt[key], 'Kortelė');
for (const key of ['act-addComment', 'act-createCard', 'act-archivedCard', 'act-archivedList', 'act-importCard', 'act-importList', 'act-moveCard', 'act-restoredCard', 'act-atUserComment']) {
  assert.match(lt[key], /plaukimo juost/);
  assert.doesNotMatch(lt[key].replace(/__[A-Za-z0-9_]+__/g, ''), /swimlane/);
}
assert.match(lt['act-moveCard'], /iš sąrašo __oldList__.*į sąrašą __list__/);
assert.match(yi['custom-field-links-hint'], /זעלבן נאָמען און טיפּ/);
assert.match(yi['custom-field-links-hint'], /נאָר איין קאָרט האָט בלײַבן אומגעענדערט/);
assert.match(yi['custom-field-link-sends'], /דעם קאָרט גייען צו יענעם קאָרט/);
assert.match(yi['custom-field-link-receives'], /יענעם קאָרט קומען צו דעם קאָרט/);
assert.match(yi['field-link-not-allowed'], /רעדאַקטירן ביידע קאָרטן/);
assert.match(yi['custom-field-link-inactive'], /מער נישט רעדאַקטירן ביידע קאָרטן, אָדער אַ קאָרט איז אַרכיווירט/);
assert.match(yi['import-many-boards-hint'], /אָן צופּאַסן מיטגלידער/);
assert.match(yi['import-many-boards-hint'], /אַליין איין עקספּאָרט.*ווערט איין ברעט/);
assert.match(yi['subtask-mark-not-done'], /נישט פֿאַרענדיקט/);
assert.match(yi['subtask-done-no-permission'], /קענט נישט ענדערן/);
assert.match(yi['webhook-hide-identity'], /^אויסלאָזן מײַן נאָמען/);
assert.equal(yi['custom-fields'], 'אייגענע פֿעלדער');
assert.equal(yi['flow-size-source'], 'פֿעלד פֿאַר דער גרייס');
for (const key of Object.keys(en).filter(key => /custom/i.test(en[key]))) {
  assert.doesNotMatch(yi[key], /מנהג/, `${key}: customization is not a tradition`);
}
assert.match(yi['custom-field-delete-pop'], /נישט צוריקנעמען/);
assert.match(yi['custom-field-delete-pop'], /פֿון אַלע קאָרטן און אויסמעקן זײַן געשיכטע/);
assert.match(yi['delete-translation-confirm-popup'], /נישט צוריקנעמען/);
// Filter examples are executable grammar; never translate their field names.
for (const sample of ["'Field 1' == 'Value 1'", "Field1 == I\\'m", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
  assert.ok(yi['advanced-filter-description'].includes(sample), sample);
}
console.log('Lithuanian and Yiddish current fills, repair semantics, markup and exact source tokens pass.');
