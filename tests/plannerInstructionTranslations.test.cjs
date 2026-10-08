'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'import-board-instruction-planner';
const source = read('en')[key];
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const value = read(code)[key];
  assert.notEqual(value, source, code);
  assert.deepEqual(translationTokens(value), translationTokens(source), code);
  for (const literal of ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By']) {
    assert.ok(value.includes(literal), `${code}: ${literal}`);
  }
}
assert.match(read('wuu-Hans')[key], /变成列表.*任务变成卡片.*负责人、日期、标签、清单搭描述/);
assert.match(read('pap')[key], /Gruponan ta bira listanan i tareanan ta bira karchinan/);
assert.match(read('yi')[key], /גרופּעס ווערן רשימות און אויפֿגאַבעס ווערן קאַרטן/);
console.log('Planner instructions: translations, mapping meanings and literals passed');

assert.doesNotMatch(read('wuu-Hans')[key], /存储桶/);

const meisterKey = 'import-board-instruction-meistertask';
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const value = read(code)[meisterKey];
  assert.notEqual(value, read('en')[meisterKey], code);
  assert.deepEqual(translationTokens(value), translationTokens(read('en')[meisterKey]), code);
  for (const literal of ['MeisterTask', 'Export project', 'CSV']) assert.ok(value.includes(literal), code + ': ' + literal);
}
assert.match(read('wuu-Hans')[meisterKey], /分段变成列表，任务变成卡片.*保留完成日期.*自家导入格式/);
assert.match(read('pap')[meisterKey], /tareanan terminá ta warda nan fecha di terminashon/);
assert.match(read('yi')[meisterKey], /פֿאַרענדיקטע אויפֿגאַבעס האַלטן זייער פֿאַרענדיקונג־דאַטע/);

// Source-product commands and file extensions must remain usable when following
// a translated import instruction. These are literals, not placeholder variables.
const importLiterals = {
  superproductivity: ['Super Productivity', 'Settings', 'Sync & Backup', 'Export Data', 'sp-backup', '.json', 'To Do', 'In Progress', 'Backlog', 'Done'],
  taiga: ['Taiga', 'Admin > Project > Export', '.json.gz', 'JSON'],
  vikunja: ['Vikunja', 'Settings', 'Data Export', '.zip', 'data.json'],
  tasksorg: ['Tasks.org', 'Settings', 'Backups', 'Export tasks', '.json'],
  monday: ['monday.com', 'More actions', 'Export board to Excel', '.xlsx', 'Status'],
  pivotal: ['Pivotal Tracker', 'MORE', 'Export CSV', 'Bulk Actions', 'Estimate'],
  obsidian: ['Obsidian', 'Markdown', '.md'],
  linear: ['Linear', 'CSV', 'Settings', 'Import / Export', 'Export data'],
  ticktick: ['TickTick', 'Settings', 'Account', 'Backup & Import', 'CSV'],
  clickup: ['ClickUp', 'CSV', 'Settings', 'Imports / Exports', 'Export Items'],
  nullboard: ['Nullboard', 'Export this board...', '.nbx', 'raw'],
  kanri: ['Kanri', 'Import & Export', 'Export individual board', 'Export all data', '.json'],
};
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const locale = read(code);
  for (const [format, literals] of Object.entries(importLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + format);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + format);
    for (const literal of literals) assert.ok(locale[key].includes(literal), code + ': ' + format + ': ' + literal);
  }
}
// Multi-board exports must not promise that every board is imported.
for (const format of ['nullboard', 'kanri']) {
  const key = 'import-board-instruction-' + format;
  assert.match(read('wuu-Hans')[key], /只导入第一只/);
  assert.match(read('pap')[key], /importá (?:su|e) promé tablero/);
  assert.match(read('yi')[key], /ערשטע ברעט/);
}
assert.match(read('wuu-Hans')['import-board-instruction-obsidian'], /归档区变成归档卡片/);
assert.match(read('pap')['import-board-instruction-obsidian'], /karchinan archivá/);
assert.match(read('yi')['import-board-instruction-obsidian'], /אַרכיווירטע קאַרטן/);
console.log('Additional import formats: literals, tokens, first-board and archive semantics passed');

assert.match(read('wuu-Hans')['import-board-instruction-tasksorg'], /保留完成日期，优先级变成自定义字段/);
assert.match(read('pap')['import-board-instruction-tasksorg'], /fecha di terminashon, i prioridat ta bira un kampo personalisá/);
assert.match(read('yi')['import-board-instruction-tasksorg'], /פֿאַרענדיקונג־דאַטע, און פּריאָריטעט ווערט אַ אייגענער פֿעלד/);
assert.match(read('wuu-Hans')['import-board-instruction-monday'], /更新变成评论/);
assert.match(read('pap')['import-board-instruction-monday'], /aktualisashonnan ta bira komentarionan/);
assert.match(read('yi')['import-board-instruction-monday'], /דערהײַנטיקונגען ווערן באַמערקונגען/);

for (const format of ['taiga', 'vikunja']) {
  const key = 'import-board-instruction-' + format;
  assert.match(read('wuu-Hans')[key], /附件勿导入/);
  assert.match(read('pap')[key], /No ta importá atachimentunan/);
  assert.match(read('yi')[key], /בײַלאַגעס ווערן נישט אימפּאָרטירט/);
}
assert.match(read('wuu-Hans')['import-board-instruction-superproductivity'], /归档任务变成归档卡片/);
assert.match(read('pap')['import-board-instruction-superproductivity'], /tareanan archivá ta bira karchinan archivá/);
assert.match(read('yi')['import-board-instruction-superproductivity'], /אַרכיווירטע אויפֿגאַבעס ווערן אַרכיווירטע קאַרטן/);

// Finnish instructions retain actionable source commands and import mappings.
{
  const locale = read('fi');
  const literalsByFormat = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, literals] of Object.entries(literalsByFormat)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
  for (const format of ['nullboard', 'kanri']) assert.match(locale['import-board-instruction-' + format], /tuodaan ensimmäinen taulu/);
  assert.match(locale['import-board-instruction-obsidian'], /arkiston korteista tulee arkistoituja kortteja/);
  assert.match(locale['import-board-instruction-meistertask'], /Valmiiden tehtävien valmistumispäivä säilyy/);
  assert.match(locale['import-board-instruction-planner'], /Säilöistä tulee listoja ja tehtävistä kortteja/);
  assert.doesNotMatch(locale['import-board-instruction-kanri'], /tuodaan kaikki taulut/);
}

