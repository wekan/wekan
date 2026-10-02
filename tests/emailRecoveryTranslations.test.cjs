'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(
  path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['ku', 'ckb', 'tt', 'tk_TM', 'pap', 'so', 'tpi', 'bi', 'yi', 'ary', 'wuu-Hans', 've-CC', 'bho', 'mai', 'kok', 'or_IN', 'zu', 'zu-ZA', 'xh', 'ny', 'st', 'tn', 'nso', 'ss', 'rw', 'rn', 'lg', 'om', 'mi', 'sm', 'to', 'fj'];
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
  mi: {
    cancel: /kāore e taea te whakaora.*i muri i tēnei tono/,
    description: /Kāore e taea te whakahoki mai.*tukuna anō.*kāore i te mōhiotia.*ka mau tonu te whakatā/,
  },
  sm: {
    cancel: /lē mafai ona toe maua.*ina ua uma lenei talosaga/,
    description: /lē mafai ona toe aumai.*toe auina atu.*lē mautinoa.*taofi mo sina taimi ua iai/,
  },
  to: {
    cancel: /ʻikai lava ke fakafoki.*hili ʻa e kolé ni/,
    description: /ʻikai lava ke fakafoki mai.*toe ʻave.*ʻikai fakapapauʻi.*taʻofi fakataimi ʻoku lolotonga/,
  },
  fj: {
    cancel: /sega ni rawa ni vakalesui mai.*ni oti na kerekere oqo/,
    description: /sega ni rawa ni vakalesui mai.*vakau tale.*sega ni matata.*vakacegu vakawawa sa tiko/,
  },
  rw: {
    cancel: /ntibishobora kugarurwa.*nyuma y'ubu busabe buzagumaho/,
    description: /ntibushobora kugarurwa.*kutazwi neza.*gusubirwamo.*kubahiriza ihagarikwa ry'akanya/,
  },
  rn: {
    cancel: /ntibishobora kugarurwa.*inyuma y'iki gisabo buzogumaho/,
    description: /ntibushobora kugarurwa.*ritazwi neza.*gusubirwamwo.*bigumana ihagarikwa rya gatoyi/,
  },
  lg: {
    cancel: /tebisobola kukomezebwawo.*oluvannyuma lw'okusaba kuno bujja kusigalawo/,
    description: /tebusobola kukomezebwawo.*okutakakasiddwa.*okuddamu.*kukuuma okuyimiriza okw'akaseera/,
  },
  om: {
    cancel: /deebisuunis hin danda'amu.*gaaffii kana booda.*ni eegamu/,
    description: /fudhatamuu hin danda'u.*hin mirkanoofne.*irra deebi'amuu.*dhaabbii yeroo muraasaa duraan jirus ni eega/,
  },
  st: {
    cancel: /di ke ke tsa kgutlisetswa.*kamora kopo ena e tla bolokwa/,
    description: /o ke ke wa busetswa morao.*se sa tiisehang.*ho ka phetwa.*ho boloka ho emiswa ha nakwana/,
  },
  tn: {
    cancel: /di ka se busediwe.*morago ga kopo eno e tla bolokwa/,
    description: /ga o ka ke wa busediwa morago.*tse di sa tlhomamang.*go ka boelediwa.*go boloka go ema nakwana/,
  },
  nso: {
    cancel: /di ka se bušetšwe.*morago ga kgopelo ye e tla bolokwa/,
    description: /o ka se bušetšwe morago.*tše di sa kgonthišegego.*go ka boeletšwa.*go boloka go emišwa nakwana/,
  },
  ss: {
    cancel: /ngeke kubuyiselwe.*ngemuva kwalesicelo itawugcinwa/,
    description: /awukwati kubuyiswa.*longacinisekile.*kungaphindvwa.*kugcina kumiswa kwesikhashana/,
  },
  zu: {
    cancel: /ngeke kubuyiselwe.*ngemva kwalesi sicelo izogcinwa/,
    description: /awukwazi ukubuyiswa.*okungaqinisekisiwe.*kungase kuphindwe.*kugcina ukumiswa kwesikhashana/,
  },
  xh: {
    cancel: /awunakubuyiselwa.*emva kwesi sicelo iya kugcinwa/,
    description: /awunakubuyiswa.*esingaqinisekanga.*kunokuphindwa.*kugcina ukunqumama/,
  },
  ny: {
    cancel: /sizingabwezeretsedwe.*pambuyo pa pempholi adzasungidwa/,
    description: /sungabwezedwe.*sizikudziwika.*kungabwerezedwe.*kumasunga kuimitsidwa kaye/,
  },
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
meanings['zu-ZA'] = meanings.zu;
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
assert.match(read('zu')['email-recovery-queued'], /Imilayezo esemugqeni/);
assert.match(read('xh')['email-recovery-queued'], /Imiyalezo esemgceni/);
assert.match(read('ny')['email-recovery-queued'], /Mauthenga.*pamzere/);
assert.match(read('st')['email-recovery-resume'], /Tswela pele/);
assert.match(read('tn')['email-recovery-resume'], /Tswelela/);
assert.match(read('nso')['email-recovery-resume'], /Tšwela pele/);
assert.match(read('ss')['email-recovery-resume'], /Chubeka nekutfumela/);
assert.match(read('rw')['email-recovery-retry'], /Ongera.*kohereza/);
assert.match(read('rn')['email-recovery-retry'], /Subira.*kurungika/);
assert.match(read('lg')['email-recovery-saving'], /luzzibwa buggya/);
assert.match(read('om')['email-recovery-confirm-cancel'], /haquu barbaaddaa\?/);
assert.equal(read('to').pause, 'Taʻofi fakataimi');
assert.doesNotMatch(read('to').pause, /Faka-Tonga:|Pause/);
assert.deepEqual(translationTokens(read('to').pause), translationTokens(english.pause));
console.log(`Email recovery translations: ${keys.length} messages in ${codes.length} locales passed`);
