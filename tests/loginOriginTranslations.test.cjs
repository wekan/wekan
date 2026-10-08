'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'login-origin-mismatch';
const source = read('en')[key];
// Discover every catalog so future locales cannot silently escape this regression.
const codes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(name => name.endsWith('.i18n.json'))
  .map(name => name.slice(0, -'.i18n.json'.length))
  .filter(code => !/^en(?:[-_]|$)/.test(code))
  .sort();
assert.ok(codes.includes('chr') && codes.includes('fi'), 'include both newly and previously translated catalogs');
for (const code of codes) {
  const value = read(code)[key];
  assert.equal(typeof value, 'string', code);
  assert.ok(value.trim(), code);
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
console.log(`Sign-in origin warning: ${codes.length} catalog paths, repeated address roles and literal configuration key pass`);

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

assert.match(read('as')[key], /সম্পূৰ্ণ কৰিব নোৱাৰি/);
assert.match(read('or_IN')[key], /ସମ୍ପୂର୍ଣ୍ଣ କରିହେବ ନାହିଁ/);
assert.match(read('mai')[key], /पूरा नहि भऽ सकैत अछि/);
assert.match(read('bho')[key], /पूरा ना हो सकेला/);
assert.match(read('kok')[key], /पुराय करप शक्य ना/);

assert.match(read('fur')[key], /No si pues completâ/);
assert.match(read('rm')[key], /na po betg vegnir terminada/);
assert.match(read('lld')[key], /ne possa nia unì stlut ju/);
assert.match(read('rup')[key], /nu s-poati bitisi/);
assert.match(read('la')[key], /perfici non potest/);

assert.equal(read('rup').login, 'Intrari');
assert.equal(read('la').login, 'Introitus');
assert.doesNotMatch(read('rup').login, /Connexion/);
assert.doesNotMatch(read('la').login, /Latine:/);

assert.match(read('mi')[key], /Kāore e taea te whakaoti/);
assert.match(read('haw')[key], /ʻAʻole hiki ke hoʻopau/);
assert.match(read('sm')[key], /E lē mafai ona faamaeʻa/);
assert.match(read('to')[key], /ʻOku ʻikai lava ke fakakakato/);
assert.match(read('fj')[key], /E sega ni rawa ni vakacavari/);

assert.match(read('nso')[key], /go ka se phethwe/);
assert.match(read('nd')[key], /akungeke kuqedwe/);
assert.match(read('ss')[key], /akukwati kuphotfulwa/);
assert.match(read('ts')[key], /a ku nge hetiseki/);
assert.match(read('ve')[key], /a hu koni u fhedzwa/);
assert.equal(read('ve').login, 'U dzhena');
assert.doesNotMatch(read('ve').login, /Ngena ngemvume/);
// These historical identifiers name other languages in the registry.
assert.equal(read('ve-CC')['admin-panel'], 'Paneło de aministrasion');
assert.equal(read('ve-PP').login, 'Tule');

assert.match(read('ary')[key], /ما يمكنش يكمل/);
assert.match(read('ja-HI')[key], /かんりょうできません/);
assert.match(read('wa')[key], /ni s’ pout nén fini/);
assert.match(read('wa-RR')[key], /Diri matatapos/);
assert.match(read('ve-CC')[key], /No se pol conpletar/);
assert.doesNotMatch(read('ja-HI')[key], /[\p{Script=Han}\p{Script=Katakana}]/u);

assert.match(read('vl-SS')[key], /kan niet voltooid worden/);
assert.match(read('se')[key], /ii sáhte geargat/);
assert.match(read('gv')[key], /Cha nod/);
assert.match(read('kw')[key], /Ny yll omgelmi/);

assert.match(read('om')[key], /xumuramuu hin danda’u/);
assert.match(read('lg')[key], /tekusobola kumalirizibwa/);
assert.match(read('wo')[key], /mënu cee àgg/);
assert.match(read('ak')[key], /Worentumi/);

assert.match(read('bua')[key], /дүүргэхэ аргагүй/);
assert.match(read('cv')[key], /вӗҫлеме май ҫук/);
assert.match(read('sah')[key], /түмүктүүр кыах суох/);

assert.match(read('ace')[key], /hana jeuet lheuh/);
assert.match(read('ay')[key], /janiw tukuyaskaspati/);
assert.match(read('gn')[key], /Ndaikatúi oñemohu’ã/);
assert.match(read('qu')[key], /manam tukuyta atinkichu/);
assert.equal(read('ay')['login'], 'Mantaña');
assert.equal(read('ay')['page'], 'Laphi');
assert.equal(read('qu')['login'], 'Yaykuy');
assert.equal(read('qu')['open'], 'Kichay');
assert.equal(read('qu')['page'], 'P’anqa');

assert.match(read('bm')[key], /Donni tɛ se ka ban/);
assert.match(read('ee')[key], /mate ŋu awu enu/);
assert.match(read('ff')[key], /waawaa timmude/);

assert.match(read('bo')[key], /མཇུག་སྒྲིལ་མི་ཐུབ/);
assert.match(read('dz')[key], /མཇུག་བསྡུ་མི་ཚུགས/);
assert.match(read('ti')[key], /ክዛዘም ኣይክእልን/);
assert.notEqual(read('bo')[key], read('dz')[key]);

assert.match(read('uz-AR')[key], /یکونلب بولمیدی/);
assert.match(read('ks')[key], /ہؠکِہ نہٕ/);
for (const code of ['uz-AR', 'ks']) {
  const prose = read(code)[key].replaceAll('WeKan', '').replaceAll('ROOT_URL', '').replace(/__(?:expected|actual)__/g, '');
  assert.match(prose, /\p{Script=Arabic}/u, code);
  assert.doesNotMatch(prose, /[A-Za-z]/, code);
}
for (const key of ['login', 'error', 'admin-panel']) {
  assert.match(read('uz-AR')[key], /\p{Script=Arabic}/u, key);
  assert.doesNotMatch(read('uz-AR')[key], /[A-Za-z]/, key);
}

assert.match(read('ve-PP')[key], /ei voi lopetta/);
assert.match(read('vo')[key], /no kanon pafinädon/);
assert.match(read('tlh')[key], /Data'laHbe'/);

assert.match(read('kl')[key], /naammassineqarsinnaanngilaq/);
assert.match(read('nah')[key], /Amo hueli motlamia/);

assert.match(read('tig')[key], /ኢቀድር/);
assert.match(read('wal')[key], /polanau danddayettenna/);
assert.equal(read('wal').login, 'Geliyoogaa');
assert.equal(read('wal').open, 'Dooya');
assert.equal(read('wal').page, 'Sinttaa');

assert.match(read('zgh')[key], /ⵓⵔ ⵉⵣⵎⵉⵔ/);
assert.match(read('iu')[key], /ᐱᔭᕇᖅᑕᐅᔪᓐᓇᙱᓚᖅ/);
for (const [code, script] of [['zgh', /\p{Script=Tifinagh}/u], ['iu', /\p{Script=Canadian_Aboriginal}/u]]) {
  const prose = read(code)[key].replaceAll('WeKan', '').replaceAll('ROOT_URL', '').replace(/__(?:expected|actual)__/g, '');
  assert.match(prose, script, code);
  assert.doesNotMatch(prose, /[A-Za-z]/, code);
}

assert.match(read('chr')[key], /Ꮭ ᏰᎵ ᏱᎩ/);
const cherokeeProse = read('chr')[key].replaceAll('WeKan', '').replaceAll('ROOT_URL', '').replace(/__(?:expected|actual)__/g, '');
assert.match(cherokeeProse, /\p{Script=Cherokee}/u);
assert.doesNotMatch(cherokeeProse, /[A-Za-z]/);
