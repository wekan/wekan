'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = ['import-board-instruction-taskwarrior', 'import-board-instruction-focalboard', 'drag-to-reorder'];
const groups = [
  ['pl pl-PL', 'nie są importowane', 'w górę', 'w dół'],
  ['cs cs-CZ', 'neimportují', 'nahoru', 'dolů'],
  ['sk', 'neimportujú', 'nahor', 'nadol'],
  ['sl sl_SI', 'se ne uvozijo', 'gor', 'dol'],
  ['hr', 'ne uvoze se', 'gore', 'dolje'],
  ['ro ro-RO', 'nu sunt importate', 'în sus', 'în jos'],
  ['hu', 'nem kerülnek importálásra', 'fel', 'le'],
  ['bg', 'не се импортират', 'нагоре', 'надолу'],
  ['uk uk-UA', 'не імпортуються', 'вгору', 'вниз'],
  ['ru ru-RU ru_RU ru-UA', 'не импортируются', 'вверх', 'вниз'],
  ['et-EE', 'ei impordita', 'Üles-', 'allanoole'],
  ['lv', 'netiek importēti', 'Augšupvērstās', 'lejupvērstās'],
  ['lt', 'neimportuojami', 'aukštyn', 'žemyn'],
  ['el el-GR', 'δεν εισάγονται', 'πάνω', 'κάτω'],
  ['tr', 'içe aktarılmaz', 'Yukarı', 'aşağı'],
  ['id', 'tidak diimpor', 'atas', 'bawah'],
  ['ms ms-MY', 'tidak diimport', 'atas', 'bawah'],
  ['vi vi-VN', 'không được nhập', 'lên', 'xuống'],
  ['ja ja-JP', 'インポートされません', '上矢印', '下矢印'],
  ['ko ko-KR', '가져오지 않습니다', '위쪽', '아래쪽'],
  ['cmn zh zh-CN zh-GB zh-Hans zh_SG', '不会导入', '向上', '向下'],
  ['zh-Hant zh-TW zh-HK', '不會匯入', '向上', '向下'],
  ['ar ar-DZ ar-EG', 'لا يتم استيراد', 'لأعلى', 'لأسفل'],
  ['he he-IL', 'אינם מיובאים', 'למעלה', 'למטה'],
  ['fa fa-IR', 'وارد نمی‌شوند', 'بالا', 'پایین'],
  ['ur', 'درآمد نہیں کی جاتیں', 'اوپر', 'نیچے'],
  ['hi hi-IN', 'आयात नहीं किए जाते', 'ऊपर', 'नीचे'],
  ['bn', 'আমদানি করা হয় না', 'ওপর', 'নিচের'],
  ['ca ca_ES ca@valencia', 'no s’importen', 'amunt', 'avall'],
  ['gl gl-ES', 'non se importan', 'arriba', 'abaixo'],
  ['eu', 'ez dira inportatzen', 'Gora', 'behera'],
  ['af af_ZA', 'nie ingevoer nie', 'op-', 'afpyltjies'],
  ['sw', 'haviingizwi', 'juu', 'chini'],
  ['bs', 'se ne uvoze', 'gore', 'dolje'],
  ['sr', 'се не увозе', 'нагоре', 'надоле'],
  ['mk', 'не се увезуваат', 'нагоре', 'надолу'],
  ['is', 'ekki flutt inn', 'upp', 'niður'],
  ['eo', 'ne estas importataj', 'supren', 'malsupren'],
  ['sq', 'nuk importohen', 'lart', 'poshtë'],
  ['tl', 'Hindi ini-import', 'pataas', 'pababang'],
  ['fi', 'ei tuoda', 'Ylä-', 'alanuoli'],
  ['sv', 'importeras inte', 'Uppåt-', 'nedåtpilarna'],
  ['da', 'importeres ikke', 'Pil op', 'pil ned'],
  ['nb', 'importeres ikke', 'Pil opp', 'pil ned'],
  ['de de-AT de-CH de_DE', 'nicht importiert', 'oben', 'unten'],
  ['fr fr-BE fr-CA fr-CH fr-FR', 'ne sont pas importées', 'Haut', 'Bas'],
  ['es es-AR es-CL es-CO es-LA es-MX es-PE es-PY es_CO', 'no se importan', 'arriba', 'abajo'],
  ['pt pt-PT pt_PT pt-BR', 'não são importados', 'cima', 'baixo'],
  ['it', 'non vengono importati', 'su', 'giù'],
  ['nl nl-NL vl-SS', 'niet geïmporteerd', 'omhoog', 'omlaag'],
];
let count = 0;
for (const [group, exclusion, up, down] of groups) {
  for (const code of group.split(' ')) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}: missing text`);
      assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
    }
    for (const token of ['task export', 'JSON', 'Done', 'project', 'priority', 'annotations', 'depends']) {
      assert.ok(locale[keys[0]].includes(token), `${code}: Taskwarrior command, fields and destination must stay recognizable: ${token}`);
    }
    for (const token of ['.boardarchive', 'board.jsonl', exclusion]) {
      assert.ok(locale[keys[1]].includes(token), `${code}: Focalboard file format and import limitation: ${token}`);
    }
    for (const direction of [up, down]) {
      assert.ok(locale[keys[2]].includes(direction), `${code}: both keyboard directions must be explained`);
    }
    count++;
  }
}
console.log(`Import and reordering: ${keys.length} messages in ${count} locale variants passed`);

for (const code of ['ro', 'ro-RO']) {
  assert.equal(read(code).labels, 'Etichete', `${code}: Romanian labels, not Italian`);
  assert.equal(read(code).description, 'Descriere', `${code}: Romanian description, not Italian`);
}
assert.equal(read('hr').description, 'Opis', 'Croatian description uses Croatian Latin spelling');

assert.equal(read('lv').checklist, 'Kontrolsaraksts', 'Latvian checklist, not Lithuanian');
