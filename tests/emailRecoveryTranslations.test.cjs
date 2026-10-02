'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(
  path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['ku', 'ckb', 'tt', 'tk_TM', 'pap', 'so', 'tpi', 'bi', 'yi', 'ary', 'wuu-Hans', 've-CC', 'bho', 'mai', 'kok', 'or_IN'];
const scripts = {
  ckb: 'Arabic', ary: 'Arabic', tt: 'Cyrillic', yi: 'Hebrew', 'wuu-Hans': 'Han',
  bho: 'Devanagari', mai: 'Devanagari', kok: 'Devanagari', or_IN: 'Oriya',
};
const keys = Object.keys(english).filter(key => key.startsWith('email-recovery-'));

for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
    const script = scripts[code] || 'Latin';
    assert.match(locale[key], new RegExp(`\\p{Script=${script}}`, 'u'), `${code}:${key}: native script`);
  }
  assert.notEqual(locale['email-recovery-pause'], locale['email-recovery-resume'], `${code}: opposite actions`);
  assert.notEqual(locale['email-recovery-retry'], locale['email-recovery-cancel'], `${code}: retry is not cancellation`);
  assert.notEqual(locale['email-recovery-busy'], locale['email-recovery-failed'], `${code}: busy is not an unconfirmed result`);
}

// Cancellation is irreversible only for the messages covered by this request.
// Retrying must retain the pause and the warning about uncertain delivery.
const meanings = {
  bho: {
    cancel: /वापस ना लावल जा सकी.*निहोरा के बाद.*बचल रही/,
    description: /वापस ना लिहल जा सकेला.*नतीजा पक्का नइखे.*दोबारा.*रोक बनल रहेला/,
  },
  mai: {
    cancel: /वापस नहि आनल जा सकत.*अनुरोधक बाद.*सुरक्षित रहत/,
    description: /वापस नहि लेल जा सकैत अछि.*अनिश्चित.*फेर पठाओल.*रोक कायम राखैत अछि/,
  },
  kok: {
    cancel: /परत मेळोवंक मेळचो ना.*विनंती उप्रांत.*सांबाळून दवरतले/,
    description: /परत घेवंक मेळना.*अनिश्चित.*परत धाडलो.*थांबणूक तशीच दवरता/,
  },
  or_IN: {
    cancel: /ଫେରାଇ ଆଣିହେବ ନାହିଁ.*ଅନୁରୋଧ ପରେ.*ନୂଆ ବାର୍ତ୍ତାଗୁଡ଼ିକ ରହିବ/,
    description: /ଫେରାଇ ଆଣିହେବ ନାହିଁ.*ଅନିଶ୍ଚିତ.*ପୁଣି ପଠାଯାଇପାରେ.*ବିରାମକୁ ବଜାୟ ରଖେ/,
  },
  yi: {
    cancel: /נישט קענען צוריקשטעלן.*נאָך דער בקשה בלײַבן געהיט/,
    description: /נישט צוריקנעמען.*אומזיכערן.*איבערחזרן.*האַלט די עקזיסטירנדיקע פּויזע/,
  },
  ary: {
    cancel: /ما يمكنش ترجعو.*من بعد هاد الطلب كيبقاو محفوظين/,
    description: /ما يمكنش ترجعها.*ما مؤكداش.*يتعاود.*كتخلي التوقيف المؤقت/,
  },
  'wuu-Hans': {
    cancel: /恢复勿了.*请求以后新建个消息会保留/,
    description: /收勿转来.*勿确定.*可能会重复.*暂停仍旧有效/,
  },
  've-CC': {
    cancel: /no se pol recuperarlo.*dopo sta richiesta i resta salvài/,
    description: /no se pol ciamarlo indrìo.*esito incerto.*ripetùo.*mantien la pausa/,
  },
  pap: {
    cancel: /no por wordu rekobrá.*despues di e petishon aki ta keda wardá/,
    description: /No por retirá.*inkonfirmá.*repetí.*mantené un pausa/,
  },
  so: {
    cancel: /dib looma soo celin karo.*codsigan ka dib waa la haynayaa/,
    description: /dib looma soo celin karo.*aan natiijadeeda la hubin.*ilaalisaa hakadkii hore/,
  },
  tpi: {
    cancel: /no inap kisim bek.*bihain long dispela askim bai stap yet/,
    description: /no inap kam bek.*no save gut.*salim em gen.*stopim.*dispela i stap yet/,
  },
  bi: {
    cancel: /no save tekem i kambak.*afta rikwes ia bae oli stap yet/,
    description: /no save tekem i kambak.*no klia.*sanem bakegen.*kipim eni stop smol/,
  },
  ku: {
    cancel: /nayê vegerandin.*piştî vê daxwazê.*dimînin/,
    description: /nayê paşvekişandin.*nezelal.*dubare.*rawestandina heyî diparêze/,
  },
  ckb: {
    cancel: /ناتوانرێت بگەڕێندرێنەوە.*دوای ئەم داواکارییە دەپارێزرێن/,
    description: /ناگەڕێندرێتەوە.*ناڕوونە.*دووبارە.*ڕاگرتنی هەنووکەیی دەپارێزێت/,
  },
  tt: {
    cancel: /кире кайтарып булмаячак.*сораудан соң.*хатлар саклана/,
    description: /кире алып булмый.*билгесез.*кабатланырга мөмкин.*туктатып торуны саклый/,
  },
  tk_TM: {
    cancel: /dikeldip bolmaz.*haýyşdan soň.*habarlar saklanar/,
    description: /yzyna alyp bolmaýar.*näbelli.*gaýtalanyp biler.*arakesmäni saklaýar/,
  },
};
for (const [code, expected] of Object.entries(meanings)) {
  assert.match(read(code)['email-recovery-confirm-cancel'], expected.cancel, `${code}: cancellation boundaries`);
  assert.match(read(code)['email-recovery-description'], expected.description, `${code}: delivery and pause warnings`);
}
for (const code of ['tpi', 'bi']) {
  for (const key of keys) {
    assert.doesNotMatch(read(code)[key], /Toksave:|Tok blong sistem:/, `${code}:${key}: no language-prefix filler`);
  }
}
assert.match(read('tpi')['email-recovery-heading'], /bilong salim/);
assert.match(read('bi')['email-recovery-heading'], /blong sanem/);
assert.match(read('ary')['email-recovery-description'], /ديال.*كتعاود.*دابا/);
assert.match(read('wuu-Hans')['email-recovery-description'], /辰光.*勒海.*勿/);
assert.match(read('ve-CC')['email-recovery-empty'], /No ghe xe/);
assert.match(read('bho')['email-recovery-unavailable'], /जाँचीं/);
assert.match(read('mai')['email-recovery-unavailable'], /जाँचू/);
assert.match(read('kok')['email-recovery-unavailable'], /तपासात/);
assert.match(read('or_IN')['email-recovery-empty'], /ନାହିଁ ଏବଂ.*ନାହିଁ/);
console.log(`Email recovery translations: ${keys.length} messages in ${codes.length} locales passed`);
