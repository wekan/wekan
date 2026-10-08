'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'login-origin-mismatch';
const source = read('en')[key];
const codes = ['de', 'de-AT', 'de-CH', 'fr', 'fr-CA', 'es', 'es-AR', 'it', 'pt', 'pt-BR', 'nl', 'sv', 'da', 'nb', 'pl', 'cs', 'sk', 'ro', 'hu', 'id', 'ms', 'vi', 'ja', 'ko', 'zh-CN', 'zh-TW'];
codes.push('de_DE', 'fr-BE', 'fr-CH', 'fr-FR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'cs-CZ', 'ja-JP', 'ko-KR', 'ms-MY', 'nl-NL', 'pl-PL', 'pt-PT', 'pt_PT', 'ro-RO', 'vi-VN', 'zh-Hans', 'zh-Hant', 'zh_SG');
codes.push('ar', 'fa', 'he', 'uk-UA', 'ar-DZ', 'ar-EG', 'fa-IR', 'he-IL');
codes.push('hi', 'bn', 'ta', 'te-IN', 'mr', 'gu-IN', 'kn', 'ml', 'ne', 'ur', 'pa', 'si', 'hi-IN');
codes.push('ca', 'ca@valencia', 'gl', 'eu', 'eo', 'th', 'sw', 'tl', 'ca_ES', 'gl-ES');
codes.push('cmn', 'zh', 'zh-GB', 'zh-HK', 'yue_CN');
codes.push('mn', 'kk', 'ky', 'uz', 'az', 'ka', 'hy', 'uz-LA', 'uz-UZ', 'az-AZ', 'az-LA');
codes.push('cy', 'ga', 'gd', 'oc', 'co', 'mt', 'lb', 'fy', 'cy-GB', 'fy-NL');
codes.push('jv', 'ht', 'mg', 'so', 'ha');
codes.push('am', 'my', 'km', 'km-KH', 'km_KH', 'bi', 'tpi');
codes.push('sd', 'ps', 'ku', 'ckb', 'ug');
codes.push('tt', 'ba', 'tg', 'tk_TM');
codes.push('yo', 'ig', 'sn', 'zu', 'xh', 'zu-ZA');
codes.push('rw', 'rn', 'ny', 'st', 'tn');
codes.push('an', 'ast-ES', 'sc', 'scn', 'nap');
codes.push('br', 'csb', 'hsb', 'szl', 'fo');
for (const code of codes) {
  const value = read(code)[key];
  assert.notEqual(value, source, code);
  assert.deepEqual(translationTokens(value), translationTokens(source), code);
  assert.equal((value.match(/ROOT_URL/g) || []).length, 1, code);
  // Configured address, opened address, corrective link, then configuration fix.
  // Repeated variables must survive rendering without exchanging these roles.
  assert.deepEqual(value.match(/__(?:expected|actual)__/g), ['__expected__', '__actual__', '__expected__', '__actual__'], code);
  const rendered = value.replaceAll('__expected__', 'https://configured.example').replaceAll('__actual__', 'https://opened.example');
  assert.equal((rendered.match(/https:\/\/configured\.example/g) || []).length, 2, code);
  assert.equal((rendered.match(/https:\/\/opened\.example/g) || []).length, 2, code);
  assert.doesNotMatch(rendered, /__[^\s]+?__/, code);
}
assert.match(read('de')[key], /nicht abgeschlossen werden/);
assert.match(read('fr')[key], /ne peut pas aboutir/);
assert.match(read('es')[key], /No se puede completar/);
assert.match(read('ja')[key], /ログインを完了できません/);
assert.match(read('zh-CN')[key], /无法在此地址完成/);
assert.match(read('zh-TW')[key], /無法在此位址完成/);
console.log('Sign-in origin warning: 149 catalog paths, repeated address roles and literal configuration key pass');

assert.match(read('ar')[key], /لا يمكن إكمال تسجيل الدخول/);
assert.match(read('fa')[key], /تکمیل نمی‌شود/);
assert.match(read('he')[key], /לא ניתן להשלים כניסה/);
assert.match(read('uk-UA')[key], /Неможливо завершити вхід/);

assert.match(read('hi')[key], /पूरा नहीं किया जा सकता/);
assert.match(read('bn')[key], /সম্পূর্ণ করা যাচ্ছে না/);
assert.match(read('ta')[key], /முடிக்க முடியாது/);
assert.match(read('ur')[key], /مکمل نہیں کیا جا سکتا/);

assert.match(read('ca')[key], /No es pot completar/);
assert.match(read('ca@valencia')[key], /altre servici en esta adreça/);
assert.match(read('gl')[key], /Non se pode completar/);
assert.match(read('eu')[key], /Ezin da.*osatu/);
assert.match(read('eo')[key], /ne povas finiĝi/);
assert.match(read('sw')[key], /hakuwezi kukamilika/);
assert.match(read('tl')[key], /Hindi makumpleto/);

assert.match(read('yue_CN')[key], /喺呢個網址無法完成/);
assert.match(read('yue_CN')[key], /設定嘅網址係/);
assert.doesNotMatch(read('yue_CN')[key], /配置的地址/);

assert.match(read('mn')[key], /дуусгах боломжгүй/);
assert.match(read('kk')[key], /аяқтау мүмкін емес/);
assert.match(read('ky')[key], /аяктоо мүмкүн эмес/);
assert.match(read('uz')[key], /yakunlab bo‘lmaydi/);
assert.match(read('az')[key], /tamamlamaq mümkün deyil/);
assert.match(read('ka')[key], /დასრულება შეუძლებელია/);
assert.match(read('hy')[key], /հնարավոր չէ ավարտել/);

assert.match(read('cy')[key], /Ni ellir cwblhau/);
assert.match(read('ga')[key], /Ní féidir.*a chríochnú/);
assert.match(read('gd')[key], /Chan urrainnear.*a chrìochnachadh/);
assert.match(read('oc')[key], /se pòt pas acabar/);
assert.match(read('co')[key], /Ùn si pò compie/);
assert.match(read('mt')[key], /ma jistax jitlesta/);
assert.match(read('lb')[key], /net ofgeschloss ginn/);
assert.match(read('fy')[key], /net foltôge wurde/);

assert.match(read('jv')[key], /ora bisa dirampungake/);
assert.match(read('ht')[key], /pa ka fini konekte/);
assert.match(read('mg')[key], /Tsy azo vitaina/);
assert.match(read('so')[key], /lagama dhammaystiri karo/);
assert.match(read('ha')[key], /Ba za a iya kammala.*ba/);

assert.match(read('am')[key], /ማጠናቀቅ አይቻልም/);
assert.match(read('my')[key], /အပြီးသတ်၍ မရပါ/);
assert.match(read('km')[key], /មិនអាចបញ្ចប់/);
assert.match(read('bi')[key], /Yu no save finisim/);
assert.match(read('tpi')[key], /Yu no inap pinisim/);
assert.equal(read('km-KH')[key], read('km_KH')[key]);

assert.match(read('sd')[key], /مڪمل نٿو ڪري سگهجي/);
assert.match(read('ps')[key], /نه شي بشپړېدای/);
assert.match(read('ku')[key], /nayê temamkirin/);
assert.match(read('ckb')[key], /ناتوانرێت.*تەواو بکرێت/);
assert.match(read('ug')[key], /تاماملىغىلى بولمايدۇ/);

assert.match(read('tt')[key], /тәмамлап булмый/);
assert.match(read('ba')[key], /тамамлап булмай/);
assert.match(read('tg')[key], /анҷом дода намешавад/);
assert.match(read('tk_TM')[key], /tamamlamak mümkin däl/);

assert.match(read('yo')[key], /kò lè parí/);
assert.match(read('ig')[key], /Enweghị ike imecha/);
assert.match(read('sn')[key], /hakugoni kupedzwa/);
assert.match(read('zu')[key], /akukwazi ukuqedwa/);
assert.match(read('xh')[key], /akunakugqitywa/);

assert.match(read('rw')[key], /ntibishobora kurangirira/);
assert.match(read('rn')[key], /ntibishobora guhera/);
assert.match(read('ny')[key], /sikungamalizidwe/);
assert.match(read('st')[key], /ho ke ke ha phethwa/);
assert.match(read('tn')[key], /ga go ka ke ga wediwa/);

assert.match(read('an')[key], /No se puede completar/);
assert.match(read('ast-ES')[key], /Nun se pue completar/);
assert.match(read('sc')[key], /Non si podet cumpretare/);
assert.match(read('scn')[key], /Nun si pò cumplitari/);
assert.match(read('nap')[key], /Nun se pò cumpletà/);

assert.match(read('br')[key], /N’haller ket echuiñ/);
assert.match(read('csb')[key], /Nie mòże skùńczëc/);
assert.match(read('hsb')[key], /njeda so.*dokónčić/);
assert.match(read('szl')[key], /Niy idzie skōńczyć/);
assert.match(read('fo')[key], /kann ikki gerast liðug/);
