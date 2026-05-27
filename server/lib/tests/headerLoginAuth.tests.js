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

    process.env.HEADER_LOGIN_ID = envBackup.HEADER_LOGIN_ID;
    process.env.HEADER_LOGIN_EMAIL = envBackup.HEADER_LOGIN_EMAIL;
    process.env.HEADER_LOGIN_FIRSTNAME = envBackup.HEADER_LOGIN_FIRSTNAME;
    process.env.HEADER_LOGIN_LASTNAME = envBackup.HEADER_LOGIN_LASTNAME;
    process.env.HEADER_LOGIN_TRUSTED_IP = envBackup.HEADER_LOGIN_TRUSTED_IP;
    process.env.HEADER_LOGIN_TRUSTED_IPS = envBackup.HEADER_LOGIN_TRUSTED_IPS;
  });

  it('reads mapped header name case-insensitively', function () {
    const req = { headers: { 'x-auth-user': 'Alice' } };
    const value = getHeaderByName(req, 'X-Auth-User');
    expect(value).to.equal('Alice');
  });

  it('extracts first forwarded IP when available', function () {
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    expect(getRequestIp(req)).to.equal('10.0.0.1');
  });

  it('validates trusted proxy IP list', function () {
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.0.0.1,10.0.0.2';

    const trustedReq = { headers: { 'x-forwarded-for': '10.0.0.2' } };
    const untrustedReq = { headers: { 'x-forwarded-for': '10.0.0.9' } };

    expect(isTrustedHeaderLoginSource(trustedReq)).to.equal(true);
    expect(isTrustedHeaderLoginSource(untrustedReq)).to.equal(false);
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
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
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
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
    };

    const userId = await findOrCreateHeaderLoginUser(req);
    expect(userId).to.equal('new-user-id');
    expect(insertUserDocStub.calledOnce).to.equal(true);
  });
});