const newerImportLiterals = {
  quire: ['Quire', 'Export CSV', 'CSV'],
  wrike: ['Wrike', 'Excel', '.xlsx', 'Status', 'Key', 'Priority', 'Duration'],
  teamwork: ['Teamwork.com', 'Excel', '.xlsx', 'Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', 'Complete', '--', '##', '>>'],
  businessmap: ['Businessmap', 'Kanbanize', 'Advanced Search', 'Configure results', 'Excel', '.xlsx', 'Title', 'Column', 'Lane', 'Owner', 'Deadline', 'Priority', 'Size', 'Type'],
  redmine: ['Redmine', 'Issues', 'Also available in: CSV', 'All columns', 'Description', 'My account', 'English', '% Done'],
  notion: ['Notion', '•••', 'Export', 'Markdown & CSV', '.zip', 'Status'],
  plane: ['Plane', 'Workspace Settings', 'Exports', 'JSON', 'CSV', 'Excel', '.zip'],
};
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const locale = read(code);
  for (const [format, literals] of Object.entries(newerImportLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
}
assert.match(read('wuu-Hans')['import-board-instruction-quire'], /呒没评论搭附件/);
assert.match(read('wuu-Hans')['import-board-instruction-notion'], /关系、图片搭附件勿导入/);
assert.match(read('wuu-Hans')['import-board-instruction-plane'], /呒没描述搭附件.*勿导入/);
assert.match(read('wuu-Hans')['import-board-instruction-businessmap'], /先把表头行改成英文/);
assert.match(read('wuu-Hans')['import-board-instruction-teamwork'], /子任务.*再深一层/);

assert.match(read('pap')['import-board-instruction-quire'], /Komentarionan i atachimentunan no ta den/);
assert.match(read('pap')['import-board-instruction-notion'], /Relashonnan, imágennan i atachimentunan no ta wordu importá/);
assert.match(read('pap')['import-board-instruction-plane'], /no tin deskripshonnan ni atachimentunan.*no ta wordu importá/);
assert.match(read('pap')['import-board-instruction-businessmap'], /kambia e rèi di enkabesado pa ingles promé/);
assert.match(read('pap')['import-board-instruction-teamwork'], /subtarea.*nivel mas profundo/);

assert.match(read('yi')['import-board-instruction-quire'], /בײַלאַגעס זענען נישט/);
assert.match(read('yi')['import-board-instruction-notion'], /בײַלאַגעס ווערן נישט אימפּאָרטירט/);
assert.match(read('yi')['import-board-instruction-plane'], /האָט נישט קיין באַשרײַבונגען.*ווערן זיי נישט אימפּאָרטירט/);
assert.match(read('yi')['import-board-instruction-businessmap'], /בײַט ערשט די קעפּל־שורה אויף ענגליש/);
assert.match(read('yi')['import-board-instruction-teamwork'], /איין ניוואָ טיפֿער/);

{
  const locale = read('fi');
  for (const [format, literals] of Object.entries({...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))})) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Liitteitä ei tuoda/);
  assert.match(locale['import-board-instruction-notion'], /Relaatioita, kuvia ja liitteitä ei tuoda/);
  assert.match(locale['import-board-instruction-plane'], /ei sisällä kuvauksia eikä liitteitä/);
  assert.match(locale['import-board-instruction-businessmap'], /muuta otsikkorivi ensin englanninkieliseksi/);
  assert.match(locale['import-board-instruction-teamwork'], /yhtä tasoa syvempää/);
  assert.match(locale['import-board-instruction-monday'], /päivityksistä kommentteja/);
  assert.match(locale['import-board-instruction-superproductivity'], /Arkistoiduista tehtävistä tulee arkistoituja kortteja/);
  assert.deepEqual(translationTokens(locale['login-origin-mismatch']), translationTokens(read('en')['login-origin-mismatch']));
  assert.ok(locale['login-origin-mismatch'].includes('ROOT_URL'));
  assert.match(locale['login-origin-mismatch'], /määritetty osoitteelle __expected__.*avattiin osoitteessa __actual__/);
}

// German variants preserve actionable commands and information-loss warnings.
for (const code of ['de', 'de-AT', 'de-CH', 'de_DE']) {
  const locale = read(code);
  const literals = {
    ...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /das erste Board importiert/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle Boards importiert/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Anhänge werden nicht importiert/);
  assert.match(locale['import-board-instruction-notion'], /Beziehungen, Bilder und Anhänge werden nicht importiert/);
  assert.match(locale['import-board-instruction-plane'], /keine Beschreibungen oder Anhänge.*nicht importiert/);
  assert.match(locale['import-board-instruction-businessmap'], /zuerst die Kopfzeile auf Englisch/);
  assert.match(locale['import-board-instruction-teamwork'], /eine Ebene tiefer/);
  assert.match(locale['import-board-instruction-meistertask'], /erledigte Aufgaben behalten ihr Abschlussdatum/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivierte Aufgaben werden zu archivierten Karten/);
}

