'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('continuous-backup'));
const codes = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json'))
  .map(file => file.slice(0, -'.i18n.json'.length))
  .filter(code => !/^en(?:[-_]|$)/.test(code));
assert.ok(codes.length > 0, 'locale catalogs must be present');
for (const code of codes) {
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
  [['nl', 'nl-NL', 'vl-SS'], /overschrijft nooit het bestand dat in gebruik is/, /gekozen generatie.*gekozen tijdstip.*tijdens het herstel gepauzeerd/, ['seconden', 'uren', 'dagen']],
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
  [['la'], /numquam fasciculo qui in usu est superscribitur/, /Generationem electam ad tempus electum.*Dum restitutio fit.*intermittitur/, ['secunda', 'horae', 'dies']],
  [['tg'], /ҳеҷ гоҳ файли дар истифода бударо рӯнависӣ намекунад/, /Насли интихобшуда ба лаҳзаи интихобшуда.*Ҳангоми барқарорсозӣ.*муваққатан боздошта мешавад/, ['сония', 'соат', 'рӯз']],
  [['ky'], /колдонулуп жаткан файлдын үстүнө эч качан жазбайт/, /Тандалган муун тандалган учурдагы.*Калыбына келтирүү учурунда.*убактылуу токтотулат/, ['секунд', 'саат', 'күн']],
  [['mt'], /qatt ma jikteb fuq il-fajl li qed jintuża/, /ġenerazzjoni magħżula.*mument magħżul.*jieqaf temporanjament waqt ir-restawr/, ['sekondi', 'sigħat', 'jiem']],
  [['ht'], /pa janm ekri sou fichye k ap itilize a/, /jenerasyon ou chwazi a.*moman ou chwazi a.*kanpe tanporèman pandan retablisman an/, ['segonn', 'èdtan', 'jou']],
  [['lb'], /iwwerschreift ni d’Datei, déi am Gebrauch ass/, /gewielte Generatioun.*gewielten Zäitpunkt.*wärend der Restauratioun pauséiert/, ['Sekonnen', 'Stonnen', 'Deeg']],
  [['cy', 'cy-GB'], /byth yn trosysgrifo’r ffeil sy’n cael ei defnyddio/, /genhedlaeth a ddewiswyd.*adeg a ddewiswyd.*oedi yn ystod yr adferiad/, ['eiliadau', 'oriau', 'dyddiau']],
  [['ga'], /ní fhorscríobhann sé an comhad atá in úsáid riamh/, /an ghlúin roghnaithe.*an tráth roghnaithe.*ar sos le linn an athchóirithe/, ['soicindí', 'uaireanta', 'laethanta']],
  [['si'], /භාවිතයේ ඇති ගොනුව කිසිවිටෙකත් උඩින් නොලියයි/, /තෝරාගත් පරම්පරාව තෝරාගත් මොහොතේ.*ප්‍රතිසාධනය අතරතුර.*තාවකාලිකව නවතී/, ['තත්පර', 'පැය', 'දින']],
  [['pa'], /ਵਰਤੋਂ ਵਿੱਚ ਮੌਜੂਦ ਫਾਈਲ ਨੂੰ ਕਦੇ ਵੀ ਓਵਰਰਾਈਟ ਨਹੀਂ ਕਰਦੀ/, /ਚੁਣੀ ਹੋਈ ਪੀੜ੍ਹੀ ਨੂੰ ਚੁਣੇ ਹੋਏ ਸਮੇਂ ਦੀ.*ਰੀਸਟੋਰ ਕਰਨ ਦੌਰਾਨ.*ਅਸਥਾਈ ਤੌਰ ਉੱਤੇ ਰੁਕ ਜਾਵੇਗਾ/, ['ਸਕਿੰਟ', 'ਘੰਟੇ', 'ਦਿਨ']],
  [['ml'], /ഉപയോഗത്തിലുള്ള ഫയലിന് മുകളിൽ ഒരിക്കലും എഴുതില്ല/, /തിരഞ്ഞെടുത്ത തലമുറയെ തിരഞ്ഞെടുത്ത സമയത്തെ.*പുനഃസ്ഥാപന സമയത്ത്.*താൽക്കാലികമായി നിർത്തും/, ['സെക്കൻഡ്', 'മണിക്കൂർ', 'ദിവസം']],
  [['kn'], /ಬಳಕೆಯಲ್ಲಿರುವ ಫೈಲ್ ಅನ್ನು ಎಂದಿಗೂ ತಿದ್ದಿಬರೆಯುವುದಿಲ್ಲ/, /ಆಯ್ಕೆಮಾಡಿದ ಪೀಳಿಗೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿದ ಸಮಯದ.*ಮರುಸ್ಥಾಪನೆಯ ಸಮಯದಲ್ಲಿ.*ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲುತ್ತದೆ/, ['ಸೆಕೆಂಡುಗಳು', 'ಗಂಟೆಗಳು', 'ದಿನಗಳು']],
  [['gu-IN'], /ઉપયોગમાં રહેલી ફાઇલને ક્યારેય ઓવરરાઇટ કરતી નથી/, /પસંદ કરેલી પેઢીને પસંદ કરેલા સમયની.*પુનઃસ્થાપન દરમિયાન.*અસ્થાયી રૂપે અટકશે/, ['સેકન્ડ', 'કલાક', 'દિવસ']],
  [['te-IN'], /ఉపయోగంలో ఉన్న ఫైల్‌ను ఎప్పుడూ ఓవర్‌రైట్ చేయదు/, /ఎంచుకున్న తరాన్ని ఎంచుకున్న సమయపు.*పునరుద్ధరణ సమయంలో.*తాత్కాలికంగా ఆగుతుంది/, ['సెకన్లు', 'గంటలు', 'రోజులు']],
  [['ta'], /பயன்பாட்டில் உள்ள கோப்பை ஒருபோதும் மேலெழுதாது/, /தேர்ந்தெடுத்த தலைமுறையைத் தேர்ந்தெடுத்த நேரத்தின்.*மீட்டெடுப்பின்போது.*தற்காலிகமாக நிறுத்தப்படும்/, ['நொடிகள்', 'மணிநேரம்', 'நாட்கள்']],
  [['mr'], /वापरात असलेली फाइल कधीही अधिलिखित करत नाही/, /निवडलेली पिढी निवडलेल्या क्षणाच्या.*पुनर्संचयित करताना.*तात्पुरता थांबवला जाईल/, ['सेकंद', 'तास', 'दिवस']],
  [['ne'], /प्रयोगमा रहेको फाइललाई कहिल्यै अधिलेखन गर्दैन/, /छानिएको पुस्तालाई छानिएको समयको.*पुनःस्थापनाको समयमा.*अस्थायी रूपमा रोकिनेछ/, ['सेकेन्ड', 'घण्टा', 'दिन']],
  [['mn'], /ашиглаж буй файлыг хэзээ ч дарж бичихгүй/, /Сонгосон үеийг сонгосон мөчийн төлөвт.*Сэргээх явцад.*түр зогсоно/, ['секунд', 'цаг', 'хоног']],
  [['kk'], /қолданыстағы файлдың үстіне ешқашан жазбайды/, /Таңдалған буын таңдалған сәттегі.*Қалпына келтіру кезінде.*уақытша тоқтатылады/, ['секунд', 'сағат', 'күн']],
  [['uz-AR'], /هېچ قچان یازمیدی/, /تنلنگن آولاد تنلنگن پیتدگی.*تیکله‌ش دوامیده.*تۉختتیله‌دی/, ['ثانیه', 'ساعت', 'کون']],
  [['uz', 'uz-UZ', 'uz-LA'], /ishlatilayotgan faylning ustiga hech qachon yozmaydi/, /Tanlangan avlod tanlangan paytdagi holatiga.*Tiklash davomida.*vaqtincha to‘xtatiladi/, ['soniya', 'soat', 'kun']],
  [['hy'], /երբեք չի վերագրում օգտագործվող ֆայլը/, /ընտրված սերունդը ընտրված պահի վիճակով.*Վերականգնման ընթացքում.*ժամանակավորապես կդադարեցվի/, ['վայրկյան', 'ժամ', 'օր']],
  [['ka'], /არასოდეს გადაწერს გამოყენებაში მყოფ ფაილს/, /არჩეული თაობა არჩეულ მომენტში.*აღდგენის დროს.*დროებით შეჩერდება/, ['წამები', 'საათები', 'დღეები']],
  [['az', 'az-AZ', 'az-LA'], /istifadədə olan faylın üzərinə heç vaxt yazmır/, /Seçilmiş nəsil seçilmiş andakı vəziyyətinə.*Bərpa zamanı.*müvəqqəti dayandırılacaq/, ['saniyə', 'saat', 'gün']],
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
  [['km', 'km-KH', 'km_KH'], /មិនដែលសរសេរជាន់លើឯកសារដែលកំពុងប្រើទេ/, /ជំនាន់ដែលបានជ្រើសរើស.*ពេលដែលបានជ្រើសរើស.*ផ្អាកជាបណ្តោះអាសន្ននៅពេលកំពុងស្តារ/, ['វិនាទី', 'ម៉ោង', 'ថ្ងៃ']],
  [['nah'], /ayic quipatla in tlahcuilolamatl tlen axcan motequitiltia/, /innechicoliz tlen omopehpen ipan in cahuitl tlen omopehpen.*Icuac mocuepa.*moquetzaz zan achitzin cahuitl/, ['segundos', 'horas', 'tonaltin']],
  [['kl'], /filip maanna atorneqartup qaavatigut qaquguluunniit allanneqarneq ajorpoq/, /Backupit ataatsikkoortut toqqakkat piffissamut toqqakkamut.*Utertitsineq ingerlanneqarnerani.*unitsikkallarneqassaaq/, ['sekundit', 'akunnerit', 'ullut']],
  [['ff'], /lommbataa fiilde kuutorteende jooni hay sahaa gooto/, /fedde dannditole suɓaande.*sahaa suɓaaɗo.*dartin seeɗa tuma nde ruttindol/, ['majaali', 'waktuji', 'balɗe']],
  [['ks'], /چلان واجنہٕ فایلہِ پؠٹھ چھِ نہٕ زانہہ لِکھنہٕ یِوان/, /نسخن ہُند ژارنہٕ آمُت گروپ ژارنہٕ آمتس وقتس.*واپس اننہٕ وِزِ.*تھوٚڑس وقتس رُکان/, ['سیکنڈ', 'گھنٹہٕ', 'دۄہ']],
  [['vo'], /neai plaseton ragivi, kel pagebon anu/, /konleti kopiedas pevälöl lü tim pevälöl.*paudon dü geükam/, ['sekuns', 'düps', 'dels']],
  [['ve-PP'], /ei nikonz kirjutada sen failan päle, kudamb om kävutuses/, /valitud kopijoiden polv valitud aigale.*seižutadas vähäks aigaks endištamižen aigan/, ['sekundad', 'časud', 'päiväd']],
  [['tlh'], /not ghItlh lulo'taHbogh lIw/, /velqa' ghom wIvlu'pu'bogh.*poH wIvlu'pu'bogh.*ghu' cheghmoHtaHvIS, ru' mev/, ['lupmey', 'rep', 'jajmey']],
  [['rup'], /nu scrii vãrnãoarã pi fishierlu cari s-foloseashti/, /generatsia aleaptã la momentulu aleptu.*s-stã un pic di chiro cãndu s-adarã turnarea/, ['secundi', 'oari', 'dzãli']],
  [['lld'], /mai scrit sura l file che ie tl'adoranza/, /generazion sielta al momënt sielto.*se ferma per n curt tëmp endèna che l ristabilimënt laora/, ['sëcundes', 'ëures', 'dis']],
  [['ti'], /ኣብ ልዕሊ እቲ ኣብ ጥቕሚ ዘሎ ፋይል ፈጺሙ ኣይጽሕፍን/, /ዝተመርጸ ወለዶ ቅዳሕ.*ዝተመርጸ እዋን.*ምምላስ ክካየድ እንከሎ ንግዚኡ ደው ይብል/, ['ሰከንዳት', 'ሰዓታት', 'መዓልታት']],
  [['sah'], /туттулла турар билэ үрдүгэр хаһан да суруйбат/, /Талыллыбыт куоппуйалар көлүөнэлэрин талыллыбыт кэм.*Төннөрүү бара турарыгар.*кылгас кэмҥэ тохтуоҕа/, ['сөкүүндэ', 'чаас', 'күн']],
  [['cv'], /усӑ куракан файл ҫине нихӑҫан та ҫырмасть/, /Суйланӑ копи ӑрӑвне суйланӑ вӑхӑтри.*Каялла тавӑрнӑ чух.*кӑштах чарӑнса тӑрать/, ['ҫеккунт', 'сехет', 'кун']],
  [['bua'], /хэрэглэгдэжэ байһан файл дээрэ хэзээшье бэшэхэгүй/, /Шэлэгдэһэн хуулгын үеые шэлэгдэһэн сагай байдалда.*Һэргээжэ байхада.*саг зуура зогсохо/, ['секунда', 'саг', 'үдэр']],
  [['dz'], /ལག་ལེན་འཐབ་མི་ཡིག་སྣོད་གུ་ནམ་ཡང་ཚབ་འབྲི་མི་འབད/, /སེལ་འཐུ་འབད་མི་གཞི་རྒྱབ་མི་རབས.*སེལ་འཐུ་འབད་མི་དུས་ཚོད.*སོར་ཆུད་འབད་བའི་སྐབས.*གནས་སྐབས་ཅིག་བཀག་བཞག/, ['སྐར་ཆ', 'ཆུ་ཚོད', 'ཉིནམ']],
  [['bo'], /སྤྱོད་བཞིན་པའི་ཡིག་ཆའི་ཐོག་ཏུ་ནམ་ཡང་བསྐྱར་འབྲི་མི་བྱེད/, /བདམས་པའི་གྲབས་ཉར་མི་རབས.*བདམས་པའི་དུས་ཚོད.*སླར་གསོ་བྱེད་རིང.*གནས་སྐབས་མཚམས་འཇོག/, ['སྐར་ཆ', 'ཆུ་ཚོད', 'ཉིན']],
  [['ve'], /a i ṅwali na luthihi nṱha ha faela ine ya khou shumiswa/, /murafho wo nangiwaho kha tshifhinga tsho nangiwaho.*i ḓo ima lwa tshifhinganyana musi u vhuyedza hu tshi khou bvela phanḓa/, ['mithethe', 'awara', 'maḓuvha']],
  [['se'], /ii goassege čále geavahusas leahkki fiilla badjel/, /válljejuvvon buolvva válljejuvvon áigái.*bissehuvvo gaskaboddosaččat máhcaheami áigge/, ['sekundda', 'diimmu', 'beaivvi']],
  [['gn'], /ndojehaíri araka'eve marandurenda ojepuruhína ári/, /jo'aha aty ojeporavóva aravoite ojeporavóvape.*opytáta sapy'a oñemboguevi aja/, ["aravo'ive", 'aravo', 'ára']],
  [['qu'], /mana hayk'aqpas llamkachisqa qillqa-wayaqapa hawanpi qillqanchu/, /Akllasqa copia huñuta akllasqa pachaman.*kutichiy llamkachkaptin pisi pachata sayanqa/, ['segundokuna', 'horakuna', "p'unchawkuna"]],
  [['ay'], /janiw apnaqaskta uka qillqa-wayaqa patxarux kunapachas qillqkiti/, /Ajllita copia tama ajllita pachar.*mä juk'a sayt'aniwa kutt'ayawix lurasiski ukhaxa/, ["art'a", 'urasa', 'uru']],
  [['bm'], /a tɛ sɛbɛn dosiye min bɛ baara la kan abada/, /kulu sugandilen lasegin waati sugandilen.*bɛ jɔ dɔɔnin laseginnali bɛ kɛ tuma min na/, ['segɔni', 'lɛrɛ', 'don']],
  [['ace'], /hana geutuleh ateueh file nyang teungoh geungui meusigoe pih/, /generasi nyang geupileh u waktu nyang geupileh.*jipiyôh siat watee peumulihan teungoh jijak/, ['detik', 'jeuem', 'uroe']],
  [['nap'], /nun scrive maje ncopp'ô file ca se sta ausanno/, /generazione scèveta ô mumento scèveto.*se ferma pe nu poco mentre se torna arreto/, ['sicunne', 'ore', 'juorne']],
  [['ee'], /womagbugbɔ aŋlɔ ɖe agbalẽ si wole zãm la dzi gbeɖe o/, /ƒome si wotia.*ɣeyiɣi si wotia.*atɔ vie esi gbugbɔɖoɖote la le edzi yim/, ['sekend', 'gaƒoƒo', 'ŋkeke']],
  [['kw'], /heb troskrifa an restr usys nevra/, /henedh dewisys dhe'n termyn dewisys.*a bowes pols hag an dasserghi ow mos yn-rag/, ['eylennow', 'ourys', 'dedhyow']],
  [['wa'], /sins måy sipotchî l' fitchî eployî/, /djenêråcion tchoezeye å moumint tchoezi.*s' arestêye on moumint tins kel restauraedje rote/, ['segondes', 'eures', 'djoûs']],
  [['gv'], /gyn scrieu harrish y coadan ta ayns ymmyd dy bragh/, /sheeloghe reih't gys y traa reih't.*stad son tammylt choud as ta'n aavioghey goll er/, ['grigyn', 'ooraghyn', 'laghyn']],
  [['ak'], /wɔntwerɛ ngu fael a wɔde reyɛ adwuma no so da/, /mfonini kuw a wɔapaw no.*bere a wɔapaw no.*begyina kakra bere a wɔresan de aba no/, ['sikɔne', 'nnɔnhwere', 'nna']],
  [['wo'], /du bind mukk ci kaw fiise bi ñuy jëfandikoo/, /maas bi ñu tànn ci waxtu wi ñu tànn.*dina taxaw tuuti bi delloo gi di dox/, ['simili', 'waxtu', 'fan']],
  [['lg'], /tewandiikibwa n'akatono ku fayiro eri mu kukozesebwa/, /omulembe ogulondeddwa ku kiseera ekirondeddwa.*kuyimirira okumala akaseera nga okuzzaawo kugenda mu maaso/, ['sikonda', 'ssaawa', 'ennaku']],
  [['to'], /ʻoku ʻikai ʻaupito tohi ki he funga ʻo e faile ʻoku lolotonga ngāueʻaki/, /toʻutangata kuo fili ki he taimi kuo fili.*ʻE tuʻu fakataimi.*lolotonga ʻa e fakafoki/, ['sekoni', 'houa', 'ʻaho']],
  [['fj'], /e sega sara ni volai ena dela ni faile e vakayagataki tiko/, /itabatamata e digitaki ki na gauna e digitaki.*Ena cegu vakalekaleka.*ena gauna ni vakalesui/, ['sekodi', 'auwa', 'siga']],
  [['csb'], /nigdë nie nadpisëje lopka, chtëren je brëkòwóny/, /wëbróną generacëjã nazôd do wëbrónégò czasu.*na chùlã zatrzimóné na czas doprowôdzaniô nazôd/, ['sekùndë', 'gòdzënë', 'dnie']],
  [['szl'], /nigdy niy nadpisuje pliku, kery je w użyciu/, /ôbranõ gyneracyjõ do ôbranyj chwile.*bydōm zastawiōne na czas prziwrōcaniŏ/, ['sekundy', 'godziny', 'dni']],
  [['wa-RR'], /diri gud ginsusuratan ibabaw han file nga ginagamit/, /pinili nga henerasyon ha pinili nga oras.*Maundang hin madaliay.*samtang ginbubuhat an pagbalik/, ['segundo', 'oras', 'adlaw']],
  [['pap'], /nunka ta skibi riba e archivo ku ta den uso/, /generashon skohe na e momento skohe.*para temporalmente durante e restourashon/, ['sekònde', 'ora', 'dia']],
  [['hsb'], /ženje njepřepisa dataju, kotraž so wužiwa/, /Wubranu generaciju k wubranemu časej.*za čas wobnowjenja nachwilu zastaji/, ['sekundy', 'hodźiny', 'dny']],
  [['nd'], /ayibhalwa phezu kwefayela esetshenziswayo loba sekutheni/, /isizukulwane esikhethiweyo esikhathini esikhethiweyo.*siyama okwesikhatshana ngesikhathi sokubuyisela/, ['imizuzwana', 'amahora', 'izinsuku']],
  [['ss'], /alibhalwa nanini etulu kwelifayela lelisetjentiswako/, /situkulwane lesikhetsiwe esikhatsini lesikhetsiwe.*iyema kwesikhashana ngesikhatsi sekubuyisela/, ['imizuzwana', 'emahora', 'emalanga']],
  [['rn'], /ntiyigera yandikwa hejuru ya dosiye iriko irakoreshwa/, /urukurikirane rwa kopi rwatowe ku gihe catowe.*irahagarara akanya gato mu gihe co kugarura/, ['amasegonda', 'amasaha', 'imisi']],
  [['om'], /gonkumaa faayila hojii irra jiru irratti hin barreeffamu/, /Dhaloota filatame gara yeroo filatameetti.*yeroo deebisuun adeemsifamu yeroo muraasaaf dhaabbata/, ['sekondii', "sa'aatii", 'guyyoota']],
  [['wuu-Hans'], /绝对弗会覆盖正在用个文件/, /选中个备份代次恢复到选中个辰光.*恢复个辰光.*暂时停一歇/, ['秒', '小时', '天']],
  [['ug'], /ئىشلىتىلىۋاتقان ھۆججەتنىڭ ئۈستىگە ھەرگىز يېزىلمايدۇ/, /تاللانغان ئەۋلادنى تاللانغان ۋاقىتتىكى.*ئەسلىگە كەلتۈرۈش جەريانىدا.*ۋاقىتلىق توختىتىلىدۇ/, ['سېكۇنت', 'سائەت', 'كۈن']],
  [['am'], /በጥቅም ላይ ባለው ፋይል ላይ ፈጽሞ አይጻፍም/, /የተመረጠውን ትውልድ ወደ ተመረጠው ጊዜ.*መመለሱ በሚካሄድበት ጊዜ.*ለጊዜው ይቆማል/, ['ሰከንዶች', 'ሰዓታት', 'ቀናት']],
  [['fur'], /mai parsore dal file che al è in ûs/, /gjenerazion sielzude al moment sielzût.*metude in pause dilunc dal ripristinament/, ['seconts', 'oris', 'dîs']],
  [['ve-CC'], /mai sora el file che xe in uso/, /jenerassion sielta al momento sielto.*se ferma par un fià intanto che el ripristino/, ['secondi', 'ore', 'jorni']],
  [['rm'], /mai sur la datoteca ch'è en diever/, /generaziun tschernida al mument tschernì.*interrutta temporarmain durant la restauraziun/, ['secundas', 'uras', 'dis']],
  [['br'], /ne vez ket skrivet morse war ar restr a zo o vezañ implijet/, /remziad diuzet betek ar mare diuzet.*Paouez a ra.*e-pad an adsevel/, ['eilennoù', 'eurvezhioù', 'deizioù']],
  [['gd'], /cha tèid sgrìobhadh thairis air an fhaidhle bheò gu bràth/, /ginealach a thagh thu chun an ama a thagh thu.*a chur na stad rè an aisig/, ['diogan', 'uairean', 'làithean']],
  [['sm'], /e lē tusia lava i luga o le faila o loo faaaogā/, /augatupulaga ua filifilia i le taimi ua filifilia.*E taofi lē tumau.*a o faagasolo le toe faafoi/, ['sekone', 'itūlā', 'aso']],
  [['haw'], /ʻaʻole loa e kākau ma luna o ka waihona e hoʻohana ʻia nei/, /hanauna i koho ʻia i ka manawa i koho ʻia.*Hoʻomaha iki.*i ka wā e hoʻihoʻi ana/, ['kekona', 'hola', 'lā']],
  [['mi'], /kāore rawa e tuhi ki runga i te kōnae e whakamahia ana/, /whakatupuranga kua kōwhiria ki te wā kua kōwhiria.*Ka whakatārewatia.*i te wā o te whakaora/, ['hēkona', 'hāora', 'rā']],
  [['bi'], /i neva raetem antap long fael we i stap wok/, /grup blong bekap we yu jusum.*taem we yu jusum.*i spel smol taem/, ['sekon', 'aoa', 'dei']],
  [['tpi'], /i no save raitim antap long fail i wok nau/, /grup bilong bekap yu makim.*taim yu makim.*bai malolo liklik taim wok bilong kisim bek i ron/, ['sekon', 'aua', 'de']],
  [['kok'], /वापरांत आशिल्ल्या फायलीचेर केन्नाच बरयना/, /निवडिल्ली पिळगी निवडिल्ल्या खिणाच्या.*परत हाडप चालू आसतना.*तात्पुरतो थांबतलो/, ['सेकंद', 'वरां', 'दीस']],
  [['mai'], /उपयोगमे रहल फाइलक ऊपर कहियो नहि लिखल जाइत अछि/, /चुनल पीढ़ीकेँ चुनल क्षणक.*पुनर्स्थापन चलैत समय.*अस्थायी रूपेँ रुकत/, ['सेकंड', 'घंटा', 'दिन']],
  [['bho'], /इस्तेमाल होखत फाइल के ऊपर कबो ना लिखल जाला/, /चुनल पीढ़ी के चुनल पल.*बहाली चलत घरी.*कुछ देर खातिर रुक जाई/, ['सेकंड', 'घंटा', 'दिन']],
  [['ary'], /ما كيكتبش نهائيا فوق الملف اللي خدام/, /الجيل اللي ختاريتي.*اللحظة اللي ختاريتي.*غادي يوقف مؤقتا ملي كيكون الاسترجاع خدام/, ['الثواني', 'الساعات', 'الأيام']],
  [['ba'], /ҡулланылған файл өҫтөнә бер ҡасан да яҙылмай/, /Һайланған быуынды һайланған мәлдәге.*Тергеҙеү ваҡытында.*ваҡытлыса туҡтатыла/, ['секунд', 'сәғәт', 'көн']],
  [['tt'], /кулланыла торган файл өстенә беркайчан да язылмый/, /Сайланган буынны сайланган мизгелдәге.*Торгызу вакытында.*вакытлыча туктатыла/, ['секунд', 'сәгать', 'көн']],
  [['tk_TM'], /ulanylýan faýlyň üstüne hiç wagt ýazylmaýar/, /Saýlanan nesli saýlanan pursatdaky.*Dikeldiş wagtynda.*wagtlaýyn togtadylýar/, ['sekunt', 'sagat', 'gün']],
  [['yi'], /שרײַבט קיינמאָל נישט איבער די טעקע וואָס איז אין באַניץ/, /אויסגעקליבענעם דור.*אויסגעקליבענעם מאָמענט.*צײַטווײַליק אָפּגעשטעלט בשעת דעם צוריקשטעלן/, ['סעקונדעס', 'שעה', 'טעג']],
  [['sc'], /non iscriet mai subra s'archìviu in usu/, /generatzione seberada.*momentu seberadu.*si firmat pro pagu tempus durante su riprìstinu/, ['segundos', 'oras', 'dies']],
  [['scn'], /nun scrivi mai supra la scheda chi si sta usannu/, /ginirazzioni scigghiuta.*mumentu scigghiutu.*si ferma pi picca tempu mentri si fa lu ripristinu/, ['secunni', 'uri', 'jorna']],
  [['co'], /ùn soprascrive mai u schedariu in usu/, /generazione scelta.*mumentu sceltu.*si ferma pruvisoriamente durante u ristabilimentu/, ['sicondi', 'ore', 'ghjorni']],
  [['an'], /nunca no sobrescribe o fichero que s'está usando/, /cheneración trigada.*momento trigau.*s'atura temporalment mientres dura a restauración/, ['segundos', 'horas', 'días']],
  [['ast-ES'], /enxamás sobrescribe'l ficheru que ta n'usu/, /xeneración escoyida.*momentu escoyíu.*páusase durante la restauración/, ['segundos', 'hores', 'díes']],
  [['oc'], /sens jamai espotir lo fichièr en cors d'utilizacion/, /generacion causida.*moment causit.*suspenduda pendent la restauracion/, ['segondas', 'oras', 'jorns']],
  [['fy', 'fy-NL'], /oerskriuwt nea it bestân dat yn gebrûk is/, /keazen generaasje.*keazen momint.*ûnder it weromsetten tydlik ûnderbrutsen/, ['sekonden', 'oeren', 'dagen']],
  [['fo'], /skrivar ongantíð oman á fíluna, sum er í nýtslu/, /valda ættarliðið.*valdu løtuni.*fyribils steðgað, meðan endurstovnað verður/, ['sekund', 'tímar', 'dagar']],
  [['ts'], /a yi tsali ehenhla ka fayili leyi tirhisiwaka nikatsongo/, /xitukulwana lexi hlawuriweke.*nkarhi lowu hlawuriweke.*yi ta yima swa xinkarhana loko ku vuyiseriwa/, ['tisekondi', 'tiawara', 'masiku']],
  [['nso'], /ga e ke e ngwala godimo ga faele ye e dirišwago/, /moloko wo o kgethilwego.*nako ye e kgethilwego.*e tla ema nakwana ge go bušetšwa/, ['metsotswana', 'diiri', 'matšatši']],
  [['tn'], /ga e ke e kwala mo godimo ga faele e e dirisiwang/, /kokomana e e tlhophilweng.*nako e e tlhophilweng.*e tla ema nakwana fa go ntse go busediwa/, ['metsotswana', 'diura', 'malatsi']],
  [['st'], /ha e ngole le ka mohla hodima faele e sebediswang/, /moloko o kgethilweng.*nako e kgethilweng.*e tla ema nakwana ha ho ntse ho kgutlisetswa/, ['metsotswana', 'dihora', 'matsatsi']],
  [['rw'], /ntizigera yandika hejuru ya dosiye iri gukoreshwa/, /igisekuru cyatoranyijwe.*gihe cyatoranyijwe.*izahagarara by'agateganyo mu gihe cyo kugarura/, ['amasegonda', 'amasaha', 'iminsi']],
  [['ny'], /silemba konse pamwamba pa fayilo yomwe ikugwiritsidwa ntchito/, /mbadwo wosankhidwa.*nthawi yosankhidwa.*kudzayima kaye pamene kubwezeretsa kukuchitika/, ['masekondi', 'maola', 'masiku']],
  [['sn'], /harimbonyori pamusoro pefaira riri kushandiswa/, /chizvarwa chakasarudzwa.*nguva yakasarudzwa.*ichambomira panguva yekudzoreredza/, ['masekonzi', 'maawa', 'mazuva']],
  [['xh'], /ayikhe ibhale ngaphezulu kwefayile esetyenziswayo/, /isizukulwana esikhethiweyo.*yexesha elikhethiweyo.*kunqumama okwethutyana ngexesha lokubuyisela/, ['imizuzwana', 'iiyure', 'iintsuku']],
  [['zu', 'zu-ZA'], /alilokothi libhale phezu kwefayela elisetshenziswayo/, /isizukulwane esikhethiwe.*sesikhathi esikhethiwe.*sizoma okwesikhashana ngesikhathi sokubuyisela/, ['imizuzwana', 'amahora', 'izinsuku']],
  [['ig'], /a naghị edegharị faịlụ a na-eji eme ihe ma ọlị/, /ọgbọ ahọpụtara.*oge ahọpụtara.*ga-akwụsị nwa oge mgbe iweghachi na-aga n'ihu/, ['sekọnd', 'awa', 'ụbọchị']],
  [['yo'], /a ko kọ lori faili ti a n lo rara/, /ìran ti a yan.*akoko ti a yan.*da duro fun igba diẹ nigba imupadabọ/, ['iṣẹju-aaya', 'wakati', 'ọjọ']],
  [['ha'], /ba a taɓa rubutawa a kan fayil ɗin da ake amfani da shi ba/, /zamanin da aka zaɓa.*lokacin da aka zaɓa.*tsaya na ɗan lokaci yayin da ake mayarwa/, ['daƙiƙu', "sa'o'i", 'kwanaki']],
  [['mg'], /tsy manoratra mihitsy eo ambonin'ny rakitra ampiasaina/, /fotoana voafidy.*taranaka voafidy.*Miato vetivety.*mandritra ny famerenana/, ['segondra', 'ora', 'andro']],
  [['or_IN'], /ବ୍ୟବହାର ହେଉଥିବା ଫାଇଲ୍ ଉପରେ କେବେବି ଲେଖେ ନାହିଁ/, /ଚୟନିତ ପିଢ଼ିକୁ ଚୟନିତ ମୁହୂର୍ତ୍ତର.*ପୁନରୁଦ୍ଧାର ଚାଲୁଥିବା ସମୟରେ.*ସାମୟିକ ଭାବେ ବିରତ ରହିବ/, ['ସେକେଣ୍ଡ', 'ଘଣ୍ଟା', 'ଦିନ']],
  [['as'], /ব্যৱহাৰত থকা ফাইলৰ ওপৰত কেতিয়াও লিখা নহয়/, /নিৰ্বাচিত প্ৰজন্মক নিৰ্বাচিত মুহূৰ্তৰ.*পুনৰুদ্ধাৰ চলি থকাৰ সময়ত.*সাময়িকভাৱে স্থগিত থাকিব/, ['ছেকেণ্ড', 'ঘণ্টা', 'দিন']],
  [['sd'], /استعمال هيٺ فائيل مٿان ڪڏهن به نه لکي ٿي/, /چونڊيل نسل کي چونڊيل وقت.*بحالي دوران.*عارضي طور روڪيو ويندو/, ['سيڪنڊ', 'ڪلاڪ', 'ڏينهن']],
  [['ps'], /هېڅکله د کارېدونکې دوتنې پر سر نه ليکل کېږي/, /ټاکل شوی نسل د ټاکل شوې شېبې.*د بېرته راګرځولو پر مهال.*په لنډمهاله ډول درول کېږي/, ['ثانيې', 'ساعتونه', 'ورځې']],
  [['ckb'], /هەرگیز بەسەر پەڕگەی بەکارهاتوودا نانووسرێتەوە/, /نەوەی هەڵبژێردراو.*کاتی هەڵبژێردراو.*لە کاتی گەڕاندنەوەدا.*بە کاتی ڕادەگیرێت/, ['چرکە', 'کاتژمێر', 'ڕۆژ']],
  [['ku'], /qet li ser pela ku tê bikaranîn nayê nivîsandin/, /Nifşa hilbijartî.*dema hilbijartî.*Di dema vegerandinê de.*demkî tê rawestandin/, ['çirke', 'saet', 'roj']],
  [['my'], /လက်ရှိအသုံးပြုနေသောဖိုင်ကို လုံးဝ အစားထိုးမရေးပါ/, /ရွေးထားသော မျိုးဆက်ကို ရွေးထားသောအချိန်.*ပြန်လည်ရယူနေစဉ်.*ယာယီရပ်နားထားမည်/, ['စက္ကန့်', 'နာရီ', 'ရက်']],
  [['jv'], /ora tau nimpa berkas sing lagi dienggo/, /generasi sing dipilih.*wektu sing dipilih.*ngaso sauntara nalika pamulihan lumaku/, ['detik', 'jam', 'dina']],
  [['so'], /marnaba laguma dul qoro faylka hadda la isticmaalayo/, /jiilka la doortay.*waqtiga la doortay.*si ku-meelgaar ah.*hakadaa inta dib u soo celintu socoto/, ['ilbiriqsi', 'saacadood', 'maalmood']],
  [['sw'], /haiandiki kamwe juu ya faili inayotumika/, /kizazi kilichochaguliwa.*wakati uliochaguliwa.*utasitishwa kwa muda wakati wa kurejesha/, ['sekunde', 'saa', 'siku']],
  [['ca', 'ca_ES', 'ca@valencia'], /mai no sobreescriu el fitxer en ús/, /generació seleccionada a l’instant seleccionat.*pausa durant la restauració/, ['segons', 'hores', 'dies']],
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
  [['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG'], /绝不会覆盖正在使用的文件/, /所选代次还原到所选时刻.*还原期间会暂停持续备份/, ['秒', '小时', '天']],
  [['yue_CN'], /絕對唔會覆寫使用緊嘅檔案/, /揀咗嘅世代還原返揀咗嗰一刻.*還原期間會暫停持續備份/, ['秒', '小時', '日']],
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
  [['sl', 'sl_SI'], /nikoli ne prepiše datoteke v uporabi/, /izbrano generacijo na izbrani trenutek.*med obnavljanjem začasno ustavljeno/, ['sekunde', 'ur', 'dni']],
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
for (const code of ['sk', 'sl', 'sl_SI', 'hr', 'lv', 'lt', 'et-EE', 'tr', 'id', 'ms', 'ms-MY', 'vi', 'vi-VN', 'ca', 'ca_ES', 'ca@valencia', 'gl', 'gl-ES', 'eu', 'af', 'af_ZA', 'sw']) {
  for (const key of [...keys, 'restore']) assert.doesNotMatch(read(code)[key], /\p{Script=Cyrillic}/u);
}
for (const key of keys) {
  assert.match(read('ja-HI')[key], /\p{Script=Hiragana}/u);
  assert.doesNotMatch(read('ja-HI')[key], /[\p{Script=Han}\p{Script=Katakana}]/u);
  for (const code of ['ko', 'ko-KR']) assert.match(read(code)[key], /\p{Script=Hangul}/u);
  for (const code of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-Hant', 'zh-TW', 'zh-HK', 'yue_CN']) {
    assert.match(read(code)[key], /\p{Script=Han}/u);
  }
}
for (const code of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG']) assert.equal(read(code)['continuous-backup-database'], '数据库');
for (const code of ['yue_CN', 'zh-Hant', 'zh-TW', 'zh-HK']) assert.equal(read(code)['continuous-backup-database'], '資料庫');
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
for (const code of ['az', 'az-AZ', 'az-LA']) {
  assert.equal(read(code)['continuous-backup-database'], 'Verilənlər bazası');
  for (const key of keys) assert.doesNotMatch(read(code)[key], /[\p{Script=Cyrillic}\p{Script=Arabic}]/u);
}
for (const key of keys) assert.match(read('ka')[key], /\p{Script=Georgian}/u);
for (const key of keys) assert.match(read('hy')[key], /\p{Script=Armenian}/u);
for (const code of ['uz', 'uz-UZ', 'uz-LA']) {
  assert.equal(read(code)['continuous-backup-database'], 'Ma’lumotlar bazasi');
  for (const key of keys) assert.doesNotMatch(read(code)[key], /[\p{Script=Cyrillic}\p{Script=Arabic}]/u);
}
for (const key of [...keys, 'restore', 'save']) {
  assert.match(read('uz-AR')[key], /\p{Script=Arabic}/u);
  const prose = read('uz-AR')[key].replace(/AES-256-GCM|SQLite|Litestream|Oplog|rclone|URL/g, '');
  assert.doesNotMatch(prose, /[A-Za-z\p{Script=Cyrillic}]/u);
}
for (const key of keys) assert.match(read('kk')[key], /\p{Script=Cyrillic}/u);
assert.equal(read('kk')['continuous-backup-database'], 'Дерекқор');
assert.equal(read('kk')['continuous-backup-restore-what'], 'Қалпына келтіру');
for (const key of keys) assert.match(read('mn')[key], /\p{Script=Cyrillic}/u);
assert.equal(read('mn')['continuous-backup-database'], 'Өгөгдлийн сан');
assert.equal(read('mn')['continuous-backup-restore-what'], 'Сэргээх');
for (const key of keys) assert.match(read('ne')[key], /\p{Script=Devanagari}/u);
assert.equal(read('ne')['continuous-backup-saved'], 'निरन्तर जगेडाका सेटिङहरू सुरक्षित गरिए');
for (const key of keys) assert.match(read('mr')[key], /\p{Script=Devanagari}/u);
for (const key of keys) assert.match(read('ta')[key], /\p{Script=Tamil}/u);
for (const key of keys) assert.match(read('te-IN')[key], /\p{Script=Telugu}/u);
for (const key of keys) assert.match(read('gu-IN')[key], /\p{Script=Gujarati}/u);
for (const key of keys) assert.match(read('kn')[key], /\p{Script=Kannada}/u);
for (const key of keys) assert.match(read('ml')[key], /\p{Script=Malayalam}/u);
for (const key of keys) assert.match(read('pa')[key], /\p{Script=Gurmukhi}/u);
for (const key of keys) assert.match(read('si')[key], /\p{Script=Sinhala}/u);
for (const key of keys) assert.match(read('ky')[key], /\p{Script=Cyrillic}/u);
assert.equal(read('ky')['continuous-backup-database'], 'Маалыматтар базасы');
assert.equal(read('ky')['continuous-backup-restore-what'], 'Калыбына келтирүү');
for (const key of keys) assert.doesNotMatch(read('de-CH')[key], /ß/);
for (const key of keys) assert.match(read('tg')[key], /\p{Script=Cyrillic}/u);
assert.equal(read('tg')['continuous-backup-database'], 'Пойгоҳи додаҳо');
assert.equal(read('tg')['continuous-backup-restore-what'], 'Барқарор кардан');

for (const key of [...keys, 'backup', 'database-migration', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('la')[key], /Latine:|\b(?:the|containing|according|storage|written)\b/);
  assert.deepEqual(translationTokens(read('la')[key]), translationTokens(en[key]));
}
assert.equal(read('la')['continuous-backup-database'], 'Basis datorum');

for (const key of keys) assert.match(read('my')[key], /\p{Script=Myanmar}/u);

for (const code of ['km', 'km-KH', 'km_KH']) {
  for (const key of keys) assert.match(read(code)[key], /\p{Script=Khmer}/u);
}

for (const key of keys) assert.match(read('ckb')[key], /\p{Script=Arabic}/u);
assert.equal(read('ckb')['continuous-backup-database'], 'بنکەدراوە');

for (const key of keys) assert.match(read('ps')[key], /\p{Script=Arabic}/u);
assert.equal(read('ps')['continuous-backup-restore-what'], 'بېرته راګرځول');

for (const key of keys) assert.match(read('sd')[key], /\p{Script=Arabic}/u);
assert.equal(read('sd')['continuous-backup-restore-what'], 'بحال ڪريو');

for (const key of keys) assert.match(read('as')[key], /\p{Script=Bengali}/u);
assert.equal(read('as')['continuous-backup-restore-what'], 'পুনৰুদ্ধাৰ কৰক');

for (const key of keys) assert.match(read('or_IN')[key], /\p{Script=Oriya}/u);

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('sn')[key], /\b(?:the|according|containing|written|storage)\b/);
  assert.deepEqual(translationTokens(read('sn')[key]), translationTokens(en[key]));
}

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('tn')[key], /\b(?:streamed|directly|temporary|written|according|configured)\b/);
  assert.deepEqual(translationTokens(read('tn')[key]), translationTokens(en[key]));
}
assert.ok(read('tn')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('ts')[key], /Hi Xitsonga:|mhaka mhaka/);
  assert.deepEqual(translationTokens(read('ts')[key]), translationTokens(en[key]));
}
assert.ok(read('ts')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('co')[key], /\b(?:viene|vengono|secondo|contenente|selezionato)\b/);
  assert.deepEqual(translationTokens(read('co')[key]), translationTokens(en[key]));
}
assert.ok(read('co')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('scn')[key], /\b(?:viene|vengono|secondo|contenente|scegghito)\b/);
  assert.deepEqual(translationTokens(read('scn')[key]), translationTokens(en[key]));
}
assert.ok(read('scn')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('sc')[key], /\b(?:viene|vengono|secondo|contenente|seletzionadu)\b/);
  assert.deepEqual(translationTokens(read('sc')[key]), translationTokens(en[key]));
}
assert.ok(read('sc')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));

for (const key of keys) assert.match(read('yi')[key], /\p{Script=Hebrew}/u);
assert.equal(read('yi')['continuous-backup-restore-what'], 'צוריקשטעלן');

for (const key of [...keys, 'backup', 'backup-description', 'backup-restore-confirm']) {
  assert.match(read('tt')[key], /\p{Script=Cyrillic}/u);
  assert.doesNotMatch(read('tt')[key], /йедөст|сечилен|веритабан|ЙЙЙЙ|баҗкуп/i);
  assert.deepEqual(translationTokens(read('tt')[key]), translationTokens(en[key]));
}
assert.ok(read('tt')['backup-description'].includes('backup/YYYY/MM/DD/HH_MM_SS/backup.zip'));
assert.equal(read('tt')['continuous-backup-database'], 'Мәгълүмат базасы');

for (const key of keys) assert.match(read('ba')[key], /\p{Script=Cyrillic}/u);
assert.equal(read('ba')['continuous-backup-database'], 'Мәғлүмәттәр базаһы');
assert.equal(read('ba')['continuous-backup-restore-what'], 'Тергеҙергә');

for (const key of keys) assert.match(read('ary')[key], /\p{Script=Arabic}/u);
assert.equal(read('ary')['continuous-backup-engine-chosen'], 'كيخدم دابا');

for (const key of keys) assert.match(read('bho')[key], /\p{Script=Devanagari}/u);
assert.equal(read('bho')['continuous-backup-running'], 'चलत बा');

for (const key of keys) assert.match(read('mai')[key], /\p{Script=Devanagari}/u);
assert.equal(read('mai')['continuous-backup-running'], 'चलि रहल अछि');

for (const key of keys) assert.match(read('kok')[key], /\p{Script=Devanagari}/u);
assert.equal(read('kok')['continuous-backup-restore-what'], 'परत हाडात');

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('tpi')[key], /Toksave:|\b(?:according|containing|configured|streamed|written)\b/);
  assert.deepEqual(translationTokens(read('tpi')[key]), translationTokens(en[key]));
}
assert.ok(read('tpi')['backup-description'].includes('YYYY_MM_DD-HH_MM_SS/attachments'));

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('bi')[key], /Tok blong sistem:|\b(?:according|containing|configured|streamed|written)\b/);
  assert.deepEqual(translationTokens(read('bi')[key]), translationTokens(en[key]));
}
assert.ok(read('bi')['backup-description'].includes('YYYY_MM_DD-HH_MM_SS/attachments'));

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('haw')[key], /kakaleameka|kilekakalawa|kakapake|walikakena|pilekawakakema|konapikuleka/);
  assert.deepEqual(translationTokens(read('haw')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('haw')['backup-description'].includes(literal), `haw: preserve ${literal}`);
}

assert.equal(read('rm').backup, 'Copia da segirezza');
assert.match(read('rm')['backup-restore-confirm'], /Las agiuntas ed ils avatars vegnan scrits/);
assert.doesNotMatch(read('rm')['backup-restore-confirm'], /Restaurarre|vengono|scritti|modalità/);
assert.deepEqual(translationTokens(read('rm')['backup-restore-confirm']), translationTokens(en['backup-restore-confirm']));

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('fur')[key], /sicurezza|vengono|scritti|modalità|selezioneto|storisge/);
  assert.deepEqual(translationTokens(read('fur')[key]), translationTokens(en[key]));
}
for (const code of ['fur', 've-CC']) {
  for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
    assert.ok(read(code)['backup-description'].includes(literal), `${code}: preserve ${literal}`);
  }
}

