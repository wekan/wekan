const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
test('Veps server error label uses the Veps error noun instead of Finnish prose', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['server-error'], 'Serveran viga');
  assert.doesNotMatch(data['server-error'], /palvelin|virhe/i);
  assert.match(data['server-error-troubleshooting'], /serveran.*viga/);
});

test('Veps complete view and removal labels replace Finnish without changing action scope', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['view-all'], 'Ozuta kaik');
  assert.equal(data['delete-all'], 'Heitä kaik');
  assert.equal(data['remove-btn'], 'Heitä');
  assert.notEqual(data['delete-all'], data['remove-btn']);
  for (const key of ['view-all', 'delete-all', 'remove-btn']) {
    assert.doesNotMatch(data[key], /näytä|poista/i);
    assert.doesNotMatch(data[key], /kel'dä/i, 'removal is not disabling');
  }
});

test('Veps title and page nouns replace Finnish and retain existing native title terminology', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['text-note-title'], data.title);
  assert.equal(data['operator-title'], data.title.toLowerCase());
  assert.equal(data.page, "Lehtpol'");
  for (const key of ['text-note-title', 'operator-title', 'page']) {
    assert.doesNotMatch(data[key], /otsikko|sivu/i);
  }
});

test('Veps card and list More popup titles use the same native wording', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  for (const key of ['cardMorePopup-title', 'listMorePopup-title']) {
    assert.equal(data[key], 'Enamba');
    assert.doesNotMatch(data[key], /lisää|\.\.\./i);
  }
});

test('Veps filter headings distinguish singular advanced filter and plural other filters', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['advanced-filter-label'], `Levenzoittud ${data.filter.toLowerCase()}`);
  assert.equal(data['other-filters-label'], 'Toižed puhtastimed');
  for (const key of ['advanced-filter-label', 'other-filters-label']) {
    assert.doesNotMatch(data[key], /edistynyt|muut|suodatti/i);
  }
  assert.notEqual(data['advanced-filter-label'], data['other-filters-label']);
});

test('Veps hide-empty label preserves the action, emptiness and existing plural list noun', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['filter-hide-empty'], `Peitä tühjad ${data.lists.toLowerCase()}`);
  assert.doesNotMatch(data['filter-hide-empty'], /näytä|ozuta|tyhjät/i);
});

test('Veps subtask inheritance draft preserves the parent-card and labels instead of Venda', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['subtask-inherit-parent-labels'], "Jäl'gesta vanhemban kartan znamad");
  assert.match(data['subtask-inherit-parent-labels'], /vanhemban kartan/);
  assert.match(data['subtask-inherit-parent-labels'], new RegExp(`${data.labels.toLowerCase()}$`));
  assert.doesNotMatch(data['subtask-inherit-parent-labels'], /Ḓadzhela|zwiredzo|mubebi/);
});

test('Veps parent-card label uses the existing card noun and replaces Finnish', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['parent-card'], `Vanhemb ${data.card.toLowerCase()}`);
  assert.doesNotMatch(data['parent-card'], /ylätehtävä|kortti/i);
});

test('Veps parent display draft preserves showing, parent card and minicard location', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['show-parent-in-minicard'], `Ozuta ${data['parent-card'].toLowerCase()} minikartal:`);
  assert.doesNotMatch(data['show-parent-in-minicard'], /näytä|ylätehtävä|minikortilla|peitä/i);
});

test('Veps parent-control drafts distinguish changing the relation from hiding its display', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['change-card-parent'], 'Vajehta kartan vanhemb');
  assert.equal(data['no-parent'], `Peitä ${data['parent-card'].toLowerCase()}`);
  assert.doesNotMatch(data['no-parent'], /heitä|muuta|näytä|ylätehtävä/i);
  assert.doesNotMatch(data['change-card-parent'], /peitä|kortin/i);
});

test('Veps card display drafts keep card and minicard targets distinct', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['show-on-card'], 'Ozuta kartal');
  assert.equal(data['show-on-minicard'], 'Ozuta minikartal');
  assert.notEqual(data['show-on-card'], data['show-on-minicard']);
  for (const key of ['show-on-card', 'show-on-minicard']) {
    assert.doesNotMatch(data[key], /näytä|kortilla|peitä/i);
  }
});


test('Veps link action uses the native relation-linking imperative', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data.link, 'Ühtenzoita');
  assert.doesNotMatch(data.link, /linkitä|poista|heitä|ližada tarkenduz/i);
});