for (const code of ['fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /seul le premier tableau est importé/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tous les tableaux sont importés/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tâches terminées conservent leur date de fin/);
  assert.match(locale['import-board-instruction-obsidian'], /archives deviennent des cartes archivées/);
  assert.match(locale['import-board-instruction-planner'], /compartiments deviennent des listes et les tâches deviennent des cartes/);
}

for (const code of ['fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /pièces jointes ne sont pas importées/);
  assert.match(locale['import-board-instruction-notion'], /relations, images et pièces jointes ne sont pas importées/);
  assert.match(locale['import-board-instruction-plane'], /ne contient ni descriptions ni pièces jointes.*pas importées/);
  assert.match(locale['import-board-instruction-businessmap'], /renommez d’abord la ligne d’en-tête en anglais/);
  assert.match(locale['import-board-instruction-redmine'], /English dans My account avant l’exportation/);
  assert.match(locale['import-board-instruction-teamwork'], /un niveau supplémentaire/);
  assert.match(locale['import-board-instruction-superproductivity'], /tâches archivées deviennent des cartes archivées/);
}

for (const code of ['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /solo se importa el primer tablero/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /se importan todos los tableros/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tareas completadas conservan su fecha de finalización/);
  assert.match(locale['import-board-instruction-obsidian'], /archivo se convierte en tarjetas archivadas/);
  assert.match(locale['import-board-instruction-planner'], /depósitos se convierten en listas y las tareas en tarjetas/);
}

for (const code of ['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /archivos adjuntos no se importan/);
  assert.match(locale['import-board-instruction-notion'], /relaciones, imágenes y archivos adjuntos no se importan/);
  assert.match(locale['import-board-instruction-plane'], /no contiene descripciones ni archivos adjuntos.*no se importan/);
  assert.match(locale['import-board-instruction-businessmap'], /cambia primero la fila de encabezados al inglés/);
  assert.match(locale['import-board-instruction-redmine'], /English en My account antes de exportar/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivel más profundo/);
  assert.match(locale['import-board-instruction-superproductivity'], /tareas archivadas se convierten en tarjetas archivadas/);
}

for (const code of ['pt', 'pt-BR', 'pt-PT', 'pt_PT']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /apenas o primeiro quadro é importado/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /todos os quadros são importados/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tarefas concluídas mantêm a data de conclusão/);
  assert.match(locale['import-board-instruction-obsidian'], /arquivo torna-se cartões arquivados/);
  assert.match(locale['import-board-instruction-ticktick'], code === 'pt-BR' ? /uma raia/ : /uma pista/);
  assert.match(locale['import-board-instruction-planner'], code === 'pt-BR' ? /arquivo/ : /ficheiro/);
}

for (const code of ['pt', 'pt-BR', 'pt-PT', 'pt_PT']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /anexos não são importados/);
  assert.match(locale['import-board-instruction-notion'], /relações, imagens e anexos não são importados/);
  assert.match(locale['import-board-instruction-plane'], /não contém descrições nem anexos.*não são importados/);
  assert.match(locale['import-board-instruction-businessmap'], /mude primeiro a linha de cabeçalhos para inglês/);
  assert.match(locale['import-board-instruction-redmine'], /English em My account antes de exportar/);
  assert.match(locale['import-board-instruction-teamwork'], /um nível mais profundo/);
  assert.match(locale['import-board-instruction-superproductivity'], /tarefas arquivadas tornam-se cartões arquivados/);
  assert.match(locale['import-board-instruction-plane'], code === 'pt-BR' ? /raias/ : /pistas/);
}

{
  const locale = read('it');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importata solo la prima bacheca/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importate tutte le bacheche/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /allegati non vengono importati/);
  assert.match(locale['import-board-instruction-notion'], /Relazioni, immagini e allegati non vengono importati/);
  assert.match(locale['import-board-instruction-plane'], /non contiene descrizioni né allegati.*non vengono importati/);
  assert.match(locale['import-board-instruction-businessmap'], /rinomina prima la riga delle intestazioni in inglese/);
  assert.match(locale['import-board-instruction-teamwork'], /un livello più profondo/);
  assert.match(locale['import-board-instruction-superproductivity'], /attività archiviate diventano schede archiviate/);
}

for (const code of ['nl', 'nl-NL']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /alleen het eerste bord geïmporteerd/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle borden geïmporteerd/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Bijlagen worden niet geïmporteerd/);
  assert.match(locale['import-board-instruction-notion'], /Relaties, afbeeldingen en bijlagen worden niet geïmporteerd/);
  assert.match(locale['import-board-instruction-plane'], /geen beschrijvingen of bijlagen.*niet geïmporteerd/);
  assert.match(locale['import-board-instruction-businessmap'], /wijzig dan eerst de koprij naar het Engels/);
  assert.match(locale['import-board-instruction-redmine'], /vóór het exporteren.*English in My account/);
  assert.match(locale['import-board-instruction-teamwork'], /één niveau dieper/);
  assert.match(locale['import-board-instruction-superproductivity'], /gearchiveerde taken worden gearchiveerde kaarten/);
  assert.match(locale['import-board-instruction-meistertask'], /voltooide taken behouden hun voltooiingsdatum/);
}

{
  const locale = read('sv');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeras bara den första tavlan/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alla tavlor importeras/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Bilagor importeras inte/);
  assert.match(locale['import-board-instruction-notion'], /Relationer, bilder och bilagor importeras inte/);
  assert.match(locale['import-board-instruction-plane'], /inga beskrivningar eller bilagor.*importeras inte/);
  assert.match(locale['import-board-instruction-businessmap'], /först ändra rubrikraden till engelska/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account före exporten/);
  assert.match(locale['import-board-instruction-teamwork'], /en nivå djupare/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverade uppgifter blir arkiverade kort/);
  assert.match(locale['import-board-instruction-meistertask'], /slutförda uppgifter behåller sitt slutdatum/);
}

{
  const locale = read('da');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeres kun den første tavle/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle tavler importeres/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Vedhæftninger importeres ikke/);
  assert.match(locale['import-board-instruction-notion'], /Relationer, billeder og vedhæftninger importeres ikke/);
  assert.match(locale['import-board-instruction-plane'], /ingen beskrivelser eller vedhæftninger.*importeres ikke/);
  assert.match(locale['import-board-instruction-businessmap'], /først ændre overskriftsrækken til engelsk/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account før eksporten/);
  assert.match(locale['import-board-instruction-teamwork'], /ét niveau dybere/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverede opgaver bliver til arkiverede kort/);
  assert.match(locale['import-board-instruction-meistertask'], /afsluttede opgaver beholder deres afslutningsdato/);
}

{
  const locale = read('nb');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeres bare den første tavlen/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle tavler importeres/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Vedlegg importeres ikke/);
  assert.match(locale['import-board-instruction-notion'], /Relasjoner, bilder og vedlegg importeres ikke/);
  assert.match(locale['import-board-instruction-plane'], /ingen beskrivelser eller vedlegg.*importeres ikke/);
  assert.match(locale['import-board-instruction-businessmap'], /først endre overskriftsraden til engelsk/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account før eksporten/);
  assert.match(locale['import-board-instruction-teamwork'], /ett nivå dypere/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverte oppgaver blir arkiverte kort/);
  assert.match(locale['import-board-instruction-meistertask'], /fullførte oppgaver beholder fullføringsdatoen/);
}

for (const code of ['pl', 'pl-PL']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importowana jest tylko pierwsza tablica/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importowane są wszystkie tablice/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Załączniki nie są importowane/);
  assert.match(locale['import-board-instruction-notion'], /Relacje, obrazy i załączniki nie są importowane/);
  assert.match(locale['import-board-instruction-plane'], /nie zawiera opisów ani załączników.*nie są one importowane/);
  assert.match(locale['import-board-instruction-businessmap'], /najpierw zmień wiersz nagłówków na angielski/);
  assert.match(locale['import-board-instruction-redmine'], /przed eksportem.*English w My account/);
  assert.match(locale['import-board-instruction-teamwork'], /poziom głębiej/);
  assert.match(locale['import-board-instruction-superproductivity'], /zarchiwizowane zadania stają się zarchiwizowanymi kartami/);
  assert.match(locale['import-board-instruction-meistertask'], /ukończone zadania zachowują datę ukończenia/);
}

