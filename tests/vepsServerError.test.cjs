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

test("Veps never-synced state uses native never adverb", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["list-sync-last-synced-never"],"Nikonz");
 assert.doesNotMatch(data["list-sync-last-synced-never"],/tshifhinga/i);
 assert.notEqual(data["list-sync-last-synced-never"],data["list-sync-now-error"]);
});

test("Veps empty sync source preserves the inactive state", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["list-sync-source-none"],"Sinhronirund ei ole päl");
 assert.doesNotMatch(data["list-sync-source-none"],/vhambadzanywa/i);
 assert.notEqual(data["list-sync-source-none"],data["list-sync-enabled"]);
 assert.notEqual(data["list-sync-source-none"],data["list-sync-now-error"]);
 assert.notEqual(data["list-sync-source-none"],data["list-sync-last-synced-never"]);
 const template=fs.readFileSync("client/components/lists/listHeader.jade","utf8");
 assert.match(template,/option\(value=""\) \{\{_ 'list-sync-source-none'\}\}/);
});

test("Veps sync instructions retain periodic and immediate checks", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 const value=data["list-sync-description"];
 assert.match(value,/Udišta nece lugetiž ulkopoližespäi trekeraspäi/);
 assert.match(value,/Fonan rad tarkištab sidä kaiku 15 minutan taga/);
 assert.match(value,/aigad varastamata/);
 assert.match(data["list-sync-now"], /'$/);
 assert.ok(value.includes(`${data["list-sync-now"].slice(0, -1)}’`));
 assert.doesNotMatch(value,/Vhambadzanani|Mushumo|sedzulusa/i);
 assert.match(fs.readFileSync("server/listSync.js","utf8"),/every 15 minutes/);
});

test("Veps project label covers code, ID and repository path", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["list-sync-project-key"],"Projektan avadim / ID / owner/repo");
 assert.doesNotMatch(data["list-sync-project-key"],/Khonwe|phurodzheke/i);
 assert.notEqual(data["list-sync-project-key"],data["gcs-project-id"]);
 assert.match(data["list-sync-project-key-placeholder"],/PROJECT.*owner\/repo/);
 const code=fs.readFileSync("server/lib/listSyncFetch.js","utf8");
 assert.ok(code.includes("project=${syncSource.projectKey}"));
 assert.ok(code.includes("/repos/${syncSource.projectKey}/issues"));
 assert.ok(code.includes("encodeURIComponent(syncSource.projectKey)"));
});

test("Veps two-factor controls distinguish actions and account status", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["twoFactorAuthPopup-title","twoFactorAuth-enabled","twoFactorAuth-disable","twoFactorAuth-enable"]){
  assert.match(data[key],/kahen faktoran autentifikacii/i);
  assert.doesNotMatch(data[key],/zwibveledzwa|ṱhogomela|Vulani|Valani/i);
 }
 assert.match(data["twoFactorAuth-enable"],/^Pane .* päle$/);
 assert.match(data["twoFactorAuth-disable"],/^Kel'dä /);
 assert.match(data["twoFactorAuth-enabled"],/om päl sinun akkauntal/);
 assert.notEqual(data["twoFactorAuth-enable"],data["twoFactorAuth-enabled"]);
 assert.notEqual(data["twoFactorAuth-enable"],data["twoFactorAuth-disable"]);
 const template=fs.readFileSync("client/components/users/userHeader.jade","utf8");
 assert.match(template,/js-two-factor-start-enable.*twoFactorAuth-enable/);
 assert.match(template,/js-two-factor-disable.*twoFactorAuth-disable/);
});

test("Veps two-factor instructions preserve setup and login requirements", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["twoFactorAuth-explanation","twoFactorAuth-scan-instructions","twoFactorAuth-manual-entry","twoFactorAuth-confirm","twoFactorCode-prompt","twoFactorCode-submit","twoFactorCode-invalid"]) assert.doesNotMatch(data[key],/Engedzani|Skenani|Khwaṱhisedzani|Ḓivhadzani|Sedzululani|khodo|ṱoḓea/);
 assert.match(data["twoFactorAuth-explanation"],/kaikuččen kerdan.*tuled sistemaha/);
 assert.match(data["twoFactorAuth-scan-instructions"],/QR-kod.*Google Authenticator, Authy.*6-cifraine kod/);
 assert.match(data["twoFactorCode-prompt"],/6-cifraine/);
 assert.match(data["twoFactorAuth-manual-entry"],/^Libo .* käzil: $/);
 assert.equal(data["twoFactorAuth-confirm"],"Vahvištoita da pane päle");
 assert.match(data["twoFactorCode-invalid"],/kod om vär.*völ kerdan/);
 assert.notEqual(data["twoFactorCode-invalid"],data["twoFactorAuth-enabled"]);
});

