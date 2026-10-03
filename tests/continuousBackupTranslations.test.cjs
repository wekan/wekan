'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('continuous-backup'));
for (const code of ['fi', 'sv', 'da', 'nb', 'de', 'de-AT', 'de-CH', 'de_DE', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'pt', 'pt-PT', 'pt_PT', 'pt-BR', 'it', 'nl', 'nl-NL', 'pl', 'pl-PL', 'cs', 'cs-CZ', 'sk', 'sl', 'hr', 'ro', 'ro-RO', 'hu', 'bg', 'uk', 'uk-UA', 'ru', 'ru-RU', 'ru_RU', 'ru-UA', 'lv', 'lt', 'et-EE', 'el', 'el-GR', 'tr', 'ja', 'ja-JP', 'ja-HI', 'ko', 'ko-KR', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-Hant', 'zh-TW', 'zh-HK', 'id', 'ms', 'ms-MY', 'vi', 'vi-VN', 'ar', 'ar-DZ', 'ar-EG', 'he', 'he-IL', 'fa', 'fa-IR', 'ur', 'hi', 'hi-IN', 'bn', 'ca', 'ca_ES', 'gl', 'gl-ES', 'eu', 'af', 'af_ZA', 'sw', 'bs', 'sr', 'mk', 'is', 'eo', 'sq', 'th', 'tl', 'be']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale['continuous-backup-running'], locale['continuous-backup-stopped']);
  for (const brand of ['SQLite', 'Litestream', 'Oplog']) {
    assert.match(locale[`continuous-backup-engine-${brand.toLowerCase()}`], new RegExp(brand));
  }
}
assert.match(read('fi')['continuous-backup-restore-sqlite'], /ei koskaan käytössä olevan tiedoston päälle/);
assert.match(read('sv')['continuous-backup-restore-sqlite'], /aldrig över den aktiva filen/);
assert.match(read('fi')['continuous-backup-restore-confirm'], /valittu sukupolvi valittuun ajankohtaan.*keskeytetään palautuksen ajaksi/);
assert.match(read('sv')['continuous-backup-restore-confirm'], /valda generationen till den valda tidpunkten.*pausas under återställningen/);
for (const [code, units] of Object.entries({fi: ['sekuntia', 'tuntia', 'päivää'], sv: ['sekunder', 'timmar', 'dagar'], da: ['sekunder', 'timer', 'dage'], nb: ['sekunder', 'timer', 'dager']})) {
  for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
    assert.ok(read(code)[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
  }
}
assert.match(read('da')['continuous-backup-restore-sqlite'], /overskriver aldrig den aktive fil/);
assert.match(read('nb')['continuous-backup-restore-sqlite'], /overskriver aldri den aktive filen/);
assert.match(read('da')['continuous-backup-restore-confirm'], /valgte generation til det valgte tidspunkt.*pause under gendannelsen/);
assert.match(read('nb')['continuous-backup-restore-confirm'], /valgte generasjonen til det valgte tidspunktet.*pause under gjenopprettingen/);
for (const [codes, protection, pause, units] of [
  [['de', 'de-AT', 'de-CH', 'de_DE'], /niemals die aktive Datei/, /gewählte Generation zum gewählten Zeitpunkt.*pausiert während der Wiederherstellung/, ['Sekunden', 'Stunden', 'Tage']],
  [['fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR'], /sans jamais écraser le fichier en cours d’utilisation/, /génération choisie à l’instant choisi.*suspendue pendant la restauration/, ['secondes', 'heures', 'jours']],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['continuous-backup-restore-sqlite'], protection);
    assert.match(locale['continuous-backup-restore-confirm'], pause);
    for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
      assert.ok(locale[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
    }
  }
}
for (const [codes, protection, pause] of [
  [['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO'], /nunca sobrescribe el archivo en uso/, /generación elegida al instante elegido.*se pausa durante la restauración/],
  [['pt', 'pt-PT', 'pt_PT'], /sem nunca substituir o ficheiro em utilização/, /geração escolhida para o momento escolhido.*pausa durante o restauro/],
  [['pt-BR'], /sem nunca sobrescrever o arquivo em uso/, /geração escolhida para o momento escolhido.*pausado durante a restauração/],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['continuous-backup-restore-sqlite'], protection);
    assert.match(locale['continuous-backup-restore-confirm'], pause);
    const units = ['segundos', 'horas', code.startsWith('es') ? 'días' : 'dias'];
    for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
      assert.ok(locale[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
    }
  }
}
for (const [codes, protection, pause, units] of [
  [['it'], /senza mai sovrascrivere il file in uso/, /generazione scelta all’istante scelto.*sospeso durante il ripristino/, ['secondi', 'ore', 'giorni']],
  [['nl', 'nl-NL'], /overschrijft nooit het bestand dat in gebruik is/, /gekozen generatie.*gekozen tijdstip.*tijdens het herstel gepauzeerd/, ['seconden', 'uren', 'dagen']],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['continuous-backup-restore-sqlite'], protection);
    assert.match(locale['continuous-backup-restore-confirm'], pause);
    for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
      assert.ok(locale[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
    }
  }
}
for (const [codes, protection, pause, units] of [
  [['be'], /ніколі не перазапісвае файл, які выкарыстоўваецца/, /выбранае пакаленне.*выбраны момант.*прыпынена на час аднаўлення/, ['секунды', 'гадзіны', 'дні']],
  [['tl'], /hindi kailanman pinapatungan ang file na ginagamit/, /napiling henerasyon.*napiling sandali.*Pansamantalang hihinto.*habang nagbabalik/, ['segundo', 'oras', 'araw']],
  [['th'], /ไม่เขียนทับไฟล์ที่กำลังใช้งานอยู่เด็ดขาด/, /รุ่นที่เลือก.*เวลาที่เลือก.*หยุดชั่วคราวระหว่างการกู้คืน/, ['วินาที', 'ชั่วโมง', 'วัน']],
  [['sq'], /nuk mbishkruan kurrë skedarin në përdorim/, /brezi i zgjedhur.*çastit të zgjedhur.*ndalet përkohësisht gjatë rikthimit/, ['sekonda', 'orë', 'ditë']],
  [['is'], /skrifar aldrei yfir skrána sem er í notkun/, /valda kynslóð miðað við valinn tímapunkt.*stöðvuð tímabundið meðan á endurheimt stendur/, ['sekúndur', 'klukkustundir', 'dagar']],
  [['eo'], /neniam anstataŭigas la uzatan dosieron/, /elektitan generacion.*elektita momento.*paŭzos dum la restarigo/, ['sekundoj', 'horoj', 'tagoj']],
  [['bs'], /nikada ne prepisuje datoteku koja se koristi/, /odabranu generaciju na odabrani trenutak.*pauzirano tokom vraćanja/, ['sekunde', 'sati', 'dani']],
  [['sr'], /никада не преписује датотеку која се користи/, /изабрану генерацију на изабрани тренутак.*паузирано током опоравка/, ['секунде', 'сати', 'дани']],
  [['mk'], /никогаш не ја препишува датотеката што се користи/, /избраната генерација.*избраниот момент.*привремено запрено за време на враќањето/, ['секунди', 'часови', 'денови']],
  [['af', 'af_ZA'], /oorskryf nooit die lêer wat in gebruik is nie/, /gekose generasie na die gekose tydstip.*tydens die herstel onderbreek/, ['sekondes', 'ure', 'dae']],
  [['sw'], /haiandiki kamwe juu ya faili inayotumika/, /kizazi kilichochaguliwa.*wakati uliochaguliwa.*utasitishwa kwa muda wakati wa kurejesha/, ['sekunde', 'saa', 'siku']],
  [['ca', 'ca_ES'], /mai no sobreescriu el fitxer en ús/, /generació seleccionada a l’instant seleccionat.*pausa durant la restauració/, ['segons', 'hores', 'dies']],
  [['gl', 'gl-ES'], /nunca sobrescribe o ficheiro en uso/, /xeración seleccionada ao instante seleccionado.*pausa durante a restauración/, ['segundos', 'horas', 'días']],
  [['eu'], /ez du inoiz erabiltzen ari den fitxategia gainidazten/, /Hautatutako belaunaldia hautatutako uneko egoerara.*eten egingo da berrezartzeak irauten duen bitartean/, ['segundoak', 'orduak', 'egunak']],
  [['hi', 'hi-IN'], /उपयोग में मौजूद फ़ाइल को कभी अधिलेखित नहीं करती/, /चुनी गई पीढ़ी को चुने गए समय.*बहाली के दौरान.*अस्थायी रूप से रुक जाएगा/, ['सेकंड', 'घंटे', 'दिन']],
  [['bn'], /ব্যবহৃত ফাইল কখনো ওভাররাইট করে না/, /নির্বাচিত প্রজন্মকে নির্বাচিত মুহূর্তের.*পুনরুদ্ধারের সময়.*সাময়িকভাবে বন্ধ থাকবে/, ['সেকেন্ড', 'ঘণ্টা', 'দিন']],
  [['fa', 'fa-IR'], /هرگز فایل در حال استفاده را بازنویسی نمی‌کند/, /نسل انتخاب‌شده.*لحظهٔ انتخاب‌شده.*هنگام بازیابی موقتاً متوقف می‌شود/, ['ثانیه', 'ساعت', 'روز']],
  [['ur'], /زیر استعمال فائل کو کبھی اوور رائٹ نہیں کرتی/, /منتخب نسل کو منتخب لمحے.*بحالی کے دوران.*عارضی طور پر رک جائے گا/, ['سیکنڈ', 'گھنٹے', 'دن']],
  [['ar', 'ar-DZ', 'ar-EG'], /ولا يستبدل أبدًا الملف المستخدم حاليًا/, /الجيل المحدد.*اللحظة المحددة.*سيتوقف.*مؤقتًا أثناء الاستعادة/, ['ثوانٍ', 'ساعات', 'أيام']],
  [['he', 'he-IL'], /לעולם אינו דורס את הקובץ שבשימוש/, /הדור שנבחר.*בנקודת הזמן שנבחרה.*יושהה במהלך השחזור/, ['שניות', 'שעות', 'ימים']],
  [['id'], /tidak pernah menimpa berkas yang sedang digunakan/, /generasi yang dipilih.*waktu yang dipilih.*dijeda selama pemulihan/, ['detik', 'jam', 'hari']],
  [['ms', 'ms-MY'], /tidak pernah menulis ganti fail yang sedang digunakan/, /generasi yang dipilih.*masa yang dipilih.*dijeda semasa pemulihan/, ['saat', 'jam', 'hari']],
  [['vi', 'vi-VN'], /không bao giờ ghi đè tệp đang sử dụng/, /thế hệ đã chọn.*thời điểm đã chọn.*tạm dừng trong quá trình khôi phục/, ['giây', 'giờ', 'ngày']],
  [['ja', 'ja-JP'], /使用中のファイルは決して上書きしません/, /選択した世代を選択した時点.*復元中.*一時停止/, ['秒', '時間', '日']],
  [['ja-HI'], /しようちゅうのふぁいるはけっしてうわがきしません/, /せんたくしたせだいをせんたくしたじてん.*ふくげんちゅう.*いちじていし/, ['びょう', 'じかん', 'にち']],
  [['ko', 'ko-KR'], /사용 중인 파일을 절대 덮어쓰지 않음/, /선택한 세대를 선택한 시점.*복구 중.*일시 중지/, ['초', '시간', '일']],
  [['zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG'], /绝不会覆盖正在使用的文件/, /所选代次还原到所选时刻.*还原期间会暂停持续备份/, ['秒', '小时', '天']],
  [['zh-Hant', 'zh-TW', 'zh-HK'], /絕不會覆寫正在使用的檔案/, /所選世代還原到所選時刻.*還原期間會暫停持續備份/, ['秒', '小時', '天']],
  [['el', 'el-GR'], /δεν αντικαθιστά ποτέ το αρχείο που χρησιμοποιείται/, /επιλεγμένη γενιά στην επιλεγμένη χρονική στιγμή.*παύσει προσωρινά κατά την επαναφορά/, ['δευτερόλεπτα', 'ώρες', 'ημέρες']],
  [['tr'], /kullanımda olan dosyanın üzerine asla yazılmaz/, /Seçilen nesil seçilen andaki durumuna.*geri getirme sırasında duraklatılır/, ['saniye', 'saat', 'gün']],
  [['lv'], /nekad nepārraksta pašlaik izmantoto failu/, /izvēlēto paaudzi uz izvēlēto brīdi.*atjaunošanas laikā tiks apturēta/, ['sekundes', 'stundas', 'dienas']],
  [['lt'], /niekada neperrašo naudojamo failo/, /pasirinktą kartą į pasirinkto momento būseną.*Atkūrimo metu.*bus pristabdytas/, ['sekundės', 'valandos', 'dienos']],
  [['et-EE'], /ei kirjuta kunagi üle kasutusel olevat faili/, /valitud põlvkond valitud ajahetke seisuga.*peatatakse taastamise ajaks/, ['sekundid', 'tunnid', 'päevad']],
  [['uk', 'uk-UA'], /ніколи не перезаписує файл, що використовується/, /вибране покоління на вибраний момент.*призупинено на час відновлення/, ['секунди', 'години', 'дні']],
  [['ru', 'ru-RU', 'ru_RU', 'ru-UA'], /никогда не перезаписывает используемый файл/, /выбранное поколение на выбранный момент.*приостановлено на время восстановления/, ['секунды', 'часы', 'дни']],
  [['ro', 'ro-RO'], /nu suprascrie niciodată fișierul în uz/, /generația aleasă la momentul ales.*suspendată pe durata restaurării/, ['secunde', 'ore', 'zile']],
  [['hu'], /soha nem írja felül a használatban lévő fájlt/, /kiválasztott generációt a kiválasztott időpontra.*visszaállítás idejére szünetel/, ['másodperc', 'óra', 'nap']],
  [['bg'], /никога не презаписва използвания файл/, /избраното поколение към избрания момент.*спряно временно по време на възстановяването/, ['секунди', 'часа', 'дни']],
  [['sk'], /nikdy neprepíše používaný súbor/, /vybranú generáciu k vybranému okamihu.*počas obnovovania pozastavené/, ['sekundy', 'hodín', 'dni']],
  [['sl'], /nikoli ne prepiše datoteke v uporabi/, /izbrano generacijo na izbrani trenutek.*med obnavljanjem začasno ustavljeno/, ['sekunde', 'ur', 'dni']],
  [['hr'], /nikada ne prepisuje datoteku u uporabi/, /odabranu generaciju na odabrani trenutak.*pauzirano tijekom vraćanja/, ['sekunde', 'sati', 'dani']],
  [['pl', 'pl-PL'], /nigdy nie nadpisuje używanego pliku/, /wybraną generację do wybranego momentu.*wstrzymane na czas przywracania/, ['sekundy', 'godziny', 'dni']],
  [['cs', 'cs-CZ'], /nikdy nepřepíše používaný soubor/, /vybranou generaci k vybranému okamžiku.*po dobu obnovování pozastaveno/, ['sekundy', 'hodin', 'dny']],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['continuous-backup-restore-sqlite'], protection);
    assert.match(locale['continuous-backup-restore-confirm'], pause);
    for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
      assert.ok(locale[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
    }
  }
}
for (const code of ['ro', 'ro-RO']) assert.equal(read(code).restore, 'Restaurează');
for (const code of ['bg', 'uk', 'uk-UA', 'ru', 'ru-RU', 'ru_RU', 'ru-UA']) {
  for (const key of keys) assert.match(read(code)[key], /\p{Script=Cyrillic}/u);
}
for (const code of ['uk', 'uk-UA']) {
  assert.equal(read(code)['continuous-backup-database'], 'База даних');
  assert.equal(read(code)['continuous-backup-restore-what'], 'Відновити');
  for (const key of keys) assert.doesNotMatch(read(code)[key], /[ыэъё]/iu);
}
for (const code of ['ru', 'ru-RU', 'ru_RU', 'ru-UA']) {
  assert.equal(read(code)['continuous-backup-database'], 'База данных');
  assert.equal(read(code)['continuous-backup-restore-what'], 'Восстановить');
}
assert.equal(read('sk').restore, 'Obnoviť');
assert.equal(read('hr').restore, 'Vrati');
for (const code of ['el', 'el-GR']) {
  for (const key of keys) assert.match(read(code)[key], /\p{Script=Greek}/u);
}
for (const code of ['sk', 'sl', 'hr', 'lv', 'lt', 'et-EE', 'tr', 'id', 'ms', 'ms-MY', 'vi', 'vi-VN', 'ca', 'ca_ES', 'gl', 'gl-ES', 'eu', 'af', 'af_ZA', 'sw']) {
  for (const key of [...keys, 'restore']) assert.doesNotMatch(read(code)[key], /\p{Script=Cyrillic}/u);
}
for (const key of keys) {
  assert.match(read('ja-HI')[key], /\p{Script=Hiragana}/u);
  assert.doesNotMatch(read('ja-HI')[key], /[\p{Script=Han}\p{Script=Katakana}]/u);
  for (const code of ['ko', 'ko-KR']) assert.match(read(code)[key], /\p{Script=Hangul}/u);
  for (const code of ['zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-Hant', 'zh-TW', 'zh-HK']) {
    assert.match(read(code)[key], /\p{Script=Han}/u);
  }
}
for (const code of ['zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG']) assert.equal(read(code)['continuous-backup-database'], '数据库');
for (const code of ['zh-Hant', 'zh-TW', 'zh-HK']) assert.equal(read(code)['continuous-backup-database'], '資料庫');
for (const key of keys) {
  for (const code of ['ar', 'ar-DZ', 'ar-EG', 'fa', 'fa-IR', 'ur']) assert.match(read(code)[key], /\p{Script=Arabic}/u);
  for (const code of ['he', 'he-IL']) assert.match(read(code)[key], /\p{Script=Hebrew}/u);
}
assert.equal(read('eo').restore, 'Restarigi');
assert.notEqual(read('eo').restore, read('eo').delete);
assert.equal(read('ur').backup, 'بیک اپ');
for (const key of keys) {
  for (const code of ['hi', 'hi-IN']) assert.match(read(code)[key], /\p{Script=Devanagari}/u);
  assert.match(read('bn')[key], /\p{Script=Bengali}/u);
}
for (const key of keys) {
  for (const code of ['sr', 'mk']) assert.match(read(code)[key], /\p{Script=Cyrillic}/u);
  assert.doesNotMatch(read('bs')[key], /\p{Script=Cyrillic}/u);
  assert.doesNotMatch(read('mk')[key], /[ъщыэё]/iu);
}
assert.equal(read('mk').restore, 'Врати');
assert.equal(read('mk').save, 'Зачувај');
assert.equal(read('mk')['continuous-backup-database'], 'База на податоци');
for (const key of keys) assert.match(read('th')[key], /\p{Script=Thai}/u);
for (const key of keys) {
  assert.match(read('be')[key], /\p{Script=Cyrillic}/u);
  assert.doesNotMatch(read('be')[key], /[иъщ]/iu);
}
assert.equal(read('be')['continuous-backup-database'], 'База даных');
assert.equal(read('be')['continuous-backup-restore-what'], 'Аднавіць');
for (const key of keys) assert.doesNotMatch(read('de-CH')[key], /ß/);
console.log(`Continuous backup: ${keys.length} translations in ninety-eight locales passed`);