for (const code of ['cs', 'cs-CZ']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importuje pouze první tablo/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importují všechna tabla/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Přílohy se neimportují/);
  assert.match(locale['import-board-instruction-notion'], /Relace, obrázky a přílohy se neimportují/);
  assert.match(locale['import-board-instruction-plane'], /neobsahuje popisy ani přílohy.*neimportují/);
  assert.match(locale['import-board-instruction-businessmap'], /nejprve přejmenujte záhlaví sloupců na anglické názvy/);
  assert.match(locale['import-board-instruction-redmine'], /před exportem.*English v My account/);
  assert.match(locale['import-board-instruction-teamwork'], /o úroveň hlouběji/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivované úkoly se převedou na archivované karty/);
  assert.match(locale['import-board-instruction-meistertask'], /dokončené úkoly si zachovají datum dokončení/);
}

{
  const locale = read('sk');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importuje iba prvá nástenka/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importujú všetky nástenky/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Prílohy sa neimportujú/);
  assert.match(locale['import-board-instruction-notion'], /Vzťahy, obrázky a prílohy sa neimportujú/);
  assert.match(locale['import-board-instruction-plane'], /neobsahuje popisy ani prílohy.*neimportujú/);
  assert.match(locale['import-board-instruction-businessmap'], /najprv premenujte hlavičky stĺpcov na anglické názvy/);
  assert.match(locale['import-board-instruction-redmine'], /pred exportom.*English v My account/);
  assert.match(locale['import-board-instruction-teamwork'], /o úroveň hlbšie/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivované úlohy sa zmenia na archivované karty/);
  assert.match(locale['import-board-instruction-meistertask'], /dokončené úlohy si zachovajú dátum dokončenia/);
}

for (const code of ['ro', 'ro-RO']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /se importă doar primul panou/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /se importă toate panourile/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Atașamentele nu sunt importate/);
  assert.match(locale['import-board-instruction-notion'], /Relațiile, imaginile și atașamentele nu sunt importate/);
  assert.match(locale['import-board-instruction-plane'], /nu conține descrieri sau atașamente.*nu sunt importate/);
  assert.match(locale['import-board-instruction-businessmap'], /redenumește mai întâi anteturile în engleză/);
  assert.match(locale['import-board-instruction-redmine'], /înainte de export.*English în My account/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivel mai adânc/);
  assert.match(locale['import-board-instruction-superproductivity'], /sarcinile arhivate devin carduri arhivate/);
  assert.match(locale['import-board-instruction-meistertask'], /sarcinile finalizate își păstrează data finalizării/);
}

{
  const locale = read('hu');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /csak az első tábla kerül importálásra/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /minden tábla importálásra kerül/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /mellékletek nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-notion'], /kapcsolatok, képek és mellékletek nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-plane'], /nem tartalmaz leírásokat vagy mellékleteket.*nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-businessmap'], /előbb nevezze át a fejlécsor mezőit angolra/);
  assert.match(locale['import-board-instruction-redmine'], /exportálás előtt.*English.*My account/);
  assert.match(locale['import-board-instruction-teamwork'], /egy szinttel mélyebbet/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivált feladatokból archivált kártyák lesznek/);
  assert.match(locale['import-board-instruction-meistertask'], /befejezett feladatok megőrzik a befejezés dátumát/);
}

{
  const locale = read('tr');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /yalnızca ilk pano içe aktarılır/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tüm panolar içe aktarılır/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Ekler içe aktarılmaz/);
  assert.match(locale['import-board-instruction-notion'], /İlişkiler, resimler ve ekler içe aktarılmaz/);
  assert.match(locale['import-board-instruction-plane'], /açıklama veya ek içermez.*içe aktarılmaz/);
  assert.match(locale['import-board-instruction-businessmap'], /önce başlık satırını İngilizce olarak yeniden adlandırın/);
  assert.match(locale['import-board-instruction-redmine'], /dışa aktarmadan önce My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /bir seviye daha derini/);
  assert.match(locale['import-board-instruction-superproductivity'], /arşivlenmiş görevler arşivlenmiş kartlara dönüşür/);
  assert.match(locale['import-board-instruction-meistertask'], /tamamlanan görevlerin tamamlanma tarihleri korunur/);
}

for (const code of ['el', 'el-GR']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /εισάγεται μόνο ο πρώτος πίνακας/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /εισάγονται όλοι οι πίνακες/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /ολοκληρωμένες εργασίες διατηρούν την ημερομηνία ολοκλήρωσής τους/);
  assert.match(locale['import-board-instruction-obsidian'], /μετατρέπεται σε αρχειοθετημένες κάρτες/);
  assert.match(locale['import-board-instruction-ticktick'], /γίνεται διάδρομος/);
}

for (const code of ['el', 'el-GR']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Τα συνημμένα δεν εισάγονται/);
  assert.match(locale['import-board-instruction-notion'], /Οι σχέσεις, οι εικόνες και τα συνημμένα δεν εισάγονται/);
  assert.match(locale['import-board-instruction-plane'], /δεν περιέχει περιγραφές ή συνημμένα.*δεν εισάγονται/);
  assert.match(locale['import-board-instruction-businessmap'], /μετονομάστε πρώτα τη γραμμή επικεφαλίδων στα αγγλικά/);
  assert.match(locale['import-board-instruction-redmine'], /πριν από την εξαγωγή.*English στο My account/);
  assert.match(locale['import-board-instruction-teamwork'], /ένα επίπεδο βαθύτερα/);
  assert.match(locale['import-board-instruction-superproductivity'], /αρχειοθετημένες εργασίες γίνονται αρχειοθετημένες κάρτες/);
}

for (const code of ['ja', 'ja-JP']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /最初のボードだけがインポートされます/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /すべてのボードがインポートされます/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /完了済みタスクの完了日は保持されます/);
  assert.match(locale['import-board-instruction-obsidian'], /アーカイブはアーカイブ済みカードになります/);
  assert.match(locale['import-board-instruction-ticktick'], /リストはスイムレーンに/);
}

