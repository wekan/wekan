/* eslint-env mocha */
// #2460: SQRL against the running server - the real /sqrl route, MongoDB
// storage and the login handler - with a software SQRL client.
import crypto from 'node:crypto';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { expect } from 'chai';
import Settings from '/models/settings';

const { encodeNameValues, parseNameValues, fromBase64url, toBase64url, TIF } = require('/models/lib/sqrl');

function identity() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return { key: publicKey.export({ format: 'jwk' }).x, privateKey };
}

async function post(at, fields, id) {
  const client = encodeNameValues({ ver: 1, idk: id.key, opt: 'noiptest', ...fields });
  const ids = crypto.sign(null, Buffer.from(client + at.server, 'utf8'), id.privateKey).toString('base64url');
  const res = await fetch(Meteor.absoluteUrl(`sqrl?nut=${encodeURIComponent(at.nut)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client, server: at.server, ids }).toString(),
  });
  const raw = await res.text();
  const reply = parseNameValues(fromBase64url(raw));
  return { tif: parseInt(reply.tif, 16), next: { nut: reply.nut, server: raw } };
}

const sqrlHandler = () => Accounts._loginHandlers.find(h => h.name === 'sqrl').handler;

describe('sqrl (runtime)', function () {
  this.timeout(20000);
  let rootUrl;
  let settingId;
  let userId;

  before(async function () {
    rootUrl = process.env.ROOT_URL;
    const setting = await Settings.findOneAsync({});
    settingId = setting && setting._id;
    userId = await Meteor.users.insertAsync({ username: `sqrl-${Date.now()}`, profile: {} });
  });

  after(async function () {
    process.env.ROOT_URL = rootUrl;
    if (settingId) await Settings.updateAsync(settingId, { $unset: { sqrlEnabled: 1 } });
    await Meteor.users.removeAsync(userId);
  });

  it('is off by default: no session, no route, no login', async function () {
    let error;
    try { await Meteor.server.method_handlers.sqrlStart.call({ userId: null, connection: null }, 'login'); } catch (e) { error = e; }
    expect(error && error.error).to.equal('sqrl-not-enabled');
    const res = await fetch(Meteor.absoluteUrl('sqrl?nut=x'), { method: 'POST', body: 'client=a' });
    expect(res.status).to.equal(404);
    const result = await sqrlHandler()({ sqrl: { session: 'x', secret: 'y' } });
    expect(result.error).to.exist;
  });

  it('adds an identity, then signs in with it once', async function () {
    if (!settingId) this.skip();
    await Settings.updateAsync(settingId, { $set: { sqrlEnabled: true } });
    // SQRL is per https site; the route itself is reached over the test port.
    process.env.ROOT_URL = 'https://wekan.example.org';
    const alice = identity();
    const unlock = identity();
    const call = (name, ...args) => Meteor.server.method_handlers[name].call({ userId, connection: { clientAddress: '127.0.0.1' } }, ...args);

    const add = await call('sqrlStart', 'associate');
    expect(add.link).to.match(/^sqrl:\/\/wekan\.example\.org\/sqrl\?nut=/);
    let r = await post({ nut: add.session, server: toBase64url(add.link) }, { cmd: 'query' }, alice);
    expect(r.tif & TIF.ID_MATCH).to.equal(0);
    r = await post(r.next, { cmd: 'ident', suk: crypto.randomBytes(32).toString('base64url'), vuk: unlock.key }, alice);
    expect(r.tif & TIF.COMMAND_FAILED).to.equal(0);
    expect(await call('sqrlPoll', add.session, add.secret)).to.equal('done');
    expect((await Meteor.users.findOneAsync(userId)).sqrl.idk).to.equal(alice.key);

    const login = await Meteor.server.method_handlers.sqrlStart.call({ userId: null, connection: { clientAddress: '127.0.0.1' } }, 'login');
    r = await post({ nut: login.session, server: toBase64url(login.link) }, { cmd: 'ident' }, alice);
    expect(r.tif & TIF.ID_MATCH).to.equal(TIF.ID_MATCH);
    expect(await call('sqrlPoll', login.session, login.secret)).to.equal('ready');
    expect(await call('sqrlPoll', login.session, 'not the secret')).to.equal('expired', 'nobody else can watch it');
    const wrong = await sqrlHandler()({ sqrl: { session: login.session, secret: 'not the secret' } });
    expect(wrong.error).to.exist;
    const signedIn = await sqrlHandler()({ sqrl: { session: login.session, secret: login.secret } });
    expect(signedIn.userId).to.equal(userId);
    const again = await sqrlHandler()({ sqrl: { session: login.session, secret: login.secret } });
    expect(again.error, 'used once').to.exist;
  });
});
