/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  authenticateApiRequest,
} from '/server/routes/attachmentApi';

describe('attachmentApi auth context', function () {
  let findOneAsyncStub;
  let hashTokenStub;
  const envBackup = {
    HEADER_LOGIN_ID: process.env.HEADER_LOGIN_ID,
    HEADER_LOGIN_EMAIL: process.env.HEADER_LOGIN_EMAIL,
    HEADER_LOGIN_TRUSTED_IPS: process.env.HEADER_LOGIN_TRUSTED_IPS,
    HEADER_LOGIN_TRUSTED_IP: process.env.HEADER_LOGIN_TRUSTED_IP,
  };

  afterEach(function () {
    if (findOneAsyncStub) {
      findOneAsyncStub.restore();
      findOneAsyncStub = null;
    }
    if (hashTokenStub) {
      hashTokenStub.restore();
      hashTokenStub = null;
    }

    process.env.HEADER_LOGIN_ID = envBackup.HEADER_LOGIN_ID;
    process.env.HEADER_LOGIN_EMAIL = envBackup.HEADER_LOGIN_EMAIL;
    process.env.HEADER_LOGIN_TRUSTED_IPS = envBackup.HEADER_LOGIN_TRUSTED_IPS;
    process.env.HEADER_LOGIN_TRUSTED_IP = envBackup.HEADER_LOGIN_TRUSTED_IP;
  });

  it('prefers req.userId when accounts-express already authenticated the request', async function () {
    const userId = await authenticateApiRequest({ userId: 'express-user', headers: {} });
    expect(userId).to.equal('express-user');
  });

  it('accepts trusted header login identity when configured', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_EMAIL = 'x-auth-email';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.1.1.1';

    findOneAsyncStub = sinon.stub(Meteor.users, 'findOneAsync');
    findOneAsyncStub.onFirstCall().resolves({ _id: 'header-user-id' });

    const userId = await authenticateApiRequest({
      headers: {
        'x-forwarded-for': '10.1.1.1',
        'x-auth-user': 'header.user',
        'x-auth-email': 'header.user@example.com',
      },
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
    });

    expect(userId).to.equal('header-user-id');
    expect(findOneAsyncStub.calledOnce).to.equal(true);
  });

  it('rejects untrusted source when trusted IP allowlist is configured', async function () {
    process.env.HEADER_LOGIN_ID = 'x-auth-user';
    process.env.HEADER_LOGIN_TRUSTED_IPS = '10.1.1.1';

    let thrown;
    try {
      await authenticateApiRequest({
        headers: {
          'x-forwarded-for': '10.2.2.2',
          'x-auth-user': 'header.user',
        },
        socket: { remoteAddress: '127.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).to.exist;
    expect(thrown.error).to.equal('unauthorized');
    expect(String(thrown.reason || thrown.message)).to.include('trusted');
  });

  it('falls back to legacy x-user-id + x-auth-token auth when header login is disabled', async function () {
    delete process.env.HEADER_LOGIN_ID;
    delete process.env.HEADER_LOGIN_EMAIL;
    delete process.env.HEADER_LOGIN_TRUSTED_IPS;
    delete process.env.HEADER_LOGIN_TRUSTED_IP;

    hashTokenStub = sinon.stub(Accounts, '_hashLoginToken').returns('hashed-legacy-token');
    findOneAsyncStub = sinon.stub(Meteor.users, 'findOneAsync').resolves({ _id: 'legacy-user' });

    const userId = await authenticateApiRequest({
      headers: {
        'x-user-id': 'legacy-user',
        'x-auth-token': 'legacy-token',
      },
    });

    expect(userId).to.equal('legacy-user');
    expect(hashTokenStub.calledOnceWith('legacy-token')).to.equal(true);
    expect(findOneAsyncStub.calledOnce).to.equal(true);
  });
});
