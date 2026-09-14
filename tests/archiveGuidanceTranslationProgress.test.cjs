const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const locales = ["fi", "de-AT", "de-CH", "de", "de_DE", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "fr", "es-CL", "es-CO", "es-LA", "es-MX", "es-PY", "es", "es_CO", "it", "pt-PT", "pt", "pt_PT", "nl-NL", "nl", "da", "nb", "pl-PL", "pl"];
const obsolete = /yläpalk|Kopfzeile|entête|encabezado|intestazione|cabeçalho|Mijn Borden|overskriften|hjem-menyen|nagłówku|Archiwizuj/;
for (const code of locales) {
  const locale = read(code);
  const value = locale['close-board-pop'];
  assert.ok(value.includes(locale.archives), `${code}: missing Archive place label`);
  assert.ok(value.includes(locale['all-boards']), `${code}: missing actual page label`);
  assert.doesNotMatch(value, obsolete, `${code}: obsolete location or Archive action`);
  assert.notStrictEqual(value, read('en')['close-board-pop']);
}
assert.strictEqual(read('sv')['close-board-pop'], 'Du kommer att kunna återställa tavlan genom att klicka på knappen "Arkiv" i huvudmenyn.');
console.log(`Archive guidance: ${locales.length} localized place labels verified; correct Swedish menu wording retained`);

const additional = ["sk", "sl", "sl_SI", "hr", "bs", "hu", "ro-RO", "ro", "ru-RU", "ru-UA", "ru", "ru_RU", "uk-UA", "uk", "bg", "el-GR", "el", "tr", "es-AR", "es-PE", "pt-BR"];
for (const code of additional) {
 const locale = read(code); const value = locale['close-board-pop'];
 assert.ok(value.includes(locale.archives));
 assert.ok(value.includes(locale['all-boards']));
 assert.doesNotMatch(value, /záhlaví|zaglavlju|fejléc|antetul|заголовке|заголовку|хедъра|επικεφαλίδα|Ana başlıktaki|encabesado|cabecera|cabeçalho/);
}
for (const [code, value] of [['tr','Arşiv'], ['es-AR','Archivo'], ['pt-BR','Arquivo']]) assert.strictEqual(read(code).archives, value);
console.log(`Additional archive guidance: ${additional.length} locales and three Archive place labels verified`);

const batchThree = ["ja-HI", "ja-JP", "ja", "ko-KR", "ko", "zh-CN", "zh-GB", "zh-Hans", "zh", "zh_SG", "zh-TW", "zh-HK", "ar-DZ", "ar-EG", "ar", "he-IL", "he", "fa-IR", "fa", "id", "ms-MY", "ms", "vi-VN", "vi", "th", "ca", "ca_ES", "eu", "gl-ES", "gl", "is", "lv", "lt", "et-EE"];
for (const code of batchThree) {
 const d = read(code); const value = d['close-board-pop'];
 assert.ok(value.includes(d.archives)); assert.ok(value.includes(d['all-boards']));
 assert.doesNotMatch(value, /ヘッダ|홈 헤더|主页头部|כותרת העליונה|home header|tiêu đề trang chủ|ส่วนหัว|capçalera|goiburuko|cabeceira|haus heimasíðunnar|namų antraštės/);
}
assert.doesNotMatch(read('ar')['close-board-pop'], /شما|می توانید|بایگانی|بازگردانید/);
assert.doesNotMatch(read('id')['close-board-pop'], /boleh|pulih semula|butang|Arkib/);
for (const [c, v] of [['ca','Arxiu'],['gl','Arquivo'],['he','ארכיון']]) assert.strictEqual(read(c).archives,v);
console.log(`Archive guidance batch three: ${batchThree.length} files; wrong-language and place-label regressions`);
