'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

// Execute the registered REST handlers. The Playwright suite verifies actual
// persistence and the feature checkboxes in Admin Panel > People.
for (const [kind, collection, label] of [
  ['org', 'Org', 'Organization'], ['team', 'Team', 'Team'],
]) {
  const source = fs.readFileSync(path.join(__dirname, `../server/models/${kind}.js`), 'utf8');
  const route = `/api/admin/${kind}s/:${kind}Id/features`;
  const start = source.indexOf(`WebApp.handlers.put('${route}'`);
  const end = source.indexOf('\n/**', start);
  assert.ok(start >= 0 && end > start, `${kind} feature route exists`);
  const fields = ['SharedTemplates', 'PropagateMembersToBoards', 'SyncMembersFromAuth']
    .map(suffix => kind + suffix);
  const plain = value => JSON.parse(JSON.stringify(value));

  function fixture({ missing, denied, lookupError } = {}) {
    const calls = [];
    const document = { _id: 'existing', [fields[0]]: false };
    let handler;
    vm.runInNewContext(source.slice(start, end), {
      WebApp: { handlers: { put(url, callback) {
        assert.equal(url, route);
        handler = callback;
      } } },
      Authentication: { async checkUserId(userId) {
        await Promise.resolve();
        calls.push(['authorize', userId]);
        if (denied) throw Object.assign(new Error('Denied'), { statusCode: denied });
      } },
      [`${kind.toUpperCase()}_FEATURE_FIELDS`]: fields,
      [collection]: {
        async updateAsync(id, modifier) {
          calls.push(['update', id, plain(modifier)]);
          if (missing) return 0;
          Object.assign(document, modifier.$set);
          return 1;
        },
        async findOneAsync(id) {
          calls.push(['lookup', id]);
          if (lookupError) throw lookupError;
          return missing ? missing.value : plain(document);
        },
      },
      publicErrorData,
      sendJsonResult(res, result) {
        res.responses.push({ code: result.code, data: result.data && plain(result.data) });
      },
    });
    return {
      calls, document,
      async put(body, id = 'existing', userId = 'admin') {
        const res = { responses: [] };
        await handler({ userId, params: { [`${kind}Id`]: id }, body }, res);
        assert.equal(res.responses.length, 1, 'respond exactly once');
        return res.responses[0];
      },
    };
  }

  for (const value of [undefined, null]) {
    for (const body of [{ [fields[0]]: true }, {}, { unrelated: true }]) {
      test(`${kind}: missing record (${value}), body ${JSON.stringify(body)} returns JSON 404`, async () => {
        const f = fixture({ missing: { value } });
        const before = plain(f.document);
        assert.deepEqual(await f.put(body, 'missing'), {
          code: 404, data: { error: `${label} not found` },
        });
        assert.deepEqual(f.document, before);
        assert.deepEqual(f.calls[0], ['authorize', 'admin']);
        assert.deepEqual(f.calls.at(-1), ['lookup', 'missing']);
        assert.ok(f.calls.filter(call => call[0] === 'update').every(call => call[1] === 'missing'));
      });
    }
  }

  test(`${kind}: existing records still set and clear each whitelisted feature`, async () => {
    const f = fixture();
    for (const field of fields) {
      for (const value of [true, false]) {
        const response = await f.put({ [field]: value, unrelated: true });
        assert.equal(response.code, 200);
        assert.equal(response.data._id, 'existing');
        assert.equal(response.data[field], value);
        assert.equal(f.document[field], value);
        assert.equal(f.document.unrelated, undefined);
      }
    }
    assert.deepEqual(f.calls.slice(0, 3), [
      ['authorize', 'admin'], ['update', 'existing', { $set: { [fields[0]]: true } }],
      ['lookup', 'existing'],
    ]);
  });

  test(`${kind}: empty and unrecognized bodies return an existing record without writing`, async () => {
    for (const body of [undefined, {}, { unrelated: true }]) {
      const f = fixture();
      assert.deepEqual(await f.put(body), { code: 200, data: f.document });
      assert.deepEqual(f.calls, [['authorize', 'admin'], ['lookup', 'existing']]);
    }
  });

  for (const denied of [401, 403]) {
    test(`${kind}: authorization ${denied} precedes lookup and mutation`, async () => {
      const f = fixture({ denied });
      assert.equal((await f.put({ [fields[0]]: true }, 'missing')).code, denied);
      assert.deepEqual(f.calls, [['authorize', 'admin']]);
    });
  }

  test(`${kind}: database failures retain the safe error response`, async () => {
    const f = fixture({ lookupError: new Error('private database detail') });
    assert.deepEqual(await f.put({}), { code: 500, data: { error: 'Internal server error' } });
  });
}
