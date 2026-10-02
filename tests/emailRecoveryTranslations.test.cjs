'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(
  path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ['ku', 'ckb', 'tt', 'tk_TM', 'pap', 'so', 'tpi', 'bi', 'yi', 'ary', 'wuu-Hans', 've-CC', 'bho', 'mai', 'kok', 'or_IN', 'zu', 'zu-ZA', 'xh', 'ny', 'st', 'tn', 'nso', 'ss', 'rw', 'rn', 'lg', 'om', 'mi', 'sm', 'to', 'fj', 'hsb', 'szl', 'wa', 'lld', 'haw', 'gv', 'ts', 've', 'nd', 'wa-RR', 'rup', 'se', 'cv', 'bua', 'bo', 'wo', 'ace', 'ak', 'bm', 'ee', 'ay', 'qu', 'gn', 'tlh', 'ti', 'sah', 'vo', 've-PP', 'ks', 'ff', 'dz', 'kl', 'nah', 'zgh', 'wal', 'iu', 'tig', 'chr'];
const scripts = {
  chr: 'Cherokee',
  tig: 'Ethiopic',
  iu: 'Canadian_Aboriginal',
  zgh: 'Tifinagh',
  dz: 'Tibetan',
  ks: 'Arabic',
  ti: 'Ethiopic', sah: 'Cyrillic', bo: 'Tibetan', cv: 'Cyrillic', bua: 'Cyrillic', ckb: 'Arabic', ary: 'Arabic', tt: 'Cyrillic', yi: 'Hebrew', 'wuu-Hans': 'Han',
  bho: 'Devanagari', mai: 'Devanagari', kok: 'Devanagari', or_IN: 'Oriya',
};
const keys = Object.keys(english).filter(key => key.startsWith('email-recovery-'));

