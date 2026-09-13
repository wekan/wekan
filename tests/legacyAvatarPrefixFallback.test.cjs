const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync('server/lib/legacyAvatarRead.js', 'utf8');
function load({ user = 'member', metadata = { _id: 'avatar' }, stream = {} } = {}) {
  const calls = [];
  const context = {
    getUserIdFromRequest: async () => { calls.push('auth'); return user; },
    getOldAttachmentData: async (id, bucket) => { calls.push(['metadata', id, bucket]); return metadata; },
    getOldAttachmentStream: async (id, bucket) => { calls.push(['stream', id, bucket]); return stream; },
  };
  vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  return { read: context.readAuthenticatedLegacyAvatar, calls };
}
test('authenticated legacy avatar streams from the avatars bucket', async () => {
  const { read, calls } = load();
  assert.equal((await read({}, 'avatar')).avatar._id, 'avatar');
  assert.deepEqual(calls, ['auth', ['metadata', 'avatar', 'avatars'], ['stream', 'avatar', 'avatars']]);
});
test('anonymous public-board context cannot unlock legacy avatar metadata', async () => {
  const { read, calls } = load({ user: null });
  assert.equal(await read({ url: '/avatar?boardId=public' }, 'avatar'), null);
  assert.deepEqual(calls, ['auth']);
});
test('missing records and missing binaries remain unavailable', async () => {
  const missing = load({ metadata: null });
  assert.equal(await missing.read({}, 'avatar'), null);
  assert.equal(missing.calls.length, 2);
  assert.equal(await load({ stream: null }).read({}, 'avatar'), null);
});
test('both avatar prefix routes perform authenticated legacy fallback before 404', () => {
  const server = fs.readFileSync('server/routes/universalFileServer.js', 'utf8');
  for (const prefix of ['/cdn/storage/avatars', '/cfs/files/avatars']) {
    const start = server.indexOf(`WebApp.handlers.use('${prefix}'`);
    const end = server.indexOf('\n  });', start);
    const route = server.slice(start, end);
    assert.match(route, /readAuthenticatedLegacyAvatar\(req, (?:fileId|avatarId)\)/);
    assert.match(route, /streamFile\(res, legacy.stream, legacy.avatar\)/);
    assert.ok(route.indexOf('readAuthenticatedLegacyAvatar') < route.indexOf('res.writeHead(404)'));
    assert.match(route, /legacy.stream.destroy\(\)/);
  }
});
