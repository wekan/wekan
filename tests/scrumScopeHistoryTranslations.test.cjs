'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["cs", "cs-CZ", "hu", "ru", "ru-RU", "ru-UA", "ru_RU", "sk", "uk", "uk-UA", "et-EE", "he", "he-IL", "fa", "fa-IR", "ms", "ms-MY", "sl", "sl_SI", "hr", "sr", "bs", "mk", "bn", "ta", "ne", "ur", "th", "gu-IN", "be", "lt", "lv", "is", "af", "af_ZA", "hi", "hi-IN", "kn", "ga", "co", "sc", "scn", "nap", "an", "ast-ES", "oc", "br", "eu", "cy", "cy-GB", "gd", "csb", "de", "de-AT", "de-CH", "de_DE", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-CL", "es-CO", "es_CO", "es-LA", "es-MX", "es-PE", "es-PY", "pt", "pt-PT", "pt_PT", "pt-BR", "it", "nl", "nl-NL", "sv", "nb", "da", "fi", "pl", "pl-PL", "ro", "ro-RO", "el", "el-GR", "tr", "id", "vi", "vi-VN", "bg", "ja", "ja-JP", "ja-HI", "zh", "zh-CN", "zh-Hans", "zh-GB", "zh_SG", "zh-TW", "zh-HK", "zh-Hant", "ko", "ko-KR", "ar", "ar-DZ", "ar-EG", "ca", "ca@valencia", "ca_ES", "gl", "gl-ES", "eo", "lb", "mt", "sq", "hy", "ka", "az", "az-AZ", "az-LA", "sw", "tl", "la", "cmn", "yue_CN", "as", "ml", "mr", "pa", "te-IN", "or_IN", "si", "my", "km", "km-KH", "km_KH", "jv", "mn", "kk", "ky", "uz", "uz-LA", "uz-UZ", "tg", "am", "mg", "ha", "so", "sn", "ny", "rw", "ig", "yo", "ckb", "ku", "ps", "sd", "ug", "uz-AR", "tt", "tk_TM", "fo", "fy", "fy-NL", "ht", "pap", "yi", "fur", "rm", "bi", "tpi", "mi", "sm", "fj", "to", "haw", "wa-RR", "zu", "zu-ZA", "xh", "nd", "ss", "st", "tn", "nso", "ts", "ve", "rn", "om", "lg", "bho", "mai", "kok", "vl-SS", "ary", "wuu-Hans", "ve-CC", "szl", "hsb", "wa", "ba", "bua", "cv", "sah", "ak", "bm", "wo", "gv", "kw", "vo", "tlh", "ee", "ff", "se", "bo", "ti", "dz", "ks", "gn", "qu", "ace", "ay", "lld", "rup", "ve-PP", "kl", "nah", "tig", "wal", "zgh", "iu", "chr"];
const keys = [
  'scrum-scope-history', 'scrum-scope-history-help',
  'scrum-scope-history-inconsistent', 'scrum-scope-history-truncated',
  'scrum-scope-history-empty', 'scrum-scope-cause-start',
  'scrum-scope-cause-scrum', 'scrum-scope-cause-customFields',
  'scrum-scope-cause-dates', 'scrum-scope-cause-position',
  'scrum-scope-cause-lifecycle',
];
// These batches use their declared scripts, including Arabic-script Uzbek.
// Script checks supplement the wording checks; they are not fluency checks.
const scripts = {
  chr: 'Cherokee',
  iu: 'Canadian_Aboriginal',
  zgh: 'Tifinagh',
  ks: 'Arabic', bo: 'Tibetan', dz: 'Tibetan', ti: 'Ethiopic', tig: 'Ethiopic',
  as: 'Bengali', ml: 'Malayalam', mr: 'Devanagari', pa: 'Gurmukhi',
  'te-IN': 'Telugu', or_IN: 'Oriya', si: 'Sinhala', my: 'Myanmar',
  km: 'Khmer', 'km-KH': 'Khmer', km_KH: 'Khmer', am: 'Ethiopic',
  mn: 'Cyrillic', kk: 'Cyrillic', ky: 'Cyrillic', tg: 'Cyrillic', tt: 'Cyrillic',
  ps: 'Arabic', sd: 'Arabic', ckb: 'Arabic', ug: 'Arabic', 'uz-AR': 'Arabic',
  yi: 'Hebrew',
  bho: 'Devanagari', mai: 'Devanagari', kok: 'Devanagari',
  ary: 'Arabic', 'wuu-Hans': 'Han',
  ba: 'Cyrillic', bua: 'Cyrillic', cv: 'Cyrillic', sah: 'Cyrillic',
};
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: current key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  if (scripts[code]) {
    const nativeScript = new RegExp(`\\p{Script=${scripts[code]}}`, 'u');
    for (const key of [...keys, 'sync-estimate-source', 'sync-estimate-source-weight',
      'sync-estimate-source-time', 'sync-estimate-field-gitlab', 'sync-estimate-field-gitlab-hint']) {
      assert.match(locale[key], nativeScript, `${code}:${key}: native script`);
      assert.doesNotMatch(locale[key].replaceAll('GitLab', ''), /[A-Za-z]/,
        `${code}:${key}: no English prose in a native-script message`);
    }
  }
  // Missing writes and a truncated read explain different kinds of incompleteness.
  assert.notEqual(locale[keys[2]], locale[keys[3]], `${code}: distinct warnings`);
  assert.equal(new Set(keys.slice(5).map(key => locale[key])).size, 6, `${code}: distinct change causes`);
}
// Preserve the missing-History and read-limit meanings, rather than reassuring
// readers that incomplete figures are a faithful account of the sprint.
assert.match(read('de')[keys[2]], /ohne Verlauf.*unvollständig/);
assert.match(read('de')[keys[3]], /Nur die ersten Änderungen.*unvollständig/);
assert.match(read('fr')[keys[2]], /sans historique.*incomplètes/);
assert.match(read('fr')[keys[3]], /Seules les premières modifications.*incomplète/);
assert.match(read('fi')[keys[2]], /ilman historiakirjausta.*puutteellisia/);
assert.match(read('fi')[keys[3]], /Vain ensimmäiset muutokset.*puutteellinen/);
assert.match(read('zh-CN')[keys[2]], /没有记录到历史中.*不完整/);
assert.match(read('zh-CN')[keys[3]], /只能读取最初.*不完整/);
assert.match(read('mn')[keys[2]], /түүхэнд бүртгэлгүй.*бүрэн бус/);
assert.match(read('mn')[keys[3]], /Зөвхөн эхний.*бүрэн бус/);
assert.match(read('kk')[keys[2]], /тарихқа жазылмай.*толық емес/);
assert.match(read('kk')[keys[3]], /Тек алғашқы.*толық емес/);
assert.match(read('uz')[keys[2]], /tarixga yozilmasdan.*to‘liq emas/);
assert.match(read('uz')[keys[3]], /Faqat dastlabki.*to‘liq emas/);
assert.match(read('ha')[keys[2]], /ba tare da rubuta.*ba su cika ba/);
assert.match(read('ha')[keys[3]], /farko kawai.*bai cika ba/);
assert.match(read('mi')[keys[2]], /kāore i tuhia ki te hītori.*kāore.*oti/);
assert.match(read('mi')[keys[3]], /tuatahi anake.*kāore.*oti/);
assert.match(read('zu')[keys[2]], /ngaphandle kokubhalwa emlandweni.*awaphelele/);
assert.match(read('zu')[keys[3]], /zokuqala kuphela.*akuphelele/);
assert.match(read('fj')['scrum-scope-cause-customFields'], /esitimeti/);
assert.doesNotMatch(read('fj')['scrum-scope-cause-customFields'], /vakatautauvata/i,
  'estimate is not the Fijian verb for compare');