// The email recovery batch is now filled in every non-English catalog.
// Keep this gate broader than the locales with wording checks below.
const allLocaleFiles = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file));
for (const file of allLocaleFiles) {
  const locale = read(file.replace('.i18n.json', ''));
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${file}:${key}: missing email recovery message`);
    assert.notEqual(locale[key], english[key], `${file}:${key}: untranslated email recovery message`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${file}:${key}: email recovery tokens`);
  }
}

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
  chr: {
    cancel: /Ꮭ ᏰᎵ ᏔᎵᏁ ᎠᎩᏍᏗ.*ᎯᎠ ᎠᏛᏗ ᎣᏂ.*ᎠᏍᏆᏂᎪᏛ/,
    description: /Ꮭ ᏰᎵ ᏔᎵᏁ ᎠᎩᏍᏗ.*Ꮭ ᏱᎦᏔᎲᎢ.*ᏔᎵᏁ ᏱᎦᏅᏗ.*ᎠᎴᏫᏍᏙᏗ ᎦᏳᎳ ᎠᏯᏙᎸ ᎾᏍᏉ ᎠᏍᏆᏂᎪᏛ/,
  },
  tig: {
    cancel: /እግል ልትመለስ ኢቀድር.*ሐቆ እሊ ጠለብ.*ልትዐቀብ/,
    description: /እግል ልትመለስ ኢቀድር.*ለኢትአከደ.*ክልኤ ኢነት.*ለቀደም ሀለ ሽውየ አቅማት ልዐቀብ/,
  },
  iu: {
    cancel: /ᐅᑎᖅᑎᑕᐅᔪᓐᓇᙱᓪᓗᑎᒃ.*ᑐᒃᓯᕋᐅᑎᐅᑉ ᑭᖑᓂᐊᒍᑦ.*ᑐᖅᑯᖅᑕᐅᓂᐊᖅᐳᑦ/,
    description: /ᐅᑎᖅᑎᑕᐅᔪᓐᓇᙱᓚᖅ.*ᓇᓗᓇᖅᐸᑦ.*ᓇᒃᓯᐅᔾᔭᐅᒃᑲᓐᓂᕈᓐᓇᖅᐳᖅ.*ᓄᖅᑲᖓᑎᑲᐃᓐᓇᕐᓂᕐᓗ ᐱᑕᖃᖅᑐᖅ ᐊᓯᔾᔨᖅᑕᐅᙱᓚᖅ/,
  },
  wal: {
    cancel: /zaaridi ehanau danddayettenna.*oychchaappe guyyiyan.*naagettana/,
    description: /guyyekko zaaranau danddayettenna.*geeshshi erettibeenna.*naa77u gede.*kase de7iya guutta wodiyaayyo essiyoogaa naagees/,
  },
  zgh: {
    cancel: /ⵓⵔ ⵉⵣⵎⵉⵔ ⴰⴷ ⴷ ⵢⵓⵖⴰⵍ.*ⴷⴻⴼⴼⵉⵔ ⵓⵙⵓⵜⴻⵔ.*ⵜⵜⵡⴰⵃⴹⵓⵏⵜ/,
    description: /ⵓⵔ ⵜⵣⵎⵔⵉ ⴰⴷ ⴷ ⵜⵓⵖⴰⵍ.*ⵓⵔ ⵏⵙⵙⵉⵏ.*ⵜⴻⵜⵜⵡⴰⵍⵙ.*ⵉⵃⴹⴹⵓ ⴰⵙⴱⴻⴷⴷ ⴰⴽⵓⴷⴰⵏ ⵍⵍⵉ ⵉⵍⵍⴰⵏ/,
  },
  nah: {
    cancel: /amo huel mocuepaz.*zatepan inin tlahtlaniliztli mopiyaz/,
    description: /amo huel mocuepa.*amo machi.*oc ceppa motitlaniz.*quipiya quetzaliztli tlen ye onca/,
  },
  kl: {
    cancel: /utertinneqarsinnaanatik.*Qinnuteqaatip matuma kingorna.*toqqorneqassapput/,
    description: /utertinneqarsinnaanngilaq.*nalorninarpat.*nassiuteqqinneqarsinnaavoq.*unitsikkallarnerlu pioreersoq attatiinnarneqartarpoq/,
  },
  dz: {
    cancel: /ལོག་གསོ་མི་ཚུགས.*ཞུ་བ་འདིའི་ཤུལ་ལས.*ཚུ་བཞག་འོང/,
    description: /ལོག་ལེན་མི་ཚུགས.*ངེས་བདེན་མེད.*ལོག་གཏང་སྲིད.*བཀག་ཆ་འདི་རང་འཇགས་བཞགཔ་ཨིན/,
  },
  ff: {
    cancel: /waawaa artireede.*caggal ɗaɓɓitannde ndee ina ndanndee/,
    description: /waawaa artireede.*humpito mum laaɓaani.*waawi waɗeede kadi.*reena dartingol goodngol/,
  },
  ks: {
    cancel: /ہیکہٕ نٕ وٲپس.*درخواستہٕ پتہٕ.*محفوظ تھٲونہٕ/,
    description: /ہیکہٕ نٕ وٲپس.*غٲر یقینی.*دوبارٕ گٔژھِتھ.*رُکاو چھُ برقرار تھٲوان/,
  },
  've-PP': {
    cancel: /ei sa pördutada.*küzundan jäl’ghe, kaitas/,
    description: /ei sa pördutada tagaze.*epävarman.*tehta udes.*kaičeb nügüdläižen seizatamižen/,
  },
  vo: {
    cancel: /no kanon pagegivön.*pos beg at padakipons/,
    description: /no kanon pagegivön.*nefümik kanon padönuön.*dakipon sistami dabinöl/,
  },
  ti: {
    cancel: /ክምለስ ድማ ኣይክእልን.*ድሕሪ እዚ ጠለብ.*ይቕመጡ/,
    description: /ንድሕሪት ክምለስ ኣይክእልን.*ዘይተረጋገጸ.*ክድገም.*ዘሎ ግዝያዊ ምቁራጽ ድማ ይሕሉ/,
  },
  sah: {
    cancel: /төннөрөр кыах суох буолуо.*көрдөһүү кэнниттэн.*хаалларыллыахтара/,
    description: /төннөрөр кыах суох.*түмүгэ биллибэт.*хат оҥоһуллуон сөп.*баар быстах тохтото турууну тутуһар/,
  },
  gn: {
    cancel: /ndaikatumo'ãi ojegueru jey.*ko jerure rire/,
    description: /ndaikatúi ojegueru jey.*ndojekuaáiva og̃uahẽpa.*ikatu ojehu jey.*oñeñongatu ñemombyta sapy'a oĩmava/,
  },
  tlh: {
    cancel: /Suqqa'laHbe'lu'.*tlhobghachvam qaSpu'DI'.*pollu'/,
    description: /tlhapqa'laHbe'lu'.*Sovbe'lu'chugh.*cha'logh ngeHlu'laH.*yevtaHchugh Qu', yevtaH/,
  },
  ay: {
    cancel: /janiw kutt'ayasiñjamäkaniti.*mayiwi qhipat.*imatäniwa/,
    description: /janiw kutt'ayaskaspati.*jan yatiskchi.*mayamp apayataspawa.*mä juk'a sayt'ayäwi imaraki/,
  },
  qu: {
    cancel: /manam kutichiyta atikunqachu.*mañakuy qhipaman.*waqaychasqa kanqa/,
    description: /manam kutichiyta atinkichu.*mana yachasqa.*iskay kutipi.*kunan kaq pisi pachapaq sayachiyta waqaychan/,
  },
  bm: {
    cancel: /u tɛ se ka lasegin.*delili in kɔfɛ bɛna mara/,
    description: /tɛ se ka lasegin.*nɔfɛko ma dafa.*siɲɛ fila.*lajɔli waati dɔ kɔnɔ min bɛ yen mara/,
  },
  ee: {
    cancel: /womate ŋu agbugbɔ wo ava o.*biabia sia megbe ɖo/,
    description: /Womate ŋu agbugbɔ.*emetsonu meka ɖe edzi o.*adzɔ ake.*wòléa tete vie si li xoxo la ɖe asi/,
  },
  ace: {
    cancel: /hana jeuet geupeuwoe lom.*lheueh peumintaan nyoe geukeubah/,
    description: /hana jeuet tacok woe.*hana pasti.*teukirem dua go.*geujaga peupioh siat nyang ka na/,
  },
  ak: {
    cancel: /wɔrentumi nsan mfa mma.*abisade yi akyi no so/,
    description: /Wontumi nsan mfa.*wonnim sɛ akɔdu.*betumi akɔ bio.*ɛkora bere tiaa mu gyinabea a ɛwɔ hɔ no so/,
  },
  bo: {
    cancel: /སླར་གསོ་བྱ་མི་ཐུབ.*རེ་ཞུ་འདིའི་རྗེས་སུ.*ཉར་ཚགས་བྱེད/,
    description: /ཕྱིར་ལེན་མི་ཐུབ.*འབྱོར་མིན་མ་ངེས.*བསྐྱར་དུ་གཏོང་སྲིད.*ད་ཡོད་ཀྱི་གནས་སྐབས་མཚམས་འཇོག་མུ་མཐུད་དུ་ཉར/,
  },
  wo: {
    cancel: /mëneesul a delloo ko.*gannaaw laaj bii/,
    description: /mëneesul a delloo.*guñu wóorul.*ñaari yoon.*sàmm taxawal gi fi nekk/,
  },
  cv: {
    cancel: /каялла тавӑрма ҫук.*ыйтӑм хыҫҫӑн.*упранӗҫ/,
    description: /каялла илме ҫук.*паллӑ мар.*тепӗр хут.*халӗ пур чарса тӑнине упрать/,
  },
  bua: {
    cancel: /һэргээжэ болохогүй.*хүсэлтын һүүлээр.*хадагалагдаха/,
    description: /бусаажа болохогүй.*тодорхойгүй.*дахин.*мүнөө байгаа түр зогсоолгые сахина/,
  },
  rup: {
    cancel: /nu poati s-hibã turnat nãpoi.*dupã aestã tsireri va s-hibã pãstrati/,
    description: /nu poati s-hibã turnat nãpoi.*nishigur.*repetatã.*tsãni pauza tsi easti tora/,
  },
  se: {
    cancel: /ii dan sáhte máhcahit.*dán bivdaga maŋŋá vurkejuvvojit/,
    description: /ii sáhte geassit ruovttoluotta.*eahpesihkar.*geardduhuvvot.*doallá dálá botto fámus/,
  },
  nd: {
    cancel: /ngeke kubuyiselwe.*ngemva kwalesi sicelo izagcinwa/,
    description: /awungeke ubuyiselwe emuva.*okungaqinisekanga.*kungaphindwa.*kugcina ukumiswa okwesikhatshana okukhona/,
  },
  'wa-RR': {
    cancel: /diri na maibabalik.*katapos hini nga hangyo/,
    description: /diri na mababawi.*diri sigurado.*mautro.*nagtitipig han aada na nga temporaryo nga pagpaundang/,
  },
  ts: {
    cancel: /a byi nge vuyisiwi.*endzhaku ka xikombelo lexi ma ta hlayisiwa/,
    description: /a ma nge tlherisiwi.*nga tiyisisiwangiki.*phindhiwa.*hlayisa ku yimisiwa ka xinkarhana loku nga kona/,
  },
  ve: {
    cancel: /a zwi koni u vhuyedzedzwa.*nga murahu ha khumbelo iyi i ḓo vhulungwa/,
    description: /a u koni u humiselwa murahu.*sa khwaṱhisedzwaho.*dovhololwa.*vhulunga u imiswa lwa tshifhinganyana hu re hone/,
  },
  haw: {
    cancel: /ʻaʻole hiki ke hoʻihoʻi hou ʻia.*ma hope o kēia noi/,
    description: /ʻAʻole hiki ke hoʻihoʻi mai.*hoʻouna hou ʻia.*maopopo ʻole.*mālama i ka hoʻomaha e kū nei/,
  },
  gv: {
    cancel: /cha nod eh ve er ny gheddyn er-ash.*lurg yn aghin shoh freilt/,
    description: /Cha nod oo.*y gheddyn er-ash.*nagh vel shickyr.*jeant reesht.*freayll yn scuirr son tammylt t'ayn hannah/,
  },
  wa: {
    cancel: /n' pôrè nén esse rapexhî.*après cisse dimande ci sont wårdès/,
    description: /n' pout nén esse rapelî.*nén seur.*deus côps.*wåde li djocaedje k' i gn a dedja/,
  },
  lld: {
    cancel: /ne possa nia unì recuperà.*do chësta dumanda vën mantignui/,
    description: /ne possa nia unì clamà zoruch.*nia segur.*repetì.*mantegn la pausa che ie bele/,
  },
  hsb: {
    cancel: /njeda so wobnowić.*po tutym naprašowanju.*so wobchowaja/,
    description: /njeda so wróćo wołać.*njewěstym.*wospjetować.*wobchowa eksistowacu přestawku/,
  },
  szl: {
    cancel: /niy bydzie szło jij prziwrōcić.*po tym żōndaniu ôstanōm zachowane/,
    description: /niy idzie cofnōńć.*niypewnym.*powtōrzić.*zachowuje teroźnõ pauzã/,
  },
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
assert.match(read('hsb')['email-recovery-queued'], /Powěsće.*čakanskim rjedźe/);
assert.match(read('szl')['email-recovery-retry'], /Sprōbuj zaś.*niyudane/);
assert.match(read('wa')['email-recovery-retry'], /Risayî.*n' ont nén passé/);
assert.match(read('lld')['email-recovery-busy'], /proa inò do n curt tëmp/);
assert.doesNotMatch(read('lld')['email-recovery-description'], /chvíla/);
assert.match(read('haw')['email-recovery-heading'], /Lālani kali.*leka uila/);
assert.match(read('gv')['email-recovery-heading'], /Rolley fuirraght.*post-l/);
for (const key of keys) assert.doesNotMatch(read('gv')[key], /raaue/i, `${key}: queue is not a warning`);
assert.equal(read('ts').pause, 'Yimisa swa xinkarhana');
assert.equal(read('ve').pause, 'Imisani lwa tshifhinganyana');
for (const code of ['ts', 've']) {
  assert.doesNotMatch(read(code).pause, /Hi Xitsonga:|Misa isikhashana/);
  assert.deepEqual(translationTokens(read(code).pause), translationTokens(english.pause));
}
assert.match(read('nd')['email-recovery-description'], /khathesi.*Nxa.*omutsha/);
assert.match(read('wa-RR')['email-recovery-description'], /han.*ngan.*yana/);
assert.match(read('rup')['email-recovery-unavailable'], /ghivãsitã/);
assert.doesNotMatch(read('se')['email-recovery-confirm-cancel'], /eikä/);
for (const [key, value] of Object.entries({email: 'Postã electronicã', 'email-fail': 'Trimitirea a email-lui nu ari suxes', 'email-sent': 'Email trimeas'})) {
  assert.equal(read('rup')[key], value);
  assert.doesNotMatch(read('rup')[key], /Correo|Invio|inviata/);
  assert.deepEqual(translationTokens(read('rup')[key]), translationTokens(english[key]));
}
assert.match(read('cv')['email-recovery-queued'], /Черетри пӗлтерӳсем/);
assert.match(read('bua')['email-recovery-description'], /бэдэрэгты.*байһан.*оролдохо/);
assert.match(read('wo')['email-recovery-description'], /dafay téye.*tàmbaliwaat jéem yi/);
assert.match(read('bo')['email-recovery-retry'], /འཕྲིན་ཡིག་བསྐྱར་དུ་གཏོང/);
assert.match(read('ace')['email-recovery-next'], /nyang teuma teuka/);
const repairedEmailLabels = {
  ace: {'email-fail': 'Emel hana jeuet teukirem', 'email-sent': 'Emel ka teukirem'},
  ak: {email: 'Ɛmɛl', 'email-fail': 'Ɛmɛl no soma anyɛ yiye', 'email-fail-text': 'Mfomso sii bere a wɔbɔɔ mmɔden sɛ wɔbɛsoma ɛmɛl no', 'email-sent': 'Yɛasoma ɛmɛl no', pause: 'Gyina kakra'},
};
for (const [code, labels] of Object.entries(repairedEmailLabels)) {
  for (const [key, value] of Object.entries(labels)) {
    assert.equal(read(code)[key], value);
    assert.doesNotMatch(read(code)[key], /terkirim|Somaing|trying|Nsɛm a ɛfa dwumadi yi ho/);
    assert.deepEqual(translationTokens(read(code)[key]), translationTokens(english[key]));
  }
}
assert.match(read('bm')['email-recovery-queued'], /Cikanw makɔnɔsɛbɛn kɔnɔ/);
assert.match(read('ee')['email-recovery-description'], /nuŋɔŋlɔƒewo.*Ɖoɖo ɖa nu tsitsi/);
assert.doesNotMatch(read('ee')['email-recovery-description'], /email agblewo/);
assert.match(read('qu')['email-recovery-description'], /apachiyta kallpachakun/);
assert.match(read('ay')['email-recovery-unavailable'], /janiw ullañjamäkiti/);
for (const [code, labels] of Object.entries({ay: {pause: "Mä juk'a sayt'ayaña"}, qu: {pause: 'Pisi pachapaq sayachiy', email: 'Elektroniku chaski'}})) {
  for (const [key, value] of Object.entries(labels)) {
    assert.equal(read(code)[key], value);
    assert.doesNotMatch(read(code)[key], /Aymar aruna:|Kay willaymi:|Pause|Pauseta/);
    assert.deepEqual(translationTokens(read(code)[key]), translationTokens(english[key]));
  }
}
assert.match(read('gn')['email-recovery-pause'], /Emombyta sapy'a/);
assert.match(read('tlh')['email-recovery-retry'], /DangeHqa' 'e' yInID/);
assert.doesNotMatch(read('tlh')['email-recovery-description'], /tetlHDaq/);
assert.match(read('ti')['email-recovery-retry'], /ዝፈሸሉ.*እንደገና ፈትን/);
assert.match(read('sah')['email-recovery-description'], /Ылар киһи аайы.*уочаракка.*билигин/);
assert.match(read('ks')['email-recovery-description'], /پرٛتھ.*خٲطرٕ.*چھُ.*تھٲوان/);
for (const key of ['pause', 'email-sent', 'email-fail', 'email-fail-text']) {
  assert.doesNotMatch(read('wal')[key], /Wolayttatto:|Pause|sent|failed|trying/);
  assert.deepEqual(translationTokens(read('wal')[key]), translationTokens(english[key]));
}
assert.match(read('wal')['email-sent'], /yedettiis/);
assert.match(read('wal').pause, /Guutta wodiyaayyo essa/);
assert.match(read('tig')['email-recovery-description'], /እግል.*ዲብ.*ኢቀድር/);
assert.doesNotMatch(read('tig')['email-recovery-description'], /ኣይክእልን|እዩ|ይኽእል/);
for (const [key, value] of Object.entries({'email-sent': 'ኢመይል ትላአከ', pause: 'ሽውየ አቅም'})) {
  assert.equal(read('tig')[key], value);
  assert.doesNotMatch(read('tig')[key], /ተሰዲዱ|ደው ኣብል/);
  assert.deepEqual(translationTokens(read('tig')[key]), translationTokens(english[key]));
}
assert.equal(read('to').pause, 'Taʻofi fakataimi');
assert.doesNotMatch(read('to').pause, /Faka-Tonga:|Pause/);
assert.deepEqual(translationTokens(read('to').pause), translationTokens(english.pause));
console.log(`Email recovery translations: ${keys.length} messages in ${codes.length} locales passed`);