for (const code of ['ja', 'ja-JP']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /添付ファイルはインポートされません/);
  assert.match(locale['import-board-instruction-notion'], /リレーション、画像、添付ファイルはインポートされません/);
  assert.match(locale['import-board-instruction-plane'], /説明と添付ファイルが含まれない.*インポートされません/);
  assert.match(locale['import-board-instruction-businessmap'], /先にヘッダー行を英語名に変更/);
  assert.match(locale['import-board-instruction-redmine'], /エクスポート前に My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /さらに1階層深く/);
  assert.match(locale['import-board-instruction-superproductivity'], /アーカイブ済みタスクはアーカイブ済みカードになります/);
}

{
  const locale = read('ja-HI');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Hiragana}/u, key);
    assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /さいしょの ぼおどだけが いんぽおとされます/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /すべての ぼおどが いんぽおとされます/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /かんりょうした たすくの かんりょうびは のこります/);
  assert.match(locale['import-board-instruction-obsidian'], /ああかいぶは ああかいぶずみの かあどに なります/);
}

{
  const locale = read('ja-HI');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Hiragana}/u, key);
    assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /てんぷふぁいるは いんぽおとされません/);
  assert.match(locale['import-board-instruction-notion'], /りれえしょん、がぞう、てんぷふぁいるは いんぽおとされません/);
  assert.match(locale['import-board-instruction-plane'], /せつめいと てんぷふぁいるが ふくまれない.*いんぽおとされません/);
  assert.match(locale['import-board-instruction-businessmap'], /さきに へっだあぎょうを えいごの なまえに かえて/);
  assert.match(locale['import-board-instruction-redmine'], /えくすぽおとの まえに My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /さらに ひとつ かいそうが ふかく/);
  assert.match(locale['import-board-instruction-superproductivity'], /ああかいぶずみの たすくは ああかいぶずみの かあどに なります/);
}

for (const code of ['ko', 'ko-KR']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /첫 번째 보드만 가져옵니다/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /모든 보드를 가져옵니다/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /완료된 작업의 완료 날짜는 유지됩니다/);
  assert.match(locale['import-board-instruction-obsidian'], /아카이브는 보관된 카드로 변환됩니다/);
  assert.match(locale['import-board-instruction-ticktick'], /목록은 스윔레인으로/);
}

for (const code of ['ko', 'ko-KR']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /첨부 파일은 가져오지 않습니다/);
  assert.match(locale['import-board-instruction-notion'], /관계, 이미지, 첨부 파일은 가져오지 않습니다/);
  assert.match(locale['import-board-instruction-plane'], /설명과 첨부 파일이 없으므로.*가져오지 않습니다/);
  assert.match(locale['import-board-instruction-businessmap'], /먼저 머리글 행을 영어 이름으로 바꾸세요/);
  assert.match(locale['import-board-instruction-redmine'], /내보내기 전에 My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /한 단계 더 깊은 계층/);
  assert.match(locale['import-board-instruction-superproductivity'], /보관된 작업은 보관된 카드로 변환됩니다/);
}

{
  const locale = read('id');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /hanya papan pertama yang diimpor/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /semua papan diimpor/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tugas yang selesai tetap menyimpan tanggal penyelesaiannya/);
  assert.match(locale['import-board-instruction-obsidian'], /arsip menjadi kartu yang diarsipkan/);
  assert.match(locale['import-board-instruction-ticktick'], /daftar TickTick menjadi jalur/);
}

{
  const locale = read('id');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Lampiran tidak diimpor/);
  assert.match(locale['import-board-instruction-notion'], /Relasi, gambar, dan lampiran tidak diimpor/);
  assert.match(locale['import-board-instruction-plane'], /tidak memuat deskripsi atau lampiran.*tidak diimpor/);
  assert.match(locale['import-board-instruction-businessmap'], /ubah dahulu nama pada baris judul kolom ke bahasa Inggris/);
  assert.match(locale['import-board-instruction-redmine'], /sebelum mengekspor.*English di My account/);
  assert.match(locale['import-board-instruction-teamwork'], /satu tingkat lebih dalam/);
  assert.match(locale['import-board-instruction-superproductivity'], /tugas yang diarsipkan menjadi kartu yang diarsipkan/);
}

for (const code of ['ms', 'ms-MY']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /hanya papan pertama diimport/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /semua papan diimport/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tugasan yang selesai mengekalkan tarikh penyelesaiannya/);
  assert.match(locale['import-board-instruction-obsidian'], /arkib menjadi kad yang diarkibkan/);
  assert.match(locale['import-board-instruction-ticktick'], /senarai TickTick menjadi aliran renang/);
}

for (const code of ['ms', 'ms-MY']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Lampiran tidak diimport/);
  assert.match(locale['import-board-instruction-notion'], /Hubungan, imej dan lampiran tidak diimport/);
  assert.match(locale['import-board-instruction-plane'], /tidak mengandungi keterangan atau lampiran.*tidak diimport/);
  assert.match(locale['import-board-instruction-businessmap'], /tukar dahulu nama pada baris pengepala kepada bahasa Inggeris/);
  assert.match(locale['import-board-instruction-redmine'], /sebelum mengeksport.*English dalam My account/);
  assert.match(locale['import-board-instruction-teamwork'], /satu aras lebih dalam/);
  assert.match(locale['import-board-instruction-superproductivity'], /tugasan yang diarkibkan menjadi kad yang diarkibkan/);
}

for (const code of ['vi', 'vi-VN']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /chỉ bảng đầu tiên được nhập/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tất cả các bảng được nhập/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /nhiệm vụ đã hoàn thành giữ nguyên ngày hoàn thành/);
  assert.match(locale['import-board-instruction-obsidian'], /phần lưu trữ trở thành các thẻ đã lưu trữ/);
  assert.match(locale['import-board-instruction-ticktick'], /danh sách TickTick trở thành một làn ngang/);
}

for (const code of ['vi', 'vi-VN']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Tệp đính kèm không được nhập/);
  assert.match(locale['import-board-instruction-notion'], /Quan hệ, hình ảnh và tệp đính kèm không được nhập/);
  assert.match(locale['import-board-instruction-plane'], /không chứa mô tả hoặc tệp đính kèm.*không được nhập/);
  assert.match(locale['import-board-instruction-businessmap'], /trước tiên hãy đổi tên trong hàng tiêu đề sang tiếng Anh/);
  assert.match(locale['import-board-instruction-redmine'], /trước khi xuất.*English trong My account/);
  assert.match(locale['import-board-instruction-teamwork'], /sâu hơn một cấp/);
  assert.match(locale['import-board-instruction-superproductivity'], /nhiệm vụ đã lưu trữ trở thành thẻ đã lưu trữ/);
}