for (const key of keys) assert.match(read('am')[key], /\p{Script=Ethiopic}/u);

for (const key of keys) assert.match(read('ug')[key], /\p{Script=Arabic}/u);
assert.equal(read('ug')['continuous-backup-restore-what'], 'ئەسلىگە كەلتۈرۈش');

for (const key of keys) assert.match(read('wuu-Hans')[key], /\p{Script=Han}/u);
assert.equal(read('wuu-Hans')['continuous-backup-running'], '勒运行');
assert.match(read('wuu-Hans')['backup-description'], /弗是.*弗用.*里向/);
assert.match(read('wuu-Hans')['backup-restore-confirm'], /选中个备份伐/);
for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.deepEqual(translationTokens(read('wuu-Hans')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('wuu-Hans')['backup-description'].includes(literal));
}

assert.equal(read('rn')['continuous-backup-running'], 'Iriko irakora');
assert.match(read('rn')['continuous-backup-description'], /ivyariho/);

assert.equal(read('ss')['continuous-backup-last-change'], 'Lushintjo lwekugcina');

assert.equal(read('nd')['continuous-backup-engine-chosen'], 'Isebenza khathesi');
assert.equal(read('nd')['continuous-backup-last-change'], 'Untshintsho lokucina');

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('hsb')[key], /Záloha|Zálohovat|úložiště|používají|přihlašovací|zoubor|zyztém/);
  assert.deepEqual(translationTokens(read('hsb')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('hsb')['backup-description'].includes(literal));
}

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('pap')[key], /se transmite|se escriben|pestañas|elegido|conteniendo/);
  assert.deepEqual(translationTokens(read('pap')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('pap')['backup-description'].includes(literal));
}

