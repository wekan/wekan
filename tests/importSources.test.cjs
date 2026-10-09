'use strict';

// The one description of every import source (models/lib/importSources.js),
// which the import page, "Import many boards" and api.py's lists follow, and
// the one path the page reads every source through.
// Run: node tests/importSources.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const reg = await import('../models/lib/importSources.js');
  const many = await import('../models/lib/importManyFiles.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('every source is described once, with what its file is sent as', () => {
    const keys = reg.IMPORT_SOURCES.map(s => s.key);
    assert.equal(new Set(keys).size, keys.length, 'no source twice');
    assert.equal(keys.length, 43, "every source the import page offers");
    for (const source of reg.IMPORT_SOURCES) {
      assert.ok(source.product || source.name, source.key);
      assert.ok(['text', 'json', 'excel', 'rows'].includes(source.send), `${source.key} send`);
      assert.ok(source.paste || (source.files && source.files.length), `${source.key} can be given somehow`);
      for (const ext of source.files || []) assert.match(ext, /^\.[a-z]+$/, `${source.key} ${ext}`);
    }
    assert.equal(reg.acceptFor('vikunja'), '.zip,.json');
    assert.equal(reg.zipIsOneExport('notion'), true);
    assert.equal(reg.zipIsOneExport('todoist'), false);
    assert.equal(reg.importSource('nope'), null, 'negative: an unknown source is nothing');
  });

  test('the server knows every source the registry names, and the generalized ones are parsed', () => {
    const shape = read('models/lib/importSourceShape.js');
    const importJs = read('models/import.js');
    for (const source of reg.IMPORT_SOURCES) {
      assert.match(shape, new RegExp(`case '${source.key}':`), `${source.key} has a shape check`);
      if (source.creator === 'generalized' && !['leo', 'opml', 'kanboard'].includes(source.key)) {
        assert.equal(typeof EXTERNAL_PARSERS[source.key], 'function', `${source.key} has a parser`);
      }
      if (source.zipSend === 'zip') assert.match(importJs, new RegExp(`case '${source.key}':[\\s\\S]{0,800}?zip`, 'i'), `${source.key} reads its .zip on the server`);
    }
    assert.match(importJs, /new KanboardCreator\(data, 'leo'\)/);
  });

  test('the many-files lists are read from it', () => {
    assert.deepEqual(many.EXCEL_SOURCES, reg.IMPORT_SOURCES.filter(s => s.send === 'excel').map(s => s.key));
    assert.deepEqual(many.ZIP_EXPORT_SOURCES.sort(), ['notion', 'plane', 'vikunja', 'wekan']);
    assert.deepEqual(many.OWN_CREATOR_SOURCES.sort(), ['csv', 'excel', 'jira', 'trello', 'wekan']);
    // api.py cannot import JavaScript; its lists must agree by hand.
    const api = read('api.py');
    assert.match(api, new RegExp(`EXCEL_IMPORT_SOURCES = \\{${many.EXCEL_SOURCES.map(k => `'${k}'`).join(', ')}\\}`));
  });

  test('the page reads every source through one path, with one file chooser', () => {
    const page = read('client/components/import/import.js');
    assert.match(page, /import \{ IMPORT_SOURCES, importSource as importSourceSpec, acceptFor \} from '\/models\/lib\/importSources';/);
    assert.match(page, /doc = documentForFile\(dataSource, file\.name \|\| '', new Uint8Array\(await file\.arrayBuffer\(\)\)\);/);
    // Negative: no source has a file-reading branch of its own any more.
    for (const key of ['vikunja', 'notion', 'plane', 'planner', 'monday', 'wrike', 'markdown']) {
      assert.doesNotMatch(page, new RegExp(`if \\(dataSource === '${key}'`), key);
    }
    assert.doesNotMatch(page, /^const IMPORT_SOURCES = \[/m, 'no second list');
    const jade = read('client/components/import/import.jade');
    assert.equal((jade.match(/type="file"/g) || []).length, 3, 'one file chooser, Trello\'s package and Import many boards');
    assert.match(jade, /input\.js-import-file\(id='import-file' type="file" accept="\{\{importAccept\}\}"\)/);
  });

  console.log(`\nimportSources: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
