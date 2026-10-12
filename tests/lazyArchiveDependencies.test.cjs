'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Each subprocess starts with an empty module cache: another workbook test must
// not hide an eager load, or make the first-use assertion pass accidentally.
function run(source) {
  const result = spawnSync(process.execPath, ['--input-type=commonjs', '-e', source], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('workbook helpers defer Excel/Bluebird and still write/read on first use', () => {
  run(`
    const assert = require('node:assert/strict');
    const nativePromise = global.Promise;
    const loaded = () => Object.keys(require.cache).some(p => /(?:exceljs|unzipper|bluebird)[/\\\\]/.test(p));
    (async () => {
      for (const name of ['businessmap', 'monday', 'planner', 'teamwork', 'wrike']) {
        require('./server/lib/' + name + 'Workbook');
      }
      const helpers = await import('./models/server/createWorkbook.js');
      assert.equal(loaded(), false, 'registration must not load archive dependencies');
      const book = helpers.createWorkbook();
      book.addWorksheet('Test').addRow(['first use', 42]);
      const bytes = await book.xlsx.writeBuffer();
      const back = helpers.createWorkbook();
      await back.xlsx.load(bytes);
      assert.equal(back.getWorksheet('Test').getCell('B1').value, 42);
      assert.equal(loaded(), true, 'first operation loads the dependency');
      assert.equal(global.Promise, nativePromise, 'Bluebird must not replace native Promise');
      await assert.rejects(back.xlsx.load(Buffer.from('not an archive')));
    })().catch(e => { console.error(e); process.exitCode = 1; });
  `);
});

test('creating backup tools defers unzipper until archive inspection', () => {
  run(`
    const assert = require('node:assert/strict');
    const { EJSON } = require('bson');
    const tools = require('./server/lib/fullBackup').createBackupTools(EJSON);
    const loaded = () => Object.keys(require.cache).some(p => /(?:unzipper|bluebird)[/\\\\]/.test(p));
    assert.equal(loaded(), false);
    tools.inspectInstanceBackup('/nonexistent-wekan-lazy-archive-test.zip').then(
      () => { throw Error('missing archive accepted'); },
      e => { assert.equal(e.code, 'ENOENT'); assert.equal(loaded(), true); }
    ).catch(e => { console.error(e); process.exitCode = 1; });
  `);
});
