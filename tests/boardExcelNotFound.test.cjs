'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const exportFields = require('../models/lib/exportFields');

function fixture({ board, disabled = false, lookupError } = {}) {
  let handler;
  const calls = [];
  class Exporter {
    constructor() { calls.push('exporter'); }
    async build(res) { calls.push('build'); res.end('workbook'); }
  }
  const context = {
    runOnServer: fn => fn(),
    ReactiveCache: { async getBoard(id) {
      calls.push(['board', id]);
      if (lookupError) throw lookupError;
      return board;
    } },
    Meteor: { settings: { public: {} } },
    require(name) {
      switch (name) {
        case './server/ExporterExcel': return { ExporterExcel: Exporter };
        case './server/ExporterExcelBoard': return { ExporterExcelBoard: Exporter };
        case '/models/lib/exportFields': return exportFields;
        case 'meteor/webapp': return { WebApp: { handlers: { get(url, fn) {
          assert.equal(url, '/api/boards/:boardId/exportExcel');
          handler = fn;
        } } } };
        case '/server/apiMiddleware': return { safeRoute: fn => fn };
        case '/server/authentication': return { Authentication: { async checkUserId() {
          calls.push('authenticate');
          throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
        } } };
        case '/models/lib/importExportSecurity': return { async refuseDisabledExport(res) {
          if (!disabled) return false;
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Export disabled');
          return true;
        } };
        default: throw new Error(`Unexpected module: ${name}`);
      }
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../models/exportExcel.js'), 'utf8');
  vm.runInNewContext(source.replace(/^import .*;\r?\n/gm, ''), context);
  assert.equal(typeof handler, 'function');
  return {
    calls,
    async get(query = {}) {
      const res = {
        statusCode: 200,
        headers: {},
        ends: 0,
        writeHead(status, headers) { this.statusCode = status; this.headers = headers; },
        end(body) { this.body = body; this.ends += 1; },
      };
      await handler({ params: { boardId: 'board' }, query }, res);
      assert.equal(res.ends, 1, 'respond exactly once');
      return res;
    },
  };
}

for (const query of [{}, { authToken: 'token' }]) {
  test(`a missing board returns plain-text 404 ${query.authToken ? 'with a token' : 'anonymously'}`, async () => {
    const f = fixture();
    const res = await f.get(query);
    assert.equal(res.statusCode, 404);
    assert.equal(res.headers['Content-Type'], 'text/plain; charset=utf-8');
    assert.equal(res.body, 'Board not found');
    assert.deepEqual(f.calls, [['board', 'board']]);
  });
}

for (const query of [{}, { fields: 'description' }]) {
  test(`an existing public board still builds ${query.fields ? 'the table' : 'the card layout'}`, async () => {
    const f = fixture({ board: { isPublic: () => true } });
    const res = await f.get(query);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, 'workbook');
    assert.deepEqual(f.calls, [['board', 'board'], 'exporter', 'build']);
  });
}

test('an existing private board still requires authentication', async () => {
  const f = fixture({ board: { isPublic: () => false } });
  const res = await f.get();
  assert.equal(res.statusCode, 403);
  assert.equal(res.body, 'Unauthorized');
  assert.deepEqual(f.calls, [['board', 'board'], 'authenticate']);
});

test('disabled exports are refused before looking up a board', async () => {
  const f = fixture({ disabled: true });
  assert.equal((await f.get()).statusCode, 403);
  assert.deepEqual(f.calls, []);
});

test('a database failure is not misreported as a missing board', async () => {
  const error = new Error('database unavailable');
  await assert.rejects(() => fixture({ lookupError: error }).get(), error);
});
