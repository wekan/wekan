/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import {
  getRequestIp,
  isTrustedHeaderLoginSource,
  findOrCreateHeaderLoginUser,
} from '/server/lib/headerLoginAuth';

// Regression tests for the ProxyBleed fix: header-login IP allowlist bypass via
// X-Forwarded-For spoofing (GHSA-jggc-qvfc-jr6x, CWE-290 / CWE-348).
//
// Before the fix, the source IP used for the HEADER_LOGIN_TRUSTED_IPS allowlist
// was taken from the client-controlled X-Forwarded-For header. An unauthenticated
// attacker who could reach the app port directly sent a single GET with a spoofed
// `X-Forwarded-For: <allowlisted-ip>` plus the username header and was minted a
// full passwordless session for any user, including admin. An unset allowlist
// also failed open. See https://wekan.fi/hall-of-fame/proxybleed/ and the
// Upcoming release CHANGELOG entry.
describe('ProxyBleed header-login allowlist (GHSA-jggc-qvfc-jr6x)', function () {
  const envKeys = [
    'HEADER_LOGIN_ID',
    'HEADER_LOGIN_EMAIL',
    'HEADER_LOGIN_TRUSTED_IP',
    'HEADER_LOGIN_TRUSTED_IPS',
    'HEADER_LOGIN_TRUSTED_PROXIES',
  ];
  const envBackup = {};

  beforeEach(function () {
    envKeys.forEach(key => {
      envBackup[key] = process.env[key];
      delete process.env[key];
    });
  });

  afterEach(function () {
    sinon.restore();
    envKeys.forEach(key => {
      if (envBackup[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = envBackup[key];
      }
    });
  });

  // Mirrors the published PoC: the allowlist is set to a trusted-proxy IP
  // (10.9.9.9) that is NOT the attacker's real address (a docker bridge IP).
  describe('source IP can no longer be spoofed via X-Forwarded-For', function () {
    beforeEach(function () {
      process.env.HEADER_LOGIN_TRUSTED_IPS = '10.9.9.9';
    });

    it('control: no X-Forwarded-For, untrusted socket peer => rejected', function () {
      const req = {
        headers: { 'x-auth-user': 'admin' },
        socket: { remoteAddress: '172.17.0.5' },
      };
      expect(isTrustedHeaderLoginSource(req)).to.equal(false);
    });

    it('control 2: bogus non-trusted X-Forwarded-For => rejected', function () {
      const req = {
        headers: { 'x-auth-user': 'admin', 'x-forwarded-for': '1.2.3.4' },
        socket: { remoteAddress: '172.17.0.5' },
      };
      expect(isTrustedHeaderLoginSource(req)).to.equal(false);
    });

    it('exploit: a spoofed allowlisted X-Forwarded-For no longer makes the source trusted', function () {
      // The exact PoC request: attacker on the docker bridge spoofs the trusted IP.
      const req = {
        headers: { 'x-auth-user': 'admin', 'x-forwarded-for': '10.9.9.9' },
        socket: { remoteAddress: '172.17.0.5' },
      };
      // The header is ignored; the real socket peer is used.
      expect(getRequestIp(req)).to.equal('172.17.0.5');
      expect(isTrustedHeaderLoginSource(req)).to.equal(false);
    });

    it('the genuine reverse proxy (real socket peer on the allowlist) is still trusted', function () {
      const req = {
        headers: { 'x-auth-user': 'admin' },
        socket: { remoteAddress: '10.9.9.9' },
      };
      expect(isTrustedHeaderLoginSource(req)).to.equal(true);
    });
  });

  it('fails closed when the allowlist is unset (no longer trusts all sources)', function () {
    const req = { socket: { remoteAddress: '10.9.9.9' } };
    expect(isTrustedHeaderLoginSource(req)).to.equal(false);
  });

  it('findOrCreateHeaderLoginUser rejects the spoofed-admin attack before any user lookup', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.9.9.9';
    const findOneStub = sinon.stub(Meteor.users, 'findOneAsync');

    const req = {
      headers: { 'x-auth-user': 'admin', 'x-forwarded-for': '10.9.9.9' },
      socket: { remoteAddress: '172.17.0.5' },
    };

    let thrown;
    try {
      await findOrCreateHeaderLoginUser(req);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).to.exist;
    expect(thrown.error).to.equal('unauthorized');
    // The named identity is never even looked up — rejected at the gate.
    expect(findOneStub.called).to.equal(false);
  });

  // Opt-in multi-proxy support must not reopen the bypass: X-Forwarded-For is only
  // honored when the immediate TCP peer is itself an explicitly trusted proxy.
  describe('opt-in multi-proxy support (HEADER_LOGIN_TRUSTED_PROXIES)', function () {
    it('honors X-Forwarded-For from a trusted proxy, taking the right-most untrusted hop', function () {
      process.env.HEADER_LOGIN_TRUSTED_PROXIES = '10.0.0.1,10.0.0.2';
      process.env.HEADER_LOGIN_TRUSTED_IPS = '203.0.113.5';
      const viaProxy = {
        headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.2' },
        socket: { remoteAddress: '10.0.0.1' },
      };
      expect(getRequestIp(viaProxy)).to.equal('203.0.113.5');
      expect(isTrustedHeaderLoginSource(viaProxy)).to.equal(true);
    });

    it('still ignores X-Forwarded-For from a non-proxy (direct) peer', function () {
      process.env.HEADER_LOGIN_TRUSTED_PROXIES = '10.0.0.1';
      process.env.HEADER_LOGIN_TRUSTED_IPS = '203.0.113.5';
      // Attacker connects directly and spoofs the allowlisted client IP.
      const direct = {
        headers: { 'x-forwarded-for': '203.0.113.5' },
        socket: { remoteAddress: '198.51.100.7' },
      };
      expect(getRequestIp(direct)).to.equal('198.51.100.7');
      expect(isTrustedHeaderLoginSource(direct)).to.equal(false);
    });
  });
});
