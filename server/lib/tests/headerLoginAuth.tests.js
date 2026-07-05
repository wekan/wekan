/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  getHeaderByName,
  getRequestIp,
  isTrustedHeaderLoginSource,
  shouldProcessHeaderLoginMiddlewareRequest,
  findOrCreateHeaderLoginUser,
} from '/server/lib/headerLoginAuth';

describe('header login auth helpers', function () {
  const envBackup = {
    HEADER_LOGIN_ID: process.env.HEADER_LOGIN_ID,
    HEADER_LOGIN_EMAIL: process.env.HEADER_LOGIN_EMAIL,
    HEADER_LOGIN_FIRSTNAME: process.env.HEADER_LOGIN_FIRSTNAME,
    HEADER_LOGIN_LASTNAME: process.env.HEADER_LOGIN_LASTNAME,
    HEADER_LOGIN_TRUSTED_IP: process.env.HEADER_LOGIN_TRUSTED_IP,
    HEADER_LOGIN_TRUSTED_IPS: process.env.HEADER_LOGIN_TRUSTED_IPS,
    HEADER_LOGIN_TRUSTED_PROXIES: process.env.HEADER_LOGIN_TRUSTED_PROXIES,
  };

  let usersFindOneAsyncStub;
  let insertUserDocStub;

  afterEach(function () {
    if (usersFindOneAsyncStub) {
      usersFindOneAsyncStub.restore();
      usersFindOneAsyncStub = null;
    }
    if (insertUserDocStub) {
      insertUserDocStub.restore();
      insertUserDocStub = null;
    }

    // Restore env vars. IMPORTANT: assigning `process.env.X = undefined` stores
    // the STRING "undefined" (process.env coerces to string), which is truthy —
    // and isTrustedHeaderLoginSource checks HEADER_LOGIN_TRUSTED_IP first
    // (`TRUSTED_IP || TRUSTED_IPS`), so a leaked "undefined" shadowed the plural
    // var later tests set and made every trusted source read as untrusted. Delete
    // the var instead of stringifying undefined.
    for (const key of Object.keys(envBackup)) {
      if (envBackup[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = envBackup[key];
      }
    }
  });

  it('reads mapped header name case-insensitively', function () {
    const req = { headers: { 'x-auth-user': 'Alice' } };
    const value = getHeaderByName(req, 'X-Auth-User');
    expect(value).to.equal('Alice');
  });

  it('derives the source IP from the socket peer and ignores X-Forwarded-For', function () {
    // GHSA-jggc-qvfc-jr6x: the spoofable X-Forwarded-For header must NOT be used;
    // the real TCP peer address is authoritative.
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
      socket: { remoteAddress: '203.0.113.7' },
    };
    expect(getRequestIp(req)).to.equal('203.0.113.7');
  });

  it('normalizes IPv4-mapped IPv6 socket addresses', function () {
    expect(getRequestIp({ socket: { remoteAddress: '::ffff:10.0.0.5' } })).to.equal('10.0.0.5');
  });

  it('honors X-Forwarded-For only via a trusted proxy, taking the right-most untrusted hop', function () {
    process.env.HEADER_LOGIN_TRUSTED_PROXIES = '10.0.0.1,10.0.0.2';
    // client(203.0.113.5) -> edge proxy(10.0.0.2) -> inner proxy(10.0.0.1) -> wekan.
    // The immediate socket peer is the trusted inner proxy; the right-most XFF hop
    // that is not itself a trusted proxy is the real client.
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.2' },
      socket: { remoteAddress: '10.0.0.1' },
    };
    expect(getRequestIp(req)).to.equal('203.0.113.5');
  });

  it('ignores X-Forwarded-For when the immediate peer is not a trusted proxy', function () {
    process.env.HEADER_LOGIN_TRUSTED_PROXIES = '10.0.0.1';
    // Attacker connects directly (untrusted peer) and spoofs a trusted XFF chain.
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 203.0.113.5' },
      socket: { remoteAddress: '203.0.113.9' },
    };
    expect(getRequestIp(req)).to.equal('203.0.113.9');
  });

  it('with trusted proxies, allowlists the real client IP and still blocks a direct spoofer', function () {
    process.env.HEADER_LOGIN_TRUSTED_PROXIES = '10.0.0.1';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '203.0.113.5';
    // Legitimate request via the trusted proxy: real client is the allowlisted IP.
    const viaProxy = {
      headers: { 'x-forwarded-for': '203.0.113.5' },
      socket: { remoteAddress: '10.0.0.1' },
    };
    // Attacker connects directly and spoofs the allowlisted client IP in XFF.
    const direct = {
      headers: { 'x-forwarded-for': '203.0.113.5' },
      socket: { remoteAddress: '198.51.100.7' },
    };
    expect(isTrustedHeaderLoginSource(viaProxy)).to.equal(true);
    expect(isTrustedHeaderLoginSource(direct)).to.equal(false);
  });

  it('trusts only requests whose real socket peer is allowlisted (X-Forwarded-For is ignored)', function () {
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.0.0.1,10.0.0.2';

    // A spoofed allowlisted X-Forwarded-For cannot make an untrusted peer trusted.
    const spoofed = {
      headers: { 'x-forwarded-for': '10.0.0.2' },
      socket: { remoteAddress: '203.0.113.9' },
    };
    // The genuine reverse proxy connects from an allowlisted address.
    const trusted = {
      headers: { 'x-forwarded-for': '1.2.3.4' },
      socket: { remoteAddress: '10.0.0.2' },
    };
    const untrusted = { socket: { remoteAddress: '10.0.0.9' } };

    expect(isTrustedHeaderLoginSource(spoofed)).to.equal(false);
    expect(isTrustedHeaderLoginSource(trusted)).to.equal(true);
    expect(isTrustedHeaderLoginSource(untrusted)).to.equal(false);
  });

  it('fails closed when no trusted IP allowlist is configured', function () {
    delete process.env.HEADER_LOGIN_TRUSTED_IP;
    delete process.env.HEADER_LOGIN_TRUSTED_IPS;

    const req = { socket: { remoteAddress: '10.0.0.1' } };
    expect(isTrustedHeaderLoginSource(req)).to.equal(false);
  });

  it('skips middleware processing for API and SockJS routes', function () {
    const apiReq = { method: 'GET', url: '/api/attachment/list/abc', headers: {} };
    const sockReq = { method: 'GET', url: '/sockjs/info', headers: {} };
    const normalReq = { method: 'GET', url: '/boards', headers: {} };

    expect(shouldProcessHeaderLoginMiddlewareRequest(apiReq)).to.equal(false);
    expect(shouldProcessHeaderLoginMiddlewareRequest(sockReq)).to.equal(false);
    expect(shouldProcessHeaderLoginMiddlewareRequest(normalReq)).to.equal(true);
  });

  it('skips middleware processing when meteor_login_token cookie exists', function () {
    const req = {
      method: 'GET',
      url: '/boards',
      headers: { cookie: 'meteor_login_token=sometoken; foo=bar' },
    };
    expect(shouldProcessHeaderLoginMiddlewareRequest(req)).to.equal(false);
  });

  it('returns existing user id from trusted header identity', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_EMAIL = 'x-auth-email';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.0.0.1';

    usersFindOneAsyncStub = sinon.stub(Meteor.users, 'findOneAsync');
    usersFindOneAsyncStub.onFirstCall().resolves({ _id: 'user-1' });

    const req = {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'x-auth-user': 'alice',
        'x-auth-email': 'alice@example.com',
      },
      socket: { remoteAddress: '10.0.0.1' },
      connection: { remoteAddress: '10.0.0.1' },
    };

    const userId = await findOrCreateHeaderLoginUser(req);
    expect(userId).to.equal('user-1');
  });

  it('creates a user when trusted header identity is unknown', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_EMAIL = 'x-auth-email';
    process.env.HEADER_LOGIN_FIRSTNAME = 'x-first-name';
    process.env.HEADER_LOGIN_LASTNAME = 'x-last-name';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.0.0.1';

    usersFindOneAsyncStub = sinon.stub(Meteor.users, 'findOneAsync');
    usersFindOneAsyncStub.onFirstCall().resolves(null);
    usersFindOneAsyncStub.onSecondCall().resolves(null);
    usersFindOneAsyncStub.onThirdCall().resolves({ _id: 'new-user-id' });

    insertUserDocStub = sinon.stub(Accounts, 'insertUserDoc').resolves('new-user-id');

    const req = {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'x-auth-user': 'new.user',
        'x-auth-email': 'new.user@example.com',
        'x-first-name': 'New',
        'x-last-name': 'User',
      },
      socket: { remoteAddress: '10.0.0.1' },
      connection: { remoteAddress: '10.0.0.1' },
    };

    const userId = await findOrCreateHeaderLoginUser(req);
    expect(userId).to.equal('new-user-id');
    expect(insertUserDocStub.calledOnce).to.equal(true);
  });

  it('rejects a spoofed X-Forwarded-For from an untrusted peer (GHSA-jggc-qvfc-jr6x)', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.0.0.1';

    usersFindOneAsyncStub = sinon.stub(Meteor.users, 'findOneAsync');

    // Attacker reaches the app port directly (untrusted socket peer) and spoofs an
    // allowlisted X-Forwarded-For while naming the admin account.
    const req = {
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'x-auth-user': 'admin',
      },
      socket: { remoteAddress: '203.0.113.66' },
      connection: { remoteAddress: '203.0.113.66' },
    };

    let threw = false;
    try {
      await findOrCreateHeaderLoginUser(req);
    } catch (err) {
      threw = true;
      expect(err.error).to.equal('unauthorized');
    }
    expect(threw).to.equal(true);
    // The identity is never even looked up — the request is rejected at the gate.
    expect(usersFindOneAsyncStub.called).to.equal(false);
  });
});