assert.equal(read('wa-RR').backup, 'Reserba nga kopya');
assert.doesNotMatch(read('wa-RR').backup, /Copeye|såvrité/);
assert.equal(read('wa-RR')['continuous-backup-engine-chosen'], 'Nagdadagan yana');

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('szl')[key], /Przywrócić|wybraną|bezpośrednio|poświadczeń|skonfigurowanych/);
  assert.deepEqual(translationTokens(read('szl')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('szl')['backup-description'].includes(literal));
}
assert.doesNotMatch(read('szl')['backup-description'], /\/datum/);
assert.equal(read('szl')['continuous-backup-engine-chosen'], 'Dziŏłŏ teroz');

assert.equal(read('csb')['continuous-backup-restore-what'], 'Doprowadzëc nazôd');
assert.equal(read('csb')['continuous-backup-last-change'], 'Slédnô zmiana');

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('to')[key], /Faka-Tonga:|\b(?:containing|configured|according|written|streamed)\b/);
  assert.deepEqual(translationTokens(read('to')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('to')['backup-description'].includes(literal));
}

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.doesNotMatch(read('lg')[key], /\b(?:containing|configured|according|written|streamed|chosen)\b/);
  assert.deepEqual(translationTokens(read('lg')[key]), translationTokens(en[key]));
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) {
  assert.ok(read('lg')['backup-description'].includes(literal));
}

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('ak')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('ak')[key], /stanaaage|accanaading|Nsɛm a ɛfa dwumadi yi ho|Back up Attachments/);
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('ak')['backup-description'].includes(literal));
}

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('nap')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('nap')[key], /Esegui il backup|Ripristinare il backup|Còpia di sicurezza|AAAA|MM_GG/);
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('nap')['backup-description'].includes(literal));
}

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('ay')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('ay')[key], /Aymar aruna: Backup|Back up Attachments|the selected|Cloud storages/);
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('ay')['backup-description'].includes(literal));
}

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('qu')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('qu')[key], /Kay willaymi:|Backupta|Theta|theta|streamedta|Sta3|Azureta|GCSta/);
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('qu')['backup-description'].includes(literal));
}

