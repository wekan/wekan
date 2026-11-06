'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../models/export.js'), 'utf8');
const start = source.indexOf("  WebApp.handlers.get('/api/boards/:boardId/export/csv'");
const end = source.indexOf('\n  }));', start) + '\n  }));'.length;
assert.ok(start >= 0 && end > start, 'CSV route exists');
const fieldsSource = fs.readFileSync(path.join(__dirname, '../models/lib/exportFields.js'), 'utf8');
const { parseExportFields, BOARD_EXPORT_FIELD_KEYS } = new Function(
  fieldsSource.replace(/export \{[\s\S]*?\};/, '')
    + '\nreturn { parseExportFields, BOARD_EXPORT_FIELD_KEYS };',
)();
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ isPublic = true, missing = false, disabled = false, allowed = true } = {}) {
  let handler;
  const exports = [];
  const user = { _id: 'member', profile: { language: 'en' } };
  vm.runInNewContext(source.slice(start, end), {
    WebApp: { handlers: { get(route, callback) { handler = callback; } } },
    safeRoute: callback => callback,
    require(name) {
      if (name === '/models/lib/importExportSecurity') return {
        async refuseDisabledExport(res) {
          if (disabled) { res.writeHead(403); res.end('Export disabled'); }
          return disabled;
        },
      };
      if (name === '/server/lib/activeUser') return { async activeUserByToken() { return user; } };
      throw new Error(`Unexpected require: ${name}`);
    },
    ReactiveCache: {
      async getBoard() { return missing ? null : { isPublic: () => isPublic }; },
      async getImpersonatedUser() { return false; },
    },
    Exporter: class {
      constructor(boardId, attachmentId, options = {}) {
        this.record = { boardId, attachmentId, options: plain(options) };
        exports.push(this.record);
      }
      async canExport(viewer) { assert.equal(viewer, user); return allowed; }
      async buildCsvStream(res, delimiter, language) {
        Object.assign(this.record, { delimiter, language });
        res.write('csv');
      }
    },
    parseExportFields, BOARD_EXPORT_FIELD_KEYS,
    logExportDenied() {},
  });
  return {
    exports,
    async get(query) {
      const res = {
        status: null, chunks: [], ended: false,
        writeHead(status, headers) { this.status = status; this.headers = headers || {}; },
        write(chunk) { this.chunks.push(chunk); },
        end(chunk) { if (chunk) this.chunks.push(chunk); this.ended = true; },
      };
      await handler({ params: { boardId: 'board' }, query }, res);
      assert.equal(res.ended, true);
      return res;
    },
  };
}

for (const delimiter of [',', ';', '\t']) {
  test(`public and private exports pass the same validated fields (${JSON.stringify(delimiter)})`, async () => {
    for (const isPublic of [true, false]) {
      const f = fixture({ isPublic });
      const res = await f.get({ delimiter, fields: ' description,unknown,dates ', authToken: 'token' });
      assert.equal(res.status, 200);
      assert.deepEqual(f.exports, [{
        boardId: 'board', attachmentId: undefined,
        options: { fields: ['description', 'dates'] }, delimiter, language: 'en',
      }]);
      assert.equal(res.headers['Content-Type'], delimiter === '\t' ? 'text/tsv' : 'text/csv; charset=utf-8');
      assert.equal(res.chunks.length, delimiter === '\t' ? 1 : 2, 'CSV retains its BOM');
    }
  });
}

for (const fields of [undefined, '', 'unknown', ['description']]) {
  test(`public export keeps all columns for absent or invalid selection ${JSON.stringify(fields)}`, async () => {
    const f = fixture();
    assert.equal((await f.get({ fields })).status, 200);
    assert.equal(f.exports[0].options.fields, null);
  });
}

for (const options of [{ missing: true }, { disabled: true }, { isPublic: false, allowed: false }]) {
  test(`field selection does not bypass export guards ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    const res = await f.get({ fields: 'description', authToken: 'token' });
    assert.equal(res.status, options.missing ? 404 : 403);
    assert.ok(f.exports.every(record => record.delimiter === undefined), 'no CSV was streamed');
  });
}