{
  const locale = read('bg');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /импортира само първото табло/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /импортират всички табла/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /завършените задачи запазват датата си на завършване/);
  assert.match(locale['import-board-instruction-obsidian'], /архивът се превръща в архивирани карти/);
  assert.match(locale['import-board-instruction-ticktick'], /списък на TickTick става коридор/);
}

{
  const locale = read('bg');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Прикачените файлове не се импортират/);
  assert.match(locale['import-board-instruction-notion'], /Релациите, изображенията и прикачените файлове не се импортират/);
  assert.match(locale['import-board-instruction-plane'], /не съдържа описания или прикачени файлове.*не се импортират/);
  assert.match(locale['import-board-instruction-businessmap'], /първо преименувайте заглавния ред на английски/);
  assert.match(locale['import-board-instruction-redmine'], /преди експорта.*English в My account/);
  assert.match(locale['import-board-instruction-teamwork'], /едно ниво по-навътре/);
  assert.match(locale['import-board-instruction-superproductivity'], /архивираните задачи стават архивирани карти/);
}

{
  const locale = read('hr');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /uvozi se samo prva ploča/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /uvoze se sve ploče/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /dovršeni zadaci zadržavaju datum dovršetka/);
  assert.match(locale['import-board-instruction-obsidian'], /arhiva postaje arhivirane kartice/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick popis postaje traka/);
}

{
  const locale = read('hr');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Privitci se ne uvoze/);
  assert.match(locale['import-board-instruction-notion'], /Relacije, slike i privitci se ne uvoze/);
  assert.match(locale['import-board-instruction-plane'], /ne sadrži opise ni privitke.*ne uvoze/);
  assert.match(locale['import-board-instruction-businessmap'], /najprije preimenujte zaglavni redak na engleski/);
  assert.match(locale['import-board-instruction-redmine'], /prije izvoza.*English u My account/);
  assert.match(locale['import-board-instruction-teamwork'], /jednu razinu dublje/);
  assert.match(locale['import-board-instruction-superproductivity'], /arhivirani zadaci postaju arhivirane kartice/);
}

for (const code of ['sl', 'sl_SI']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /uvozi samo prva tabla/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /uvozijo vse table/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /dokončane naloge ohranijo datum dokončanja/);
  assert.match(locale['import-board-instruction-obsidian'], /arhiv pa postane arhivirane kartice/);
  assert.match(locale['import-board-instruction-ticktick'], /seznam TickTick postane plavalna steza/);
}

for (const code of ['sl', 'sl_SI']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Priloge se ne uvozijo/);
  assert.match(locale['import-board-instruction-notion'], /Relacije, slike in priloge se ne uvozijo/);
  assert.match(locale['import-board-instruction-plane'], /ne vsebuje opisov ali prilog.*ne uvozijo/);
  assert.match(locale['import-board-instruction-businessmap'], /najprej preimenujte naslovno vrstico v angleščino/);
  assert.match(locale['import-board-instruction-redmine'], /pred izvozom.*English v My account/);
  assert.match(locale['import-board-instruction-teamwork'], /eno raven globlje/);
  assert.match(locale['import-board-instruction-superproductivity'], /arhivirane naloge postanejo arhivirane kartice/);
}

{
  const locale = read('sr');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /увози се само прва табла/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /увозе се све табле/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /завршени задаци задржавају датум завршетка/);
  assert.match(locale['import-board-instruction-obsidian'], /архива се претвара у архивиране картице/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick листа постаје трака/);
}

{
  const locale = read('sr');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Прилози се не увозе/);
  assert.match(locale['import-board-instruction-notion'], /Релације, слике и прилози се не увозе/);
  assert.match(locale['import-board-instruction-plane'], /не садржи описе ни прилоге.*не увозе/);
  assert.match(locale['import-board-instruction-businessmap'], /прво преименујте заглавни ред на енглески/);
  assert.match(locale['import-board-instruction-redmine'], /пре извоза.*English у My account/);
  assert.match(locale['import-board-instruction-teamwork'], /један ниво дубље/);
  assert.match(locale['import-board-instruction-superproductivity'], /архивирани задаци постају архивиране картице/);
}

{
  const locale = read('bs');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /uvozi se samo prva tabla/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /uvoze se sve table/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /završeni zadaci zadržavaju datum završetka/);
  assert.match(locale['import-board-instruction-obsidian'], /arhiva se pretvara u arhivirane kartice/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick lista postaje traka/);
}

{
  const locale = read('bs');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Prilozi se ne uvoze/);
  assert.match(locale['import-board-instruction-notion'], /Relacije, slike i prilozi se ne uvoze/);
  assert.match(locale['import-board-instruction-plane'], /ne sadrži opise ni priloge.*ne uvoze/);
  assert.match(locale['import-board-instruction-businessmap'], /prvo preimenujte zaglavni red na engleski/);
  assert.match(locale['import-board-instruction-redmine'], /prije izvoza.*English u My account/);
  assert.match(locale['import-board-instruction-teamwork'], /jedan nivo dublje/);
  assert.match(locale['import-board-instruction-superproductivity'], /arhivirani zadaci postaju arhivirane kartice/);
}

{
  const locale = read('et-EE');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...importLiterals, ...newerImportLiterals,
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /imporditakse ainult esimene tahvel/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /imporditakse kõik tahvlid/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /lõpetatud ülesannete lõpetamise kuupäev säilib/);
  assert.match(locale['import-board-instruction-obsidian'], /arhiiv muutub arhiveeritud kaartideks/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTicki loetelu muutub ujumisrajaks/);
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Manuseid ei impordita/);
  assert.match(locale['import-board-instruction-notion'], /Seoseid, pilte ega manuseid ei impordita/);
  assert.match(locale['import-board-instruction-plane'], /ei sisalda kirjeldusi ega manuseid.*ei impordita/);
  assert.match(locale['import-board-instruction-businessmap'], /muutke esmalt päiserea nimed ingliskeelseks/);
  assert.match(locale['import-board-instruction-redmine'], /enne eksportimist.*My account keeleks English/);
  assert.match(locale['import-board-instruction-teamwork'], /ühe taseme võrra sügavamale/);
  assert.match(locale['import-board-instruction-superproductivity'], /arhiveeritud ülesanded muutuvad arhiveeritud kaartideks/);
}