for (const key of keys) assert.match(read('bo')[key], /\p{Script=Tibetan}/u, `bo:${key}: Tibetan script`);

for (const key of [...keys, 'backup', 'backup-description', 'backup-restore-confirm']) {
  assert.match(read('dz')[key], /\p{Script=Tibetan}/u);
  assert.deepStrictEqual(translationTokens(read('dz')[key]), translationTokens(en[key]));
}
assert.match(read('dz')['backup-description'], /མེན་མི.*གཏངམ་ཨིན/);
assert.match(read('dz')['backup-restore-confirm'], /འབད་ནི་ཨིན་ན/);
assert.doesNotMatch(read('dz')['backup-restore-confirm'], /སླར་གསོ་བྱེད་དམ/);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('dz')['backup-description'].includes(literal));
}

for (const key of keys) assert.match(read('bua')[key], /\p{Script=Cyrillic}/u);
assert.match(read('bua')['continuous-backup-description'], /Тиимэһээ.*хүдэлдэг/);
assert.match(read('bua')['continuous-backup-restore-done'], /Һэргээжэ дүүргэбэ/);

for (const key of keys) assert.match(read('cv')[key], /\p{Script=Cyrillic}/u);
assert.match(read('cv')['continuous-backup-description'], /Ҫавӑнпа.*пулать/);
assert.match(read('cv')['continuous-backup-restore-done'], /тавӑрни вӗҫленчӗ/);