test("Veps URL schemes retain automatic click and one-per-line scope", () => {
 const data = JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json", "utf8"));
 assert.equal(data["automatic-linked-url-schemes"], "Kävutajan märitud URL shemad, miččid voib avtomatižesti paina. Üks' URL shem rives.");
 assert.doesNotMatch(data["automatic-linked-url-schemes"], /Mukautetut|klikattavissa|riviä/i);
 assert.match(data["automatic-linked-url-schemes"], /avtomatižesti paina/);
 assert.match(data["automatic-linked-url-schemes"], /URL shem rives/);
});

test("Veps rules heading replaces Finnish using native rules plural", () => {
 const data = JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json", "utf8"));
 assert.equal(data.rules, "Sändod");
 assert.doesNotMatch(data.rules, /säännöt/i);
 assert.notEqual(data.rules, data["r-rule"]);
});

test("Veps rule toggle replaces Tshivenda and preserves both actions", () => {
 const data = JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json", "utf8"));
 assert.equal(data["r-rule-disabled"], "Kel'düd");
 assert.equal(data["r-toggle-rule-enabled"], "Pane nece sänd päle libo kel'dä sidä");
 assert.equal(data["r-rule-enabled"], "Päl");
 assert.notEqual(data["r-rule-disabled"], data["r-rule-enabled"]);
 for (const key of ["r-rule-disabled", "r-toggle-rule-enabled"]) assert.doesNotMatch(data[key], /shumiswi|Shumisani|mulayo|litshani/i);
});

test("Veps synchronization labels preserve immediate action and literal credentials", () => {
 const data = JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json", "utf8"));
 const expected = {"list-sync-menu": "Sinhronirui", "list-sync-now": "Sinhronirui nügüd'", "list-sync-last-error": "Jäl'gmäine viga", "list-sync-project-key-placeholder": "PROJECT libo owner/repo", "list-sync-credential-placeholder": "API token / peitsana"};
 for (const [key,value] of Object.entries(expected)) { assert.equal(data[key],value); assert.doesNotMatch(data[key], /vhambadzanya|Vhambadzanyani|phasiwede|Phoxo|kana/i); }
 assert.notEqual(data["list-sync-menu"],data["list-sync-now"]);
});

test("Veps synchronization results retain distinct states and error token", () => {
 const data = JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json", "utf8"));
 const expected = {"list-sync-enabled": "Sinhronirund om päl", "list-sync-last-synced": "Jäl'gmäine sinhronirund", "list-sync-now-pending": "Sinhronirund…", "list-sync-now-success": "Sinhronirund om hüvin loptud.", "list-sync-now-error": "Sinhronirundan viga: %s", "list-sync-clear": "Seižuta sinhronirund"};
 for (const [key,value] of Object.entries(expected)) { assert.equal(data[key],value); assert.doesNotMatch(data[key], /vhambadzanya|vulwa|zwavhu|ngo bvelela|Litshani/i); }
 assert.equal((data["list-sync-now-error"].match(/%s/g)||[]).length,1);
 assert.notEqual(data["list-sync-now-pending"],data["list-sync-now-success"]);
 assert.notEqual(data["list-sync-now-error"],data["list-sync-now-success"]);
});

test("Veps sync source label uses native source noun", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["list-sync-source-type"],"Lähte");
 assert.notEqual(data["list-sync-source-type"],"Tsimo");
 assert.notEqual(data["list-sync-source-type"],data["list-sync-source-none"]);
});

test("Veps optional username keeps its not-required qualification", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data.optional,"Ei ole tarbhaine");
 assert.equal(data["list-sync-username-placeholder"],"Kävutajan nimi (ei ole tarbhaine)");
 for(const key of ["optional","list-sync-username-placeholder"]) assert.doesNotMatch(data[key],/valinnainen|mushumisi|vhukuma/i);
 assert.notEqual(data["list-sync-username-placeholder"],data.username);
});

test("Veps credential states preserve set versus not-yet-set", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 const expected={"list-sync-credential": "API token / peitsana", "list-sync-credential-status-set": "API token / peitsana om märitud.", "list-sync-credential-status-unset": "API token / peitsana völ ei ole märitud."};
 for(const [key,value] of Object.entries(expected)){assert.equal(data[key],value);assert.doesNotMatch(data[key],/Vhupodi|vhewa|zwino/i);}
 assert.notEqual(data["list-sync-credential-status-set"],data["list-sync-credential-status-unset"]);
 assert.match(data["list-sync-credential-status-unset"],/völ ei ole/);
});