test("Veps list synchronization popup has a localized list title", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["listSyncPopup-title"],"Lugetižen sinhronirund");
 assert.doesNotMatch(data["listSyncPopup-title"],/Vhambadzanya|Bammbi/i);
 assert.notEqual(data["listSyncPopup-title"],data["list-sync-menu"]);
});

test("Veps vote sorting and event details replace wrong-language labels", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["sort-by-votes"],"Sortirui äniden mödhe");
 assert.equal(data.voting,"Änestamine");
 assert.equal(data["event-detail"],"Ližatedod");
 assert.doesNotMatch(data["sort-by-votes"],/hangisa|vhukhetho/i);
 assert.doesNotMatch(data.voting,/äänestys/i);
 assert.doesNotMatch(data["event-detail"],/Zwidodombedzwa/i);
 assert.notEqual(data["sort-by-votes"],data.sort);
 assert.notEqual(data["event-detail"],data["event-severity"]);
});

test("Veps repair results preserve counters and unresolved failures", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["repair-broken-cards","repairing","repair-broken-cards-done","repair-broken-cards-done-unfixable","restore-list-swimlanes-done"]) assert.doesNotMatch(data[key],/lugis|Dzikhadi|vhuyedzwa|Mirole/i);
 assert.match(data["repairing"],/…$/);
 assert.match(data["repair-broken-cards-done-unfixable"],/__fixed__.*__unfixable__.*ei ole laudad.*ei sa kohendada avtomatižesti/);
 assert.match(data["restore-list-swimlanes-done"],/__restored__.*__remaining__ ei sa endištada/);
 assert.notEqual(data["repair-broken-cards-done"],data["repair-broken-cards-done-unfixable"]);
 const code=fs.readFileSync("client/components/settings/problemsSummary.js","utf8");
 assert.match(code,/fixed, unfixable/);
 assert.match(code,/restored, remaining/);
});

test("Veps forecasts preserve completion, velocity and date distinctions", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["chart-forecast-none-remaining","chart-forecast-no-velocity","chart-forecast-projected"]) assert.doesNotMatch(data[key],/makhadi|fhedza|lavhelesa|luvhilo/i);
 assert.match(data["chart-forecast-none-remaining"],/kaik kartad oma loptud/);
 assert.match(data["chart-forecast-no-velocity"],/__remaining__.*ei ole jäl'gmäižes aigas loptud/);
 assert.match(data["chart-forecast-projected"],/__average__ kartad\/nedal.*__remaining__.*pidaižiba.*__date__/);
 assert.notEqual(data["chart-forecast-none-remaining"],data["chart-forecast-no-velocity"]);
 const code=fs.readFileSync("client/components/boards/charts/boardCharts.js","utf8");
 assert.match(code,/forecast.remaining === 0/);
 assert.match(code,/!forecast.projectedDate/);
 assert.match(code,/average: forecast.averagePerBucket/);
});

test("Veps migration status retains temporary login and CPU warning", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["loading","problems-in-progress-help","problems-none-in-progress"]) assert.doesNotMatch(data[key],/Ladataan|odota|pfulutshedzo|lugisa|khou|swikela/);
 assert.match(data.loading,/ole hüvä, varasta/);
 assert.match(data["problems-in-progress-help"],/radaba nügüd'.*Sistemaha tulend voib olda hidas/);
 assert.match(data["problems-in-progress-help"],/Pidab tulda sistemaha.*Ladind, ole hüvä, varasta.*kuni.*CPU-nagruz vähendub/);
 assert.match(data["problems-none-in-progress"],/ei rada/);
 assert.notEqual(data["problems-in-progress-help"],data["problems-none-in-progress"]);
});