for (const key of [...keys, 'backup', 'backup-description', 'backup-restore-confirm']) {
  assert.match(read('sah')[key], /\p{Script=Cyrillic}/u);
  assert.deepStrictEqual(translationTokens(read('sah')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('sah')[key], /[Хх]аптаһын харай|кэлиҥҥи билэтэ суох/);
}
assert.match(read('sah')['continuous-backup-description'], /төннөрүөххэ сөп/);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('sah')['backup-description'].includes(literal));
}

for (const key of keys) assert.match(read('ti')[key], /\p{Script=Ethiopic}/u);
assert.match(read('ti')['continuous-backup-description'], /ነፍሲ ወከፍ.*ናብ.*ይሰርሕ/);

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('lld')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('lld')[key], /Esegui il backup|Copia di sicurezza|Gli allegati|AAAA|MM_GG/);
}
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('lld')['backup-description'].includes(literal));
}

for (const key of ['backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('rup')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('rup')[key], /este transmis|sunt scrise|Restaurezi|toate colectsiile/);
}
assert.match(read('rup')['continuous-backup-description'], /cafi.*Lucreadzã deadun/);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('rup')['backup-description'].includes(literal));
}

for (const key of ['backup', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('tlh')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('tlh')[key], /De' polHa'|Avatars|Data|collectionmey|credential/);
}
assert.match(read('tlh')['continuous-backup-description'], /qaStaHvIS lup puS.*qawHaq choH/);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('tlh')['backup-description'].includes(literal));
}