{
  const locale = read('lv');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...importLiterals, ...newerImportLiterals,
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /tiek importēts tikai pirmais dēlis/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tiek importēti visi dēļi/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /pabeigtie uzdevumi saglabā pabeigšanas datumu/);
  assert.match(locale['import-board-instruction-obsidian'], /arhīvs kļūst par arhivētām kartiņām/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick saraksts kļūst par joslu/);
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Pielikumi netiek importēti/);
  assert.match(locale['import-board-instruction-notion'], /Relācijas, attēli un pielikumi netiek importēti/);
  assert.match(locale['import-board-instruction-plane'], /nesatur aprakstus un pielikumus.*netiek importēti/);
  assert.match(locale['import-board-instruction-businessmap'], /vispirms pārdēvējiet galvenes rindas nosaukumus angļu valodā/);
  assert.match(locale['import-board-instruction-redmine'], /pirms eksportēšanas.*My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /vienu līmeni dziļāk/);
  assert.match(locale['import-board-instruction-superproductivity'], /arhivētie uzdevumi kļūst par arhivētām kartiņām/);
}

{
  const locale = read('lt');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...importLiterals, ...newerImportLiterals,
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importuojama tik pirmoji lenta/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importuojamos visos lentos/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /užbaigtos užduotys išlaiko užbaigimo datą/);
  assert.match(locale['import-board-instruction-obsidian'], /archyvas tampa archyvuotomis kortelėmis/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick sąrašas tampa plaukimo juosta/);
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Priedai neimportuojami/);
  assert.match(locale['import-board-instruction-notion'], /Ryšiai, paveikslai ir priedai neimportuojami/);
  assert.match(locale['import-board-instruction-plane'], /nėra aprašų ir priedų.*neimportuojami/);
  assert.match(locale['import-board-instruction-businessmap'], /pirmiausia pakeiskite antraštės eilutės pavadinimus į angliškus/);
  assert.match(locale['import-board-instruction-redmine'], /prieš eksportuodami.*My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /vienu lygiu giliau/);
  assert.match(locale['import-board-instruction-superproductivity'], /archyvuotos užduotys tampa archyvuotomis kortelėmis/);
}

for (const code of ['uk', 'uk-UA']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /імпортується лише перша дошка/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /імпортуються всі дошки/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /завершені завдання зберігають дату завершення/);
  assert.match(locale['import-board-instruction-obsidian'], /архів перетворюється на архівовані картки/);
  assert.match(locale['import-board-instruction-ticktick'], /список TickTick стає лінією/);
}

for (const code of ['uk', 'uk-UA']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Вкладення не імпортуються/);
  assert.match(locale['import-board-instruction-notion'], /Зв’язки, зображення та вкладення не імпортуються/);
  assert.match(locale['import-board-instruction-plane'], /не містить описів і вкладень.*не імпортуються/);
  assert.match(locale['import-board-instruction-businessmap'], /спочатку перейменуйте заголовки стовпців англійською/);
  assert.match(locale['import-board-instruction-redmine'], /перед експортом.*My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /на один рівень глибше/);
  assert.match(locale['import-board-instruction-superproductivity'], /архівовані завдання стають архівованими картками/);
}

{
  const locale = read('uk-UA');
  const literals = {
    opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'],
    orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
    todoist: ['Todoist', 'Export as a template', 'CSV', '@labels', 'p1', 'p3'],
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  assert.match(locale['import-board-instruction-opml'], /Завершені елементи імпортуються як виконані/);
  assert.match(locale['import-board-instruction-opml'], /глибші елементи — контрольними списками/);
  assert.match(locale['import-board-instruction-orgmode'], /другого рівня — картками/);
  assert.match(locale['import-board-instruction-todoist'], /підзавдання — контрольним списком/);
  assert.doesNotMatch(locale['import-board-instruction-todoist'], /підзавдання — картками/);
  assert.match(locale['import-board-instruction-todoist'], /примітки — коментарями/);
}

for (const code of ['ru', 'ru-RU', 'ru_RU', 'ru-UA']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /импортируется только первая доска/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /импортируются все доски/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /завершённые задачи сохраняют дату завершения/);
  assert.match(locale['import-board-instruction-obsidian'], /архив превращается в архивированные карточки/);
  assert.match(locale['import-board-instruction-ticktick'], /список TickTick становится дорожкой/);
}

for (const code of ['ru', 'ru-RU', 'ru_RU', 'ru-UA']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    assert.match(locale[key], /\p{Script=Cyrillic}/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Вложения не импортируются/);
  assert.match(locale['import-board-instruction-notion'], /Связи, изображения и вложения не импортируются/);
  assert.match(locale['import-board-instruction-plane'], /не содержит описаний и вложений.*не импортируются/);
  assert.match(locale['import-board-instruction-businessmap'], /сначала переименуйте заголовки столбцов на английский/);
  assert.match(locale['import-board-instruction-redmine'], /перед экспортом.*My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /на один уровень глубже/);
  assert.match(locale['import-board-instruction-superproductivity'], /архивированные задачи становятся архивированными карточками/);
}

for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /només s’importa el primer tauler/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /s’importen tots els taulers/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /les tasques completades conserven la data de finalització/);
  assert.match(locale['import-board-instruction-obsidian'], /l’arxiu es converteix en fitxes arxivades/);
  assert.match(locale['import-board-instruction-ticktick'], /llista de TickTick esdevé un carril/);
}
assert.match(read('ca@valencia')['import-board-instruction-ticktick'], /les seues columnes/);

for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Els fitxers adjunts no s’importen/);
  assert.match(locale['import-board-instruction-notion'], /Les relacions, imatges i fitxers adjunts no s’importen/);
  assert.match(locale['import-board-instruction-plane'], /no conté descripcions ni fitxers adjunts.*no s’importen/);
  assert.match(locale['import-board-instruction-businessmap'], /primer canvieu els noms de la fila de capçalera a l’anglès/);
  assert.match(locale['import-board-instruction-redmine'], /abans d’exportar.*English a My account/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivell més avall/);
  assert.match(locale['import-board-instruction-superproductivity'], /les tasques arxivades esdevenen fitxes arxivades/);
}
assert.match(read('ca@valencia')['import-board-instruction-taiga'], /les seues tasques/);