test("Veps CPU labels preserve current usage versus average load", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["cpu-usage-current"],"CPU-n kävutand nügüd'");
 assert.equal(data["cpu-usage"],"CPU-n kävutand");
 assert.equal(data["cpu-load-average"],"Keskmäine radmär");
 for(const key of ["cpu-usage-current","cpu-usage","cpu-load-average"]) assert.doesNotMatch(data[key],/shumiswa|muelo|mushumo|Suorittimen|käyttö/i);
 assert.notEqual(data["cpu-usage-current"],data["cpu-usage"]);
 assert.notEqual(data["cpu-load-average"],data["cpu-usage"]);
 assert.match(fs.readFileSync("client/components/settings/adminProblems.jade","utf8"),/cpu-load-average.*loadAverage/);
});

test("Veps problem acknowledgment preserves checked areas and count reset", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["problems","new-problems","no-new-problems","acknowledge","problems-summary-help"]) assert.doesNotMatch(data[key],/vhuleme|vhuswa|Ṱanganedza|Swaya/i);
 assert.equal(data.acknowledge,"Vahvištoita");
 assert.match(data["problems-summary-help"],/Znamoiče.*tarkištadud.*paina "Vahvištoita".*udiden problemiden lugumär nollaks/);
 assert.match(data["no-new-problems"],/^Ei ole/);
 const code=fs.readFileSync("client/components/settings/problemsSummary.js","utf8");
 assert.match(code,/js-problem-check:checked/);
 assert.match(code,/acknowledgeEventLog/);
});

test("Veps backup scope retains shared-data exclusions and restore boundary", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 for(const key of ["backup-scope","backup-scope-instance","backup-scope-description"]) assert.doesNotMatch(data[key],/Vhuhulwane|yoṱhe|tshiimiswa|dzibodo|vhashumisi/i);
 assert.equal(data["backup-scope-instance"],"Kaik WeKan-sistem");
 assert.match(data["backup-scope-description"],/tartutadud failad.*ei ole kävutajiden akkauntoid libo sisteman valičusid/);
 assert.match(data["backup-scope-description"],/kirjutab vaiše laudoile.*necen organizacijan/);
 assert.notEqual(data["backup-scope"],data["backup-scope-instance"]);
});

test("Veps event severity replaces foreign text with a distinct level draft", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.equal(data["event-severity"],"Kovuden korktuz’");
 assert.doesNotMatch(data["event-severity"],/Vhukuma|vakavuus|tärged|selʹged/i);
 assert.notEqual(data["event-severity"],data["event-detail"]);
 assert.notEqual(data["event-severity"],data["event-category"]);
 const code=fs.readFileSync("client/components/settings/adminProblems.js","utf8");
 assert.match(code,/labelKey: 'event-severity', value: r => r.severity/);
});

test("Veps list date range retains date fields and list-top selection", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.match(data["date-range-of-fields"],/^Päivmäriden keskust.*kävutajan märitud päivmär-pöudoiš.*märitud ozutada lugetižen/);
 assert.doesNotMatch(data["date-range-of-fields"],/Tshifhinga|maḓuvha|bammbi/);
 assert.notEqual(data["date-range-of-fields"],data["sum-of-number-fields"]);
 const code=fs.readFileSync("client/components/lists/listHeader.js","utf8");
 assert.match(code,/stats.earliest === stats.latest/);
});

test("Veps numeric-field total uses attested number-addition wording", () => {
 const data=JSON.parse(fs.readFileSync("imports/i18n/data/ve-PP.i18n.json","utf8"));
 assert.match(data["sum-of-number-fields"],/lugu-pöudoiden luguiden ližaduz/);
 assert.match(data["sum-of-number-fields"],/märitud ozutada lugetižen ülähäl$/);
 assert.doesNotMatch(data["sum-of-number-fields"],/Nzhengeledzo|khontḓo|dziṅwalo|lushaka/i);
 assert.notEqual(data["sum-of-number-fields"],data["date-range-of-fields"]);
 const code=fs.readFileSync("client/components/lists/listHeader.js","utf8");
 assert.match(code,/numberFieldsSumTooltip/);
 assert.match(code,/numberFieldStats/);
});