const vepsCorrections = ['board-view-timeline-restore', 'board-view-timeline-restore-confirm', 'error-watch-disabled', 'ldap-test-connection-error', 'roles-status', 'roles-status-desc', 'roles-status-role', 'roles-status-invite', 'roles-status-sees', 'roles-status-write', 'roles-status-manage', 'roles-status-sees-all', 'roles-status-sees-assigned', 'roles-status-empty', 'flow-error'];
for (const key of vepsCorrections) {
  assert.deepStrictEqual(translationTokens(read('ve-PP')[key]), translationTokens(en[key]), `ve-PP:${key}: source tokens`);
  assert.doesNotMatch(read('ve-PP')[key], /Vhuyedza|Hezwi|Ukubuka|vhambadzana|Isimo|Okungenziwa|Indima|Mema|Ibona|Dala|Izilungiselelo|Konke|Okwabelwe|Azikho|Dzitshitatisitiki/);
}
assert.match(read('ve-PP')['board-view-timeline-restore-confirm'], /Midägi ei heitäta/);
assert.match(read('ve-PP')['roles-status-desc'], /Vaiše lugendaks.*edel kaitandad/);
assert.match(read('ve-PP')['continuous-backup-description'], /vajehtused.*endištada olo/);

for (const key of ['backup-restore', 'backup-description', 'backup-restore-confirm']) {
  assert.deepStrictEqual(translationTokens(read('vo')[key]), translationTokens(en[key]));
  assert.doesNotMatch(read('vo')[key], /Forigi|pastreamon|Avatarsis|kredentäls|paskribons/);
}
assert.match(read('vo')['continuous-backup-description'], /votükamis valik.*geükön stadi/);
assert.equal(read('vo')['backup-restore'], read('vo')['continuous-backup-restore-what']);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('vo')['backup-description'].includes(literal));
}

