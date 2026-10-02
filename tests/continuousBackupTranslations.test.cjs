'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('continuous-backup'));
for (const code of ['fi', 'sv', 'da', 'nb', 'de', 'de-AT', 'de-CH', 'de_DE', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'pt', 'pt-PT', 'pt_PT', 'pt-BR', 'it', 'nl', 'nl-NL', 'pl', 'pl-PL', 'cs', 'cs-CZ', 'sk', 'sl', 'hr', 'ro', 'ro-RO', 'hu', 'bg', 'uk', 'uk-UA', 'ru', 'ru-RU', 'ru_RU', 'ru-UA', 'lv', 'lt', 'et-EE', 'el', 'el-GR', 'tr', 'ja', 'ja-JP', 'ja-HI', 'ko', 'ko-KR', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-Hant', 'zh-TW', 'zh-HK', 'id', 'ms', 'ms-MY', 'vi', 'vi-VN']) {
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
for (const code of ['sk', 'sl', 'hr', 'lv', 'lt', 'et-EE', 'tr', 'id', 'ms', 'ms-MY', 'vi', 'vi-VN']) {
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
for (const key of keys) assert.doesNotMatch(read('de-CH')[key], /ß/);
console.log(`Continuous backup: ${keys.length} translations in seventy locales passed`);
