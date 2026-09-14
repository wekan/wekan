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

const batchFour = ["af", "af_ZA", "sq", "az-AZ", "az-LA", "az", "be", "bn", "hi-IN", "hi", "ta", "ur", "mk", "ka", "hy", "sw", "zu-ZA", "zu", "cy-GB", "cy", "mt"];
for (const code of batchFour) {
 const d=read(code),v=d['close-board-pop'];
 assert.ok(v.includes(d.archives));assert.ok(v.includes(d['all-boards']));
 assert.doesNotMatch(v,/tuiskopskrif|Əsas başlıqdakı|хатнім загалоўку|হোম শিরোনাম|होम हेडर|முகப்புத் தலைப்பில்|ویلل|تہے|хедъра|kichwa cha nyumbani|kunhlokweni yasekhaya|pennyn cartref|home header/);
}
assert.doesNotMatch(read('mk')['close-board-pop'],/Ще|възстановите|като натиснете/);
assert.doesNotMatch(read('mt')['close-board-pop'],/You|by clicking|button/);
assert.strictEqual(read('zu').archives,'Ingobo yomlando');
console.log(`Archive batch four: ${batchFour.length} locale locations and wrong-language regressions`);

const batchFive = ['ga', 'sr', 'tl'];
for (const code of batchFive) {
 const d = read(code), value = d['close-board-pop'];
 assert.ok(value.includes(d.archives), `${code}: actual Archive label`);
 assert.ok(value.includes(d['all-boards']), `${code}: actual All Boards label`);
 assert.doesNotMatch(value, /gceanntásc|Ваше име|горњем десном|able|clicking|button|header/);
}
assert.match(read('ga')['close-board-pop'], /an clár a thabhairt ar ais/);
assert.match(read('sr')['close-board-pop'], /^Списе можете да повратите/);
assert.match(read('tl')['close-board-pop'], /^Maaari mong ibalik ang pisara/);
console.log('Archive batch five: Irish restoration sense, Serbian local terminology and Tagalog mixed-language repair');

const batchSix = ['ml', 'mr', 'gu-IN', 'pa', 'ne', 'si', 'mn', 'kk'];
for (const code of batchSix) {
 const d = read(code), value = d['close-board-pop'];
 assert.ok(value.includes(d.archives), `${code}: Archive section label`);
 assert.ok(value.includes(d['all-boards']), `${code}: All Boards page label`);
 assert.doesNotMatch(value, /ഹോം|ഹെഡറിലെ|शीर्षलेख|હોમ હેડર|ਹੋਮ ਹੈਡਰ|गृह शीर्षक|මුල් ශීර්ෂ|Archive|толгой хэсгийн|басты тақырып/);
}
assert.match(read('si')['close-board-pop'], /සංරක්ෂිතය/);
assert.match(read('mn')['close-board-pop'], /самбарыг сэргээх/);
assert.match(read('kk')['close-board-pop'], /Тақтаны.*қалпына келтіре аласыз/);
console.log('Archive batch six: eight complete localized page/section instructions, Sinhala English label removed');

for (const code of ['uz', 'km', 'km-KH', 'km_KH']) {
 const d = read(code), value = d['close-board-pop'];
 assert.ok(value.includes(d.archives));
 assert.ok(value.includes(d['all-boards']));
 for (const key of ['all-boards', 'restore-board', 'close-board-pop'])
  assert.doesNotMatch(d[key], /kengash|ក្រុមប្រឹក្សាភិបាល|sarlavha|បឋមកថា/);
}
assert.strictEqual(read('uz').board, 'Taxta');
assert.strictEqual(read('uz').boards, 'Taxtalar');
assert.strictEqual(read('uz')['restore-board'], 'Taxtani qayta tiklash');
for (const code of ['km', 'km-KH', 'km_KH']) {
 assert.strictEqual(read(code)['all-boards'], 'ក្តារទាំងអស់');
 assert.strictEqual(read(code)['restore-board'], 'ស្តារក្តារ');
}
console.log('Uzbek and Khmer: board/council distinction and archive place labels verified');

for (const code of ['km', 'km-KH', 'km_KH']) {
 const d = read(code);
 for (const [key, value] of Object.entries(d))
  assert.doesNotMatch(value, /ក្រុមប្រឹក្សាភិបាល/, `${code}:${key}: governing council is not a Kanban board`);
 assert.strictEqual(d['wip-limit-group-select-swimlane'], 'ជ្រើសរើស' + d.swimlane);
 assert.doesNotMatch(d['deposit-subtasks-board'], /ប្រាក់/);
 assert.doesNotMatch(d['comprehensive-board-migration-description'], /បញ្ជាទិញ/);
 assert.ok(d['comprehensive-board-migration-description'].includes('លំដាប់បញ្ជី'));
 for (const visibility of ['private', 'public']) {
  assert.ok(d[`board-${visibility}-info`].includes(`<strong>${d[visibility]}</strong>`));
  assert.doesNotMatch(d[`board-${visibility}-info`], /private|public/);
 }
}
console.log('Khmer board-sense sweep: all governing-council terms removed; visibility, ordering, deposit and swimlane meanings preserved');

const uz = read('uz');
for (const [key, value] of Object.entries(uz))
 assert.doesNotMatch(value, /kengash|taxtai|taxtasingiz/i, `uz:${key}: board noun and possessive morphology`);
assert.match(uz['act-removeBoard'], /__board__ taxtasi/);
assert.match(uz['import-board-instruction-wekan'], /^Taxtangizda/);
assert.match(uz['migration-progress-note'], /^Taxtangizni/);
assert.match(uz['home-board-empty'], /faqat bitta taxtani/);
assert.match(uz['unmigrated-boards'], /^Migratsiya qilinmagan/);
assert.doesNotMatch(uz['act-addBoardMember'], /boshqaruv/);
assert.strictEqual(uz['select-board'], 'Taxtani tanlang');
for (const visibility of ['private','public'])
 assert.ok(uz[`board-${visibility}-info`].includes(`<strong>${uz[visibility]}</strong>`));
console.log('Uzbek board-sense sweep: council terms removed, possessive cases and selection/visibility meanings verified');