// Native vocabulary also matters when the neighbouring language shares a script.
assert.match(read('bua')['scrum-scope-cause-customFields'], /Багсаамжа хубилаа/);
assert.match(read('cv')['scrum-scope-cause-customFields'], /Хаклав улшӑннӑ/);
assert.match(read('sah')['scrum-scope-cause-customFields'], /Сыаналааһын уларыйда/);
assert.match(read('wuu-Hans')[keys[2]], /勿出.*搿.*呒没/);
assert.match(read('ary')[keys[2]], /ما كيرجعش.*بلا ما يتسجلو/);
assert.match(read('ba')[keys[2]], /тарихҡа яҙылмайынса.*тулы түгел/);
assert.match(read('ba')[keys[3]], /Тәүге.*генә.*тулы түгел/);
assert.match(read('gv')['scrum-scope-cause-customFields'], /ooley/);
assert.match(read('kw')['scrum-scope-cause-customFields'], /dismygriv/);
assert.match(read('kw')[keys[3]], /dastrehevyans/);
assert.match(read('vo')['scrum-scope-cause-customFields'], /Täxetam/);
assert.match(read('gv')[keys[2]], /gyn Shennaghys.*cha nel.*slane/);
assert.match(read('vo')[keys[2]], /nen Jenotem.*no binons lölöfik/);
assert.match(read('tlh')[keys[2]], /qonbe'lu'.*naQbe'/);
assert.match(read('tlh')[keys[3]], /wa'DIch neH.*naQbe'/);
assert.match(read('ee')[keys[2]], /mele Ŋutinya me o.*medzɔ blibo o/);
assert.match(read('ff')[keys[2]], /winndaaka e Aslol.*timmaani/);
assert.match(read('se')[keys[2]], /Historjjá haga.*eai leat ollislaččat/);
assert.match(read('ff')[keys[3]], /adanɗe tan mbaawi janŋeede.*timmaani/);
assert.doesNotMatch(read('ff')[keys[3]], /mbaawaa/);
assert.match(read('bo')[keys[2]], /ཐོ་འགོད་མ་བྱས.*ཆ་ཚང་མེད/);
assert.match(read('dz')[keys[2]], /ཐོ་བཀོད་མ་འབད.*ཆ་ཚང་མེད/);
assert.match(read('ti')[keys[2]], /ከይተመዝገቡ.*ዘይተማልኡ/);
assert.match(read('ks')[keys[2]], /دَرٕج کَرنہٕ ورٲے.*نامکمل/);
assert.match(read('gn')[keys[2]], /oñemboguapy'ỹva Tembiasakuépe.*noĩmbái/);
assert.match(read('qu')[keys[2]], /mana.*qillqasqam.*mana hunt'asqachu/);
assert.match(read('ace')[keys[2]], /hana teucatat lam Sejarah.*gohlom leungkap/);
for (const key of keys) assert.doesNotMatch(read('qu')[key], /Kay willaymi:|Historyta|Estimate/, 'Quechua prose, not prefixed English');
assert.match(read('ay')[keys[2]], /jan qillqat.*jan phuqhatapkiti/);
for (const key of keys) assert.doesNotMatch(read('ay')[key], /Aymar aruna:|History|Estimate/, 'Aymara prose, not prefixed English');
assert.match(read('lld')[keys[2]], /zënza Cronologia.*nia complets/);
assert.match(read('rup')[keys[2]], /fãrã.*scriati tu Cronologia.*nu suntu ntredzi/);
assert.match(read('rup')[keys[2]], /starea pãstratã/);
assert.match(read('ve-PP')[keys[2]], /Istorijaha kirjutamata.*ei ole täuded/);
console.log(`Scrum scope history: ${keys.length} messages in ${codes.length} locales passed`);

assert.match(read('kl')['scrum-scope-history-inconsistent'], /nalunaarsorneqarsimanngillat.*tamakkiisuunngillat/);
assert.match(read('kl')['scrum-scope-history-truncated'], /siulliit kisimik.*tamakkiisuunngilaq/);

assert.match(read("nah")["scrum-scope-history-inconsistent"], /amo omotlacuilo.*amo ajsitoc/);
assert.match(read("nah")["scrum-scope-history-truncated"], /Zan in achto.*amo ajsitoc/);

assert.match(read("tig")["scrum-scope-history-inconsistent"], /ኢተከትቦ.*ምሉእ ኢኮኖ/);
assert.match(read("tig")["scrum-scope-history-truncated"], /ለአወል.*ሌጣ.*ምሉእ ኢኮን/);

assert.match(read("wal")["scrum-scope-history-inconsistent"], /xaafettibeenna.*kumetta gidokkona/);
assert.match(read("wal")["scrum-scope-history-truncated"], /Koyro.*xalaala.*kumetta gidenna/);
const wolayttaKeys = [...keys, "sync-estimate-source", "sync-estimate-source-weight", "sync-estimate-source-time", "sync-estimate-field-gitlab", "sync-estimate-field-gitlab-hint", "scrum-show-more", "scrum-import-resume", "scrum-import-discard", "scrum-import-recovery-hint"];
for (const key of wolayttaKeys) {
  assert.doesNotMatch(read("wal")[key], /^Wolayttatto:/, `${key}: a locale prefix is not a translation`);
}

assert.match(read("zgh")["scrum-scope-history-inconsistent"], /ⵓⵔ ⵜⵜⵡⴰⵣⵎⵎⴻⵎⵏ.*ⵓⵔ ⵎⵎⴷⵏⵜ/);
assert.match(read("zgh")["scrum-scope-history-truncated"], /ⵉⵎⵣⵡⵓⵔⴰ ⴽⴰⵏ.*ⵓⵔ ⵉⵎⵎⵉⴷ/);

assert.match(read("iu")["scrum-scope-history-inconsistent"], /ᑎᑎᕋᖅᑕᐅᓚᐅᙱᒻᒪᑕ.*ᐃᓚᑰᖅᑐᑦ/);
assert.match(read("iu")["scrum-scope-history-truncated"], /ᓯᕗᓪᓕᖅᐹᑦ.*ᑭᓯᒥ.*ᐃᓚᑰᖅᑐᑦ/);

assert.match(read("chr")["scrum-scope-history-inconsistent"], /Ꮭ ᎪᏪᎳᏅᎯ.*Ꮭ ᏂᎦᏓ/);
assert.match(read("chr")["scrum-scope-history-truncated"], /ᎢᎬᏱᎢ.*ᎤᏩᏒ.*Ꮭ ᏂᎦᏓ/);