for (const key of keys) {
  assert.match(read('ks')[key], /[\u0600-\u06ff]/u, `ks:${key}: Arabic script`);
}
assert.match(read('ks')['continuous-backup-description'], /تہٕ.*چُھ.*سٕتۍ/);
assert.doesNotMatch(read('ks')['continuous-backup-description'], /ہے|ہیں|اور/);

assert.match(read('ff')['continuous-backup-description'], /bayle kala.*keɓe.*ruttinde/);

assert.deepStrictEqual(translationTokens(read('kl')['backup-description']), translationTokens(en['backup-description']));
assert.doesNotMatch(read('kl')['backup-description'], /collections|stream-erneqassaaq|storage tabs|credentials/);
assert.match(read('kl')['continuous-backup-description'], /allannguutit tamaasa.*utertitsisoqarsinnaalluni/);
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) {
  assert.ok(read('kl')['backup-description'].includes(literal));
}

assert.match(read('nah')['continuous-backup-description'], /Quititlani mochi patlaliztli.*hueliz mocuepaz/);

for (const key of keys) assert.match(read('tig')[key], /\p{Script=Ethiopic}/u);
assert.match(read('tig')['continuous-backup-restore-sqlite'], /አቡድ ኢልትከተብ/);
assert.match(read('wal')['continuous-backup-restore-sqlite'], /mulekka xaafettenna/);
assert.match(read('tig')['continuous-backup-restore-confirm'], /ቀሊል ለወቅፍ/);
assert.match(read('wal')['continuous-backup-restore-confirm'], /gam’ees/);
for (const [code, units] of [['tig', ['ሰከንድ', 'ሳዐት', 'መዓል']], ['wal', ['sekondeta', 'saatiyata', 'gallassata']]]) {
  for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
    assert.ok(read(code)[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
  }
}
for (const key of keys) {
  assert.match(read('iu')[key], /\p{Script=Canadian_Aboriginal}/u);
  assert.match(read('zgh')[key], /\p{Script=Tifinagh}/u);
}
assert.match(read('iu')['continuous-backup-restore-sqlite'], /ᑎᑎᕋᖅᑕᐅᙱᓯᐊᕐᓗᓂ/);
assert.match(read('zgh')['continuous-backup-restore-sqlite'], /ⵓⵔ ⵉⵜⵜⵡⴰⵔⴰ ⴰⴽⴽⵯ/);
assert.match(read('iu')['continuous-backup-restore-confirm'], /ᓄᖅᑲᖔᓚᐅᕐᓂᐊᖅᑐᖅ/);
assert.match(read('zgh')['continuous-backup-restore-confirm'], /ⵉⵜⵜⴱⵉⴷⴷ/);
assert.equal(read('zgh')['continuous-backup-running'], 'ⵉⵜⵜⵓⵙⵍⴽⴰⵎ');
assert.doesNotMatch(read('zgh')['continuous-backup-description'], /ⵔⴰⴱⴰⵃ/);
for (const [code, units] of [['iu', ['ᓴᑲᓐᑎᑦ', 'ᐃᑲᕐᕋᑦ', 'ᐅᓪᓗᑦ']], ['zgh', ['ⵜⵉⵙⵉⵏⵉⵏ', 'ⵜⵉⵙⵔⴰⴳⵉⵏ', 'ⵓⵙⵙⴰⵏ']]]) {
  for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
    assert.ok(read(code)[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
  }
}
for (const key of keys) assert.match(read('chr')[key], /\p{Script=Cherokee}/u);
assert.match(read('chr')['continuous-backup-restore-sqlite'], /ᎢᎸᎯᏳᎢ Ꮭ/);
assert.match(read('chr')['continuous-backup-restore-confirm'], /ᏞᎦ ᎦᏙᎯᏍᏗ/);
for (const [suffix, unit] of [['sqlite-interval', 'ᎢᏯᏎᏢ'], ['file-scan', 'ᎢᏯᏎᏢ'], ['base-every', 'ᏑᏟᎶᏛ'], ['keep-days', 'ᏧᏒᎯ']]) {
  assert.ok(read('chr')[`continuous-backup-${suffix}`].includes(unit), `chr:${suffix}: time unit`);
}
console.log(`Continuous backup: ${keys.length} translations in ${codes.length} locale variants passed`);