for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const locale = read(code);
  const literals = {
    opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'],
    orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
    todoist: ['Todoist', 'Export as a template', 'CSV', '@labels', 'p1', 'p3'],
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  assert.match(locale['import-board-instruction-opml'], /Els elements completats s’importen com a fets/);
  assert.match(locale['import-board-instruction-opml'], /nivells inferiors esdevenen llistes de comprovació/);
  assert.match(locale['import-board-instruction-orgmode'], /segon nivell esdevenen fitxes/);
  assert.match(locale['import-board-instruction-todoist'], /les subtasques esdevenen una llista de comprovació/);
  assert.doesNotMatch(locale['import-board-instruction-todoist'], /les subtasques esdevenen fitxes/);
  assert.match(locale['import-board-instruction-todoist'], /les notes esdevenen comentaris/);
}

for (const code of ['gl', 'gl-ES']) {
  const locale = read(code);
  const literals = {
    opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'],
    orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
    todoist: ['Todoist', 'Export as a template', 'CSV', '@labels', 'p1', 'p3'],
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const key of ['board-announcement', 'board-announcement-enabled', 'cards-use-list-color']) {
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /só se importa o primeiro taboleiro/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /impórtanse todos os taboleiros/);
  }
  assert.match(locale['import-board-instruction-opml'], /completados impórtanse como feitos/);
  assert.match(locale['import-board-instruction-orgmode'], /segundo nivel en tarxetas/);
  assert.match(locale['import-board-instruction-todoist'], /subtarefas nunha lista de verificación.*notas en comentarios/);
  assert.match(locale['import-board-instruction-meistertask'], /tarefas completadas conservan a data de finalización/);
  assert.match(locale['import-board-instruction-obsidian'], /arquivo convértese en tarxetas arquivadas/);
  assert.match(locale['import-board-instruction-ticktick'], /lista de TickTick convértese nun carril/);
}

for (const code of ['gl', 'gl-ES']) {
  const locale = read(code);
  for (const format of ['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja']) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of importLiterals[format]) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) {
    assert.match(locale['import-board-instruction-' + format], /Os anexos non se importan/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /Os anexos impórtanse/);
  }
  assert.match(locale['import-board-instruction-tasksorg'], /tarefas completadas conservan a data de finalización/);
  assert.match(locale['import-board-instruction-monday'], /actualizacións en comentarios/);
  assert.match(locale['import-board-instruction-superproductivity'], /tarefas arquivadas convértense en tarxetas arquivadas/);
  assert.match(locale['import-board-instruction-pivotal'], /iteracións en sprints/);
}

for (const code of ['gl', 'gl-ES']) {
  const locale = read(code);
  for (const [format, values] of Object.entries(newerImportLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  assert.match(locale['import-board-instruction-quire'], /non contén comentarios nin anexos/);
  assert.match(locale['import-board-instruction-notion'], /As relacións, imaxes e anexos non se importan/);
  assert.match(locale['import-board-instruction-plane'], /non contén descricións nin anexos.*non se importan/);
  assert.doesNotMatch(locale['import-board-instruction-notion'], /os anexos impórtanse/);
  assert.match(locale['import-board-instruction-businessmap'], /primeiro cambia os nomes da fila de cabeceira ao inglés/);
  assert.match(locale['import-board-instruction-redmine'], /antes de exportar.*English en My account/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivel máis profundo/);
}

{
  const locale = read('af');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /slegs die eerste bord ingevoer/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle borde ingevoer/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /voltooide take behou hul voltooiingsdatum/);
  assert.match(locale['import-board-instruction-obsidian'], /argief word geargiveerde kaarte/);
  assert.match(locale['import-board-instruction-ticktick'], /TickTick-lys word ’n swembaan/);
}

{
  const locale = read('af');
  for (const format of ['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja']) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of importLiterals[format]) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) {
    assert.match(locale['import-board-instruction-' + format], /Aanhegsels word nie ingevoer nie/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /Aanhegsels word ingevoer/);
  }
  assert.match(locale['import-board-instruction-tasksorg'], /voltooide take behou hul voltooiingsdatum/);
  assert.match(locale['import-board-instruction-monday'], /opdaterings word opmerkings/);
  assert.match(locale['import-board-instruction-superproductivity'], /geargiveerde take word geargiveerde kaarte/);
  assert.match(locale['import-board-instruction-pivotal'], /iterasies word naellope/);
}

{
  const locale = read('af');
  for (const [format, values] of Object.entries(newerImportLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  assert.match(locale['import-board-instruction-quire'], /bevat nie opmerkings of aanhegsels nie/);
  assert.match(locale['import-board-instruction-notion'], /Verwantskappe, beelde en aanhegsels word nie ingevoer nie/);
  assert.match(locale['import-board-instruction-plane'], /geen beskrywings of aanhegsels nie.*nie ingevoer nie/);
  assert.doesNotMatch(locale['import-board-instruction-notion'], /aanhegsels word ingevoer/);
  assert.match(locale['import-board-instruction-businessmap'], /verander eers die kopry se name na Engels/);
  assert.match(locale['import-board-instruction-redmine'], /voor uitvoer.*My account na English/);
  assert.match(locale['import-board-instruction-teamwork'], /een vlak dieper/);
}

{
  const locale = read('sq');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importohet vetëm tabela e parë/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importohen të gjitha tabelat/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /detyrat e përfunduara ruajnë datën e përfundimit/);
  assert.match(locale['import-board-instruction-obsidian'], /arkivi shndërrohet në karta të arkivuara/);
  assert.match(locale['import-board-instruction-ticktick'], /listë TickTick bëhet një korsi/);
}

{
  const locale = read('sq');
  const literals = {...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]])), ...newerImportLiterals};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) {
    assert.match(locale['import-board-instruction-' + format], /Bashkëngjitjet nuk importohen/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /Bashkëngjitjet importohen/);
  }
  assert.match(locale['import-board-instruction-quire'], /Komentet dhe bashkëngjitjet nuk përfshihen/);
  assert.match(locale['import-board-instruction-notion'], /Marrëdhëniet, imazhet dhe bashkëngjitjet nuk importohen/);
  assert.match(locale['import-board-instruction-plane'], /nuk përmban përshkrime ose bashkëngjitje.*nuk importohen/);
  assert.match(locale['import-board-instruction-businessmap'], /fillimisht ndryshoni emrat e rreshtit të titujve në anglisht/);
  assert.match(locale['import-board-instruction-redmine'], /English te My account përpara eksportimit/);
  assert.match(locale['import-board-instruction-teamwork'], /një nivel më thellë/);
  assert.match(locale['import-board-instruction-tasksorg'], /detyrat e përfunduara ruajnë datën e përfundimit/);
  assert.match(locale['import-board-instruction-superproductivity'], /detyrat e arkivuara bëhen karta të arkivuara/);
}
