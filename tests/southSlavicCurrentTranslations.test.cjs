'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const meanings = {
  bs: {
    matching: /istim nazivom i tipom na obje kartice/,
    unchanged: /samo na jednoj kartici ostaju nepromijenjena/,
    inactive: /više ne može uređivati obje kartice.*arhivirana/,
    both: /Dvosmjerno.*bilo kojoj kartici/,
    send: /Jednosmjerno.*glavnu karticu/,
    permission: /uređivati obje kartice/,
    me: 'Zamijeni sve mojim korisničkim računom',
    unmapped: /bez mapiranja članova/,
    archive: /sama po sebi jedan izvoz.*jedna je tabla/,
    export: /možete izvesti.*radna knjiga.*\.zip/,
    inherited: /zadržava naslijeđenu postavku/,
    quiet: /sačekaj da završi/,
    workflow: /kao završenu.*Completed.*Cancelled.*kao nezavršenu.*Active.*Deferred/,
    done: /kao završen$/, undone: /kao nezavršen$/,
    list: 'Lista', lane: 'Traka',
  },
  bg: {
    matching: /едно и също име и тип в двете карти/,
    unchanged: /само в едната карта, остават непроменени/,
    inactive: /вече не може да редактира двете карти.*архивирана/,
    both: /Двупосочно.*която и да е карта/,
    send: /Еднопосочно.*основната карта/,
    permission: /редактирате и двете карти/,
    me: 'Замени всички с моя потребителски профил',
    unmapped: /без съпоставяне на членове/,
    archive: /сам по себе си е един износ.*е едно табло/,
    export: /можете да изнесете.*работна книга.*\.zip/,
    inherited: /запазва наследената настройка/,
    quiet: /изчакай да приключат/,
    workflow: /като завършена.*Completed.*Cancelled.*като незавършена.*Active.*Deferred/,
    done: /като завършена$/, undone: /като незавършена$/,
    list: 'Списък', lane: 'Коридор',
  },
  hr: {
    matching: /istim nazivom i vrstom na obje kartice/,
    unchanged: /samo na jednoj kartici ostaju nepromijenjena/,
    inactive: /više ne može uređivati obje kartice.*arhivirana/,
    both: /Dvosmjerno.*bilo kojoj kartici/,
    send: /Jednosmjerno.*glavnu karticu/,
    permission: /uređivati obje kartice/,
    me: 'Zamijeni sve mojim korisničkim računom',
    unmapped: /bez mapiranja članova/,
    archive: /sama po sebi jedan izvoz.*jedna je ploča/,
    export: /možete izvesti.*radna knjiga.*\.zip/,
    inherited: /zadržava naslijeđenu postavku/,
    quiet: /pričekaj da završi/,
    workflow: /kao dovršenu.*Completed.*Cancelled.*kao nedovršenu.*Active.*Deferred/,
    done: /kao dovršen$/, undone: /kao nedovršen$/,
    list: 'Popis', lane: 'Traka',
  },
  sl: {
    matching: /enakim imenom in vrsto na obeh karticah/,
    unchanged: /samo na eni kartici, ostanejo nespremenjena/,
    inactive: /ne more več urejati obeh kartic.*arhivirana/,
    both: /Obojestransko.*kateri koli kartici/,
    send: /Enosmerno.*glavno kartico/,
    permission: /urejanja obeh kartic/,
    me: 'Vse zamenjaj z mojim uporabniškim računom',
    unmapped: /brez preslikave članov/,
    archive: /sama en izvoz.*je ena tabla/,
    export: /lahko izvozite.*delovni zvezek.*\.zip/,
    inherited: /ohrani podedovano nastavitev/,
    quiet: /počakaj do konca/,
    workflow: /kot dokončano.*Completed.*Cancelled.*kot nedokončano.*Active.*Deferred/,
    done: /kot dokončano$/, undone: /kot nedokončano$/,
    list: 'Seznam', lane: 'Plavalna steza',
  },
  sr: {
    matching: /истим називом и типом на оба предмета/,
    unchanged: /само на једном предмету остају непромењене/,
    inactive: /више не може да уређује оба предмета.*архивиран/,
    both: /Двосмерно.*било ком предмету/,
    send: /Једносмерно.*главни предмет/,
    permission: /уређујете оба предмета/,
    me: 'Замени све мојим корисничким налогом',
    unmapped: /без мапирања чланова/,
    archive: /сама по себи један извоз.*један је скуп списа/,
    export: /можете да извезете.*радна свеска.*\.zip/,
    inherited: /задржава наслеђену поставку/,
    quiet: /сачекај да се заврши/,
    workflow: /као завршен.*Completed.*Cancelled.*као незавршен.*Active.*Deferred/,
    done: /као завршен$/, undone: /као незавршен$/,
    list: 'Део поступка', lane: 'Поступак',
  },
};
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = read('en');
  for (const code of ['bs', 'bg', 'hr', 'sr', 'sl', 'sl_SI']) {
    const d = read(code), m = meanings[code === 'sl_SI' ? 'sl' : code];
    assert.deepEqual(Object.keys(d), Object.keys(english), code);
    for (const key of Object.keys(english)) assert.deepEqual(translationTokens(d[key]), translationTokens(english[key]), `${code}:${key}`);
    assert.deepEqual(JSON.parse(execFileSync(process.execPath, ['releases/translations/fill-translations.mjs', '--list', code], { cwd: root, encoding: 'utf8' })), {});
    for (const [key, expected] of [
      ['custom-field-links-hint', m.matching], ['custom-field-links-hint', m.unchanged],
      ['custom-field-link-inactive', m.inactive], ['custom-field-link-both', m.both],
      ['custom-field-link-send', m.send], ['field-link-not-allowed', m.permission],
      ['import-many-boards-hint', m.unmapped], ['import-many-boards-hint', m.archive],
      ['export-all-boards-hint', m.export], ['webhook-payload-description', m.inherited],
      ['notification-delivery-quiet', m.quiet], ['r-wrike-workflow-note', m.workflow],
      ['subtask-mark-done', m.done], ['subtask-mark-not-done', m.undone],
    ]) assert.match(d[key], expected, `${code}:${key}`);
    assert.equal(d['import-members-mode-me'], m.me);
    assert.equal(d['notification-delivery-part-list'], m.list);
    assert.equal(d['notification-delivery-part-swimlane'], m.lane);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(d['r-wrike-workflow-note'].includes(literal));
    assert.ok(d['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    for (const key of ['custom-field-links-hint', 'import-many-boards-hint', 'notification-delivery-quiet']) {
      if (code === 'sr' || code === 'bg') assert.match(d[key], /\p{Script=Cyrillic}/u);
      else assert.doesNotMatch(d[key], /\p{Script=Cyrillic}/u);
    }
  }
  console.log('Bosnian, Bulgarian, Croatian, Serbian and both Slovenian current catalogs: tokens, native terminology and behavior meanings pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
